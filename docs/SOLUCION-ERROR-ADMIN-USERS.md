# 🔧 Solución: Error "relation admin_users does not exist"

## 📋 Problema

El sistema mostraba el error `relation "admin_users" does not exist` después de que el servidor estaba funcionando correctamente durante algunos minutos. Esto ocurría porque:

1. **La base de datos PostgreSQL se reiniciaba** sin persistencia de datos
2. **Las tablas se perdían** al reiniciar el contenedor de PostgreSQL
3. **El backend no detectaba** que las tablas habían desaparecido

## ✅ Solución Implementada

### 1. **Autocuración de Base de Datos** (`backend/postgres-client.js`)

Se agregaron métodos para verificar y recrear automáticamente las tablas:

```javascript
// Verifica si las tablas críticas existen
async verifyTablesExist()

// Método de autocuración - verifica y recrea tablas si es necesario
async ensureTablesExist()
```

### 2. **Middleware de Salud de BD** (`backend/middleware/db-health.js`)

Nuevo middleware que:
- Verifica cada 30 segundos que las tablas existan
- Recrea automáticamente las tablas si desaparecen
- Evita overhead verificando con intervalo inteligente

### 3. **Manejo de Errores Mejorado**

Los métodos `getAdminUserByUsername()` y `getAdminUserById()` ahora:
- Detectan cuando la tabla no existe (error code `42P01`)
- Automáticamente recrean las tablas
- Reintentan la operación

### 4. **Integración en Express** (`backend/index.js`)

```javascript
// Se agregó el middleware de autocuración
app.use(ensureDatabaseHealth);

// Se configuró el dbClient en el middleware
setDbHealthClient(dbClient);
```

## 🚨 Problema Raíz: Persistencia de PostgreSQL

El verdadero problema es que **el volumen de PostgreSQL no está persistiendo los datos correctamente**. Para solucionar esto permanentemente:

### En Docker Compose (Dokploy):

```yaml
services:
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ⚠️ CRÍTICO: Volumen persistente
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_DB: ${DB_NAME}

volumes:
  postgres_data:  # ⚠️ CRÍTICO: Definir el volumen
    driver: local
```

### Verificar Volúmenes en Producción:

```bash
# Listar volúmenes
docker volume ls

# Inspeccionar volumen específico
docker volume inspect <nombre_volumen>

# Ver logs de PostgreSQL para detectar reinicios
docker logs <container_postgres>
```

## 📊 Cómo Detectar el Problema

Si ves estos logs en el servidor:

```
✅ PostgreSQL conectado correctamente
✅ Tabla admin_users verificada
...
❌ Error validando usuario: relation "admin_users" does not exist
```

Significa que:
1. ✅ Las tablas se crearon al inicio
2. ❌ La base de datos se reinició sin volumen persistente
3. 🔄 El sistema ahora se autocura (con esta solución)

## 🎯 Verificaciones Post-Deploy

Después de desplegar, verificar:

```bash
# 1. Verificar que las migraciones se ejecutaron
docker logs <container_app> | grep "SCRIPT DE MIGRACIÓN COMPLETADO"

# 2. Verificar que las tablas existen
docker exec -it <container_postgres> psql -U ${DB_USER} -d ${DB_NAME} -c "\dt"

# 3. Verificar que admin_users tiene datos
docker exec -it <container_postgres> psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT username, role FROM admin_users;"
```

## 🔄 Flujo de Autocuración

```
Petición HTTP → ensureDatabaseHealth()
                ↓
         ¿Han pasado 30s?
                ↓
         verifyTablesExist()
                ↓
      ¿Tabla admin_users existe?
                ↓ No
         createTables() ← Recrea todas las tablas
                ↓
         ✅ Sistema recuperado
```

## ⚠️ Limitaciones

Esta solución **mitiga** el problema pero **NO lo resuelve completamente**:

- ✅ El sistema se recupera automáticamente
- ⚠️ Los datos creados entre reinicios se pierden
- 🔴 **SOLUCIÓN REAL**: Configurar volumen persistente en PostgreSQL

## 🔍 Debugging

Si el problema persiste:

1. Verificar logs del middleware:
   ```
   ⚠️ Tablas críticas no existen - iniciando recreación automática...
   ✅ Tablas recreadas exitosamente
   ```

2. Verificar que el middleware está activo:
   ```bash
   grep "ensureDatabaseHealth" backend/index.js
   ```

3. Forzar recreación manual desde el backend:
   ```javascript
   await dbClient.ensureTablesExist();
   ```

## 📚 Archivos Modificados

1. `backend/postgres-client.js` - Métodos de autocuración
2. `backend/middleware/db-health.js` - Middleware de verificación
3. `backend/index.js` - Integración del middleware
4. Esta documentación

## ✨ Beneficios

- 🔄 **Resiliencia**: El sistema se recupera automáticamente
- ⚡ **Rendimiento**: Verificación cada 30s (no por petición)
- 🛡️ **Prevención**: Detecta problemas antes de que afecten usuarios
- 📊 **Logging**: Registra cuándo ocurre la autocuración

---

**Fecha**: Diciembre 20, 2025  
**Autor**: Sistema de Autocuración Implementado  
**Estado**: ✅ Funcionando
