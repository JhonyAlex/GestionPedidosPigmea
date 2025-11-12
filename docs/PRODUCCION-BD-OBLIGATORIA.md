# 🔴 MODO PRODUCCIÓN: Base de Datos Obligatoria

## Problema Original

El sistema tenía **múltiples capas de fallbacks** que permitían que funcionara sin base de datos:

1. **`postgres-client.js`**: La propiedad `isInitialized` permitía que el sistema continuara sin BD
2. **`auth.js`**: Si la BD no estaba inicializada, usaba headers directamente (modo desarrollo)
3. **`index.js`**: Almacenamiento en memoria (`vendedoresMemory`, etc.) y fallbacks en endpoints
4. **Logs confusos**: Mensajes como "⚠️ BD no inicializada" aparecían en producción

### ⚠️ Riesgos de este comportamiento:
- El sistema parecía funcionar pero podía **perder datos**
- Los usuarios no sabían que había un problema crítico
- Los pedidos se podían mover/crear **sin persistencia real**
- **Imposible distinguir** entre un error temporal y un fallo crítico

---

## ✅ Solución Implementada

### 1. **postgres-client.js** - Modo Estricto en Producción

```javascript
async init() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
        // ... intentar conexión ...
        this.isInitialized = true;
        
    } catch (error) {
        // 🔴 EN PRODUCCIÓN: FALLAR INMEDIATAMENTE
        if (isProduction) {
            console.error('🚨 ERROR CRÍTICO EN PRODUCCIÓN: La base de datos NO está disponible');
            console.error('🚨 El sistema NO puede funcionar sin base de datos');
            console.error('🚨 Deteniendo la aplicación...');
            this.isInitialized = false;
            throw new Error('CRITICAL: Database connection failed in production');
        }
        
        // En desarrollo, intentar recuperación...
    }
}
```

**Resultado**: Si la BD no se conecta en producción, el backend **no arranca**.

---

### 2. **middleware/auth.js** - Autenticación Estricta

```javascript
if (userId) {
    const isProduction = process.env.NODE_ENV === 'production';
    const db = getDbClient();
    
    // En producción, si la BD no está inicializada, fallar inmediatamente
    if (isProduction && !db.isInitialized) {
        console.error('   - 🚨 ERROR CRÍTICO: BD no disponible en producción');
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'La base de datos no está disponible. El sistema no puede procesar solicitudes.'
        });
    }
    
    // Verificar usuario en BD (obligatorio en producción)
    const user = await db.getAdminUserById(userId);
    if (!user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Usuario no válido'
        });
    }
    // ...
}
```

**Resultado**: 
- ✅ **Producción**: Si la BD no está disponible → Error 503 (Service Unavailable)
- ⚠️ **Desarrollo**: Permite fallback a headers (solo para desarrollo local)

---

### 3. **index.js** - Middleware Global de Protección

```javascript
// 🔴 MIDDLEWARE CRÍTICO: Verificar BD en producción (en tiempo real)
app.use(async (req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Rutas excluidas del check
    const excludedPaths = ['/health', '/api/health'];
    const isExcluded = excludedPaths.some(path => req.path === path);
    
    if (isProduction && !isExcluded) {
        // 🔴 VERIFICACIÓN EN TIEMPO REAL: Comprobar si la BD está saludable
        const isHealthy = await dbClient.isConnectionHealthy();
        
        if (!isHealthy) {
            console.error('🚨 PRODUCCIÓN: Bloqueando request porque BD no está disponible');
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'El sistema no puede procesar solicitudes porque la base de datos no está disponible.',
                timestamp: new Date().toISOString(),
                retryAfter: 30
            });
        }
    }
    
    next();
});
```

**Resultado**: 
- ✅ Verifica la conexión a BD **en cada request** (con cache de 5 segundos)
- ✅ Detecta pérdidas de conexión **en tiempo real**
- ✅ Bloquea inmediatamente si la BD no responde

---

### 4. **postgres-client.js** - Health Checks Periódicos

```javascript
// 🔴 NUEVO: Verificar estado de salud en tiempo real
async checkHealth() {
    try {
        const client = await Promise.race([
            this.pool.connect(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), 2000)
            )
        ]);
        
        await client.query('SELECT 1');
        client.release();
        
        this.isHealthy = true;
        return true;
    } catch (error) {
        this.isHealthy = false;
        
        // En producción, marcar como no inicializado
        if (process.env.NODE_ENV === 'production') {
            this.isInitialized = false;
        }
        
        return false;
    }
}

// Verificación periódica cada 10 segundos
startHealthCheckInterval() {
    this.healthCheckTimer = setInterval(async () => {
        const isHealthy = await this.checkHealth();
        
        if (!isHealthy && process.env.NODE_ENV === 'production') {
            console.error('🚨 PRODUCCIÓN: Conexión a BD perdida');
        }
    }, 10000);
}
```

**Resultado**:
- ✅ Verifica la conexión cada **10 segundos** en background
- ✅ Si detecta pérdida de conexión, marca `isInitialized = false`
- ✅ El middleware bloqueará todas las requests automáticamente

---

### 5. **index.js** - Health Check Endpoint Mejorado

```javascript
app.get('/health', async (req, res) => {
    // Verificar salud en tiempo real
    const isHealthy = await dbClient.checkHealth();
    
    if (!isHealthy) {
        return res.status(503).json({
            status: 'unhealthy',
            database: 'PostgreSQL - DISCONNECTED',
            error: 'Database connection lost'
        });
    }
    
    // Si está saludable, devolver estadísticas
    const stats = await dbClient.getStats();
    res.status(200).json({
        status: 'healthy',
        database: 'PostgreSQL',
        ...stats
    });
});
```

**Resultado**: Docker/Dokploy detectará el problema y podrá reiniciar el contenedor automáticamente.

---

### 4. **index.js** - Eliminación de Almacenamiento en Memoria

**Antes:**
```javascript
// === ALMACENAMIENTO EN MEMORIA (modo desarrollo sin BD) ===
const vendedoresMemory = new Map();

app.get('/api/vendedores', async (req, res) => {
    if (!dbClient.isInitialized) {
        const vendedores = Array.from(vendedoresMemory.values());
        return res.status(200).json(vendedores);
    }
    // ...
});
```

**Después:**
```javascript
// Eliminado completamente

app.get('/api/vendedores', async (req, res) => {
    if (!dbClient.isInitialized) {
        return res.status(503).json({ 
            error: 'Service Unavailable',
            message: 'Base de datos no disponible' 
        });
    }
    // ...
});
```

**Resultado**: No hay almacenamiento en memoria. Si la BD falla, el sistema **falla explícitamente**.

---

### 5. **Login** - Protección en Producción

**Antes:**
```javascript
// Fallback: usuarios hardcodeados para desarrollo sin BD
const devUsers = {
    'admin': { password: 'admin123', role: 'Administrador' },
    // ...
};
```

**Después:**
```javascript
// 🔴 PRODUCCIÓN: Si llegamos aquí, la BD no está disponible
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    console.error('🚨 PRODUCCIÓN: BD no disponible - rechazando login');
    return res.status(503).json({ 
        error: 'Service Unavailable',
        message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
    });
}

// SOLO EN DESARROLLO: usuarios hardcodeados
console.log('⚠️ DESARROLLO: Usando autenticación de desarrollo (sin BD)');
const devUsers = { /* ... */ };
```

**Resultado**: En producción, **no se permite login** sin BD.

---

## 🎯 Comportamiento Final

### ✅ EN PRODUCCIÓN (`NODE_ENV=production`)

| Situación | Comportamiento |
|-----------|----------------|
| **BD no se conecta al iniciar** | ❌ Backend NO arranca - proceso termina con error |
| **BD se desconecta durante ejecución** | ❌ Todas las rutas devuelven **503 Service Unavailable** inmediatamente |
| **Intento de login sin BD** | ❌ Error 503 - "Sistema no disponible" |
| **Intento de crear/editar pedidos sin BD** | ❌ Error 503 - Bloqueado por middleware |
| **Health check `/health`** | ⚠️ Devuelve **503 unhealthy** si la BD no responde |
| **BD se reconecta** | ✅ Sistema se recupera automáticamente en 5-10 segundos |

### 🔄 Verificación en Tiempo Real

El sistema ahora tiene **health checks activos** que verifican la conexión cada:
- **5 segundos** (cache del middleware)
- **10 segundos** (verificación periódica en background)

**Ventajas**:
- ✅ Detecta pérdidas de conexión **en tiempo real**
- ✅ Bloquea operaciones **inmediatamente** si la BD no responde
- ✅ Se **recupera automáticamente** cuando la BD vuelve
- ✅ Health check `/health` refleja el estado real

### ⚠️ EN DESARROLLO (`NODE_ENV != production`)

| Situación | Comportamiento |
|-----------|----------------|
| **BD no se conecta al iniciar** | ⚠️ Backend arranca con warning - permite desarrollo sin BD |
| **BD se desconecta durante ejecución** | ⚠️ Permite autenticación con headers |
| **Intento de login sin BD** | ⚠️ Usa usuarios hardcodeados (`admin`/`admin123`) |

---

## � ¿Qué Pasa Si Se Pierde la Conexión en Tiempo Real?

### Escenario: BD se desconecta después de que el backend arrancó

**ANTES de esta actualización:**
- ❌ El sistema seguía funcionando aparentemente normal
- ❌ Los pedidos se "creaban" pero no se guardaban
- ❌ Solo fallaba cuando intentaba acceder a la BD
- ❌ Mensajes confusos en los logs

**AHORA (con health checks en tiempo real):**

1. **Detección inmediata** (5-10 segundos):
   ```
   ❌ Health check falló: connection timeout
   🚨 PRODUCCIÓN: Marcando BD como no disponible
   ```

2. **Bloqueo automático** de todas las operaciones:
   ```json
   {
     "error": "Service Unavailable",
     "message": "El sistema no puede procesar solicitudes porque la base de datos no está disponible.",
     "retryAfter": 30
   }
   ```

3. **Health check refleja el problema**:
   ```bash
   $ curl http://localhost:8080/health
   {
     "status": "unhealthy",
     "database": "PostgreSQL - DISCONNECTED",
     "error": "Database connection lost"
   }
   ```

4. **Recuperación automática**:
   - El health check periódico (cada 10s) intentará reconectar
   - Cuando la BD vuelva, el sistema se recupera automáticamente
   - No requiere reinicio del backend

### Ventajas de la Verificación en Tiempo Real

| Aspecto | Sin Health Checks | Con Health Checks |
|---------|-------------------|-------------------|
| **Detección de fallo** | Solo al intentar operación | 5-10 segundos máximo |
| **Pérdida de datos** | ⚠️ Posible | ❌ Imposible (sistema bloqueado) |
| **Usuario ve error claro** | ❌ Errores confusos | ✅ "Sistema no disponible" |
| **Docker/Dokploy detecta** | ❌ No | ✅ Sí (health check 503) |
| **Recuperación** | Manual (reinicio) | ✅ Automática |

---

## �🔍 Cómo Detectar Problemas

### Logs en Producción - ANTES (Peligroso)
```
2025-11-12T10:50:01.362Z - ⚠️ BD no inicializada
2025-11-12T10:50:01.362Z - ⚠️ Usando autenticación de headers (modo desarrollo)
2025-11-12T10:50:01.367Z ✅ Pedido creado exitosamente
```
👉 **Problema**: El sistema parece funcionar, pero el pedido no se guardó realmente.

### Logs en Producción - DESPUÉS (Seguro)
```
2025-11-12T10:50:01.362Z 🚨 PRODUCCIÓN: Bloqueando request porque BD no está disponible
2025-11-12T10:50:01.362Z    - Ruta: POST /api/pedidos
{
  "error": "Service Unavailable",
  "message": "El sistema no puede procesar solicitudes porque la base de datos no está disponible."
}
```
👉 **Correcto**: El sistema **falla claramente** y el usuario sabe que hay un problema.

---

## 🚀 Configuración Requerida

Para que el sistema funcione correctamente en producción, asegúrate de:

### 1. Variable de Entorno Obligatoria

```bash
NODE_ENV=production
```

### 2. Variables de Base de Datos

Una de estas debe estar configurada:

```bash
# Opción 1: DATABASE_URL (preferida)
DATABASE_URL=postgresql://user:password@host:5432/database

# Opción 2: Variables individuales
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=gestion_pedidos
POSTGRES_USER=pigmea_user
POSTGRES_PASSWORD=tu_password_seguro
```

---

## 📋 Checklist de Verificación

### Antes de Desplegar a Producción

- [ ] `NODE_ENV=production` está configurado
- [ ] Variables de BD están configuradas correctamente
- [ ] El backend arranca sin errores `❌ Error conectando a PostgreSQL`
- [ ] El health check `/health` devuelve `status: "healthy"`
- [ ] Puedes hacer login con un usuario real de la BD (no `admin`/`admin123`)

### Si el Sistema Falla en Producción

1. **Verificar logs del backend**:
   ```bash
   docker logs backend_container_name
   ```
   Buscar: `🚨 ERROR CRÍTICO EN PRODUCCIÓN`

2. **Verificar que la BD esté corriendo**:
   ```bash
   docker ps | grep postgres
   ```

3. **Probar conexión a la BD**:
   ```bash
   docker exec -it postgres_container psql -U pigmea_user -d gestion_pedidos
   ```

4. **Revisar health check**:
   ```bash
   curl http://localhost:8080/health
   ```

---

## 🔧 Desarrollo Local

Para desarrollo local **sin Docker/PostgreSQL**, el sistema aún permite:

- Arrancar con `NODE_ENV=development` o sin configurar
- Login con usuarios hardcodeados (`admin`/`admin123`)
- Autenticación basada en headers

**⚠️ NUNCA uses `NODE_ENV=development` en producción.**

---

## � Diagnóstico de Problemas

### ¿La BD se está cayendo?

**Ver documento detallado**: [`DIAGNOSTICO-BD-CAIDAS.md`](./DIAGNOSTICO-BD-CAIDAS.md)

Este documento explica:
- ✅ Causas comunes de "caídas" de BD (spoiler: suelen ser reinicios del backend)
- ✅ Cómo interpretar los nuevos logs con event listeners
- ✅ Códigos de error y su significado
- ✅ Comandos para diagnosticar problemas
- ✅ Configuración recomendada para producción

### Logs Mejorados

Con los **event listeners** añadidos, ahora verás:

```
❌ ERROR EN POOL DE CONEXIONES: connection refused
   - Código: ECONNREFUSED
   🔴 CAUSA: PostgreSQL no está corriendo o no es accesible
🚨 PRODUCCIÓN: Marcando BD como no disponible debido a error
```

Esto te dirá **exactamente** qué pasó y por qué.

---

## �📝 Archivos Modificados

1. **`backend/postgres-client.js`**: 
   - Método `init()` lanza excepción crítica en producción si falla la conexión
   - ✅ **NUEVO**: `checkHealth()` - Verifica conexión con timeout de 2 segundos
   - ✅ **NUEVO**: `isConnectionHealthy()` - Cache de health check (5 segundos)
   - ✅ **NUEVO**: `startHealthCheckInterval()` - Verificación periódica (cada 10s)
   - ✅ **NUEVO**: Propiedades `isHealthy`, `lastHealthCheck`, `healthCheckTimer`

2. **`backend/middleware/auth.js`**:
   - Devuelve error 503 si la BD no está disponible en producción
   - En desarrollo aún permite fallback a headers

3. **`backend/index.js`**:
   - ✅ Eliminado `vendedoresMemory` y todas las funciones mock
   - ✅ **MODIFICADO**: Middleware global ahora usa `isConnectionHealthy()` (verificación en tiempo real)
   - ✅ **MODIFICADO**: Health check `/health` ejecuta verificación activa de conexión
   - ✅ Endpoints de vendedores devuelven 503 si no hay BD
   - ✅ Login rechaza autenticación si no hay BD en producción

---

## ✅ Resumen

| Antes | Después |
|-------|---------|
| ⚠️ Sistema funcionaba sin BD (perdía datos) | ✅ Sistema falla explícitamente sin BD |
| ⚠️ Logs confusos ("BD no inicializada") | ✅ Errores claros con código 503 |
| ⚠️ No distinguía desarrollo de producción | ✅ Modo estricto en producción |
| ⚠️ Usuario podía crear pedidos sin persistencia | ✅ Todas las operaciones bloqueadas sin BD |
| ⚠️ Pérdida de conexión no detectada | ✅ **Detección en 5-10 segundos** |
| ⚠️ Requería reinicio manual | ✅ **Recuperación automática** |

---

**Fecha de Implementación**: 12 de noviembre de 2025  
**Autor**: GitHub Copilot  
**Motivo**: Evitar pérdida de datos por fallbacks silenciosos + detectar pérdidas de conexión en tiempo real
