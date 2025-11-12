# 🔍 Diagnóstico: ¿Por Qué Se Cae la Base de Datos?

## 📊 Análisis de Tus Logs

En los logs que compartiste vi esto:
```
2025-11-12T10:52:14.582Z SIGTERM received, shutting down gracefully
2025-11-12T10:52:14.583Z 🔄 Cerrando conexiones a PostgreSQL...
2025-11-12T10:52:14.583Z ✅ Conexiones a PostgreSQL cerradas
```

**Esto NO es una caída de la BD**, es un **reinicio del backend** por Dokploy/Docker.

---

## 🚨 Causas Comunes de "Caída" de BD

### 1. **Reinicio del Contenedor (Lo Más Común)**

#### ¿Qué es SIGTERM?
- Señal de Docker/Kubernetes que indica: "Apágate limpiamente"
- **NO significa** que la BD se cayó
- **Significa** que Docker/Dokploy reinició el backend

#### ¿Por qué Dokploy reinicia el backend?

| Causa | Síntomas en Logs | Solución |
|-------|------------------|----------|
| **Health check falla** | `Health check timeout` antes del `SIGTERM` | Verificar que `/health` responde en < 30s |
| **Consume mucha RAM** | `OOMKilled` en logs de Docker | Aumentar límite de memoria o optimizar código |
| **Deploy nuevo** | `SIGTERM` después de push a git | Normal - es el proceso de actualización |
| **Crash del proceso** | Stack trace antes del `SIGTERM` | Revisar el error anterior |

#### Cómo Verificar:
```bash
# Ver logs de Docker
docker logs backend-container --tail 100

# Ver por qué se reinició el contenedor
docker inspect backend-container | grep -A 10 "State"
```

---

### 2. **BD PostgreSQL Se Cae (Menos Común)**

#### Señales en los Logs:
```
❌ ERROR EN POOL DE CONEXIONES: Connection terminated unexpectedly
   - Código: ECONNREFUSED
   🔴 CAUSA: PostgreSQL no está corriendo o no es accesible
```

#### Causas Principales:

#### **2.1. PostgreSQL se quedó sin memoria**
```bash
# Ver logs de PostgreSQL
docker logs postgres-container --tail 50

# Buscar:
# - "out of memory"
# - "OOM killer"
# - "terminating connection due to administrator command"
```

**Solución**:
- Aumentar memoria del contenedor PostgreSQL
- Ajustar parámetros de PostgreSQL:
  ```sql
  -- Ver memoria configurada
  SHOW shared_buffers;
  SHOW work_mem;
  
  -- Optimizar si es necesario
  ALTER SYSTEM SET shared_buffers = '256MB';
  ALTER SYSTEM SET work_mem = '4MB';
  ```

---

#### **2.2. Demasiadas conexiones abiertas**
```
❌ ERROR EN POOL DE CONEXIONES: sorry, too many clients already
   - Código: 53300
   🔴 CAUSA: Demasiadas conexiones abiertas (max_connections alcanzado)
```

**Solución**:
```sql
-- Ver conexiones actuales
SELECT count(*) FROM pg_stat_activity;

-- Ver límite
SHOW max_connections;

-- Ver quién está usando conexiones
SELECT 
    datname, 
    usename, 
    count(*) 
FROM pg_stat_activity 
GROUP BY datname, usename;

-- Aumentar límite (en postgresql.conf o variable de entorno)
ALTER SYSTEM SET max_connections = 200;
```

**En docker-compose.yml**:
```yaml
services:
  postgres:
    environment:
      POSTGRES_MAX_CONNECTIONS: 200
```

---

#### **2.3. Queries lentas bloqueando la BD**
```
⚠️ Pool de conexiones al 95% de capacidad
   - Total: 19/20
   - Idle: 0
   - Waiting: 15
```

**Solución**:
```sql
-- Ver queries lentas en ejecución
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Matar query problemática
SELECT pg_terminate_backend(pid);

-- Configurar timeout para queries largas
ALTER DATABASE gestion_pedidos SET statement_timeout = '30s';
```

---

#### **2.4. Disco lleno**
```
❌ ERROR EN POOL DE CONEXIONES: could not write to file: No space left on device
```

**Solución**:
```bash
# Ver espacio en disco
docker exec postgres-container df -h

# Limpiar logs antiguos de PostgreSQL
docker exec postgres-container sh -c "find /var/lib/postgresql/data/log -name '*.log' -mtime +7 -delete"

# En Dokploy, revisar volúmenes y aumentar si es necesario
```

---

### 3. **Problemas de Red (En la Nube)**

#### Señales:
```
❌ Health check falló: Health check timeout
   - Código: ETIMEDOUT
   🔴 CAUSA: Timeout de conexión (red lenta o PostgreSQL sobrecargado)
```

#### Causas:
- Latencia alta entre backend y PostgreSQL
- Firewall bloqueando puertos
- DNS no resolviendo correctamente

**Solución**:
```yaml
# docker-compose.yml - Asegurar que backend y postgres estén en la misma red
services:
  backend:
    networks:
      - app-network
    depends_on:
      - postgres
  
  postgres:
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## 🛠️ Nuevo Sistema de Diagnóstico Implementado

He añadido **event listeners** al pool de conexiones que te dirán exactamente qué está pasando:

### Logs que Verás Ahora:

#### ✅ Todo OK:
```
✅ PostgreSQL conectado correctamente
   - Host: db
   - Database: gestion_pedidos
   - Max connections: 20
👂 Event listeners del pool configurados
🔗 Nueva conexión al pool establecida
🔄 Health checks periódicos iniciados (cada 10s)
```

#### ⚠️ Pool cerca del límite:
```
⚠️ Pool de conexiones al 85% de capacidad
   - Total: 17/20
   - Idle: 2
   - Waiting: 3
```
**Acción**: Investigar por qué hay tantas conexiones abiertas.

#### ❌ Error de conexión:
```
❌ ERROR EN POOL DE CONEXIONES: Connection terminated
   - Código: ECONNREFUSED
   - Timestamp: 2025-11-12T10:52:14.583Z
   🔴 CAUSA: PostgreSQL no está corriendo o no es accesible
🚨 PRODUCCIÓN: Marcando BD como no disponible debido a error
```

---

## 🔧 Configuración Recomendada para Producción

### 1. **Variables de Entorno para PostgreSQL**

```bash
# En Dokploy / docker-compose.yml
POSTGRES_MAX_CONNECTIONS=100        # Aumentar de 20 a 100
POSTGRES_SHARED_BUFFERS=256MB       # Memoria para cache
POSTGRES_WORK_MEM=16MB              # Memoria por operación
POSTGRES_MAINTENANCE_WORK_MEM=64MB  # Para VACUUM, etc.
```

### 2. **Backend - Pool de Conexiones**

```javascript
// En postgres-client.js (ya configurado)
this.config = {
    max: 20,                      // Máximo 20 conexiones por backend
    idleTimeoutMillis: 30000,     // Cerrar conexiones idle después de 30s
    connectionTimeoutMillis: 2000, // Timeout para obtener conexión
};
```

### 3. **Monitoreo en Dokploy**

- **Health Check**: Configurar timeout de 10 segundos (no 5)
- **Memory Limit**: 
  - Backend: 512MB mínimo
  - PostgreSQL: 1GB mínimo
- **Restart Policy**: `unless-stopped` (reiniciar si se cae)

---

## 📈 Checklist de Prevención

### Diario:
- [ ] Revisar logs de backend para errores de pool
- [ ] Verificar que health check `/health` responde rápido

### Semanal:
- [ ] Revisar uso de disco de PostgreSQL
- [ ] Ejecutar `VACUUM ANALYZE` en tablas grandes
- [ ] Revisar queries lentas:
  ```sql
  SELECT * FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;
  ```

### Mensual:
- [ ] Aumentar límites si el sistema crece
- [ ] Revisar índices faltantes
- [ ] Analizar patrones de uso de conexiones

---

## 🚀 Comandos Útiles

### Ver Estado de PostgreSQL:
```bash
# Conectar a PostgreSQL
docker exec -it postgres-container psql -U pigmea_user -d gestion_pedidos

# Ver conexiones activas
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

# Ver tamaño de BD
SELECT pg_size_pretty(pg_database_size('gestion_pedidos'));

# Ver tablas más grandes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Ver Logs del Backend:
```bash
# Últimas 100 líneas
docker logs backend-container --tail 100

# Seguir logs en tiempo real
docker logs backend-container -f

# Filtrar errores de BD
docker logs backend-container 2>&1 | grep -i "pool\|postgresql\|database"
```

### Ver Logs de PostgreSQL:
```bash
# Ver logs
docker logs postgres-container --tail 50

# Buscar errores
docker logs postgres-container 2>&1 | grep -i "error\|fatal\|panic"
```

---

## 🎯 ¿Qué Dice "BD no inicializada" Ahora?

**ANTES** (confuso):
```
⚠️ BD no inicializada
⚠️ Usando autenticación de headers (modo desarrollo)
```
👉 No sabes si es problema real o modo desarrollo

**AHORA** (claro):

En **Producción**:
```
❌ ERROR EN POOL DE CONEXIONES: connection refused
   - Código: ECONNREFUSED
   🔴 CAUSA: PostgreSQL no está corriendo o no es accesible
🚨 PRODUCCIÓN: Marcando BD como no disponible debido a error
```
👉 Sabes exactamente qué pasó y por qué

En **Desarrollo**:
```
⚠️ DESARROLLO: Usando autenticación de desarrollo (sin BD)
```
👉 Está claro que es modo desarrollo

---

## 💡 Resumen: ¿Por Qué Se Cayó en Tu Caso?

Basándome en tus logs:
```
2025-11-12T10:52:14.582Z SIGTERM received, shutting down gracefully
```

**Conclusión**: El backend se reinició, probablemente por:
1. **Deploy nuevo** en Dokploy (normal)
2. **Health check falló** (revisar timeout)
3. **Consumo excesivo de memoria** (revisar límites)

**NO fue una caída de PostgreSQL**, sino un reinicio controlado del backend.

---

## 📞 Próximos Pasos

1. **Monitorear logs** con los nuevos event listeners
2. **Si ves `❌ ERROR EN POOL`**, seguir las soluciones específicas de arriba
3. **Configurar alertas** en Dokploy para:
   - Health check failures
   - High memory usage
   - Container restarts

---

**Última Actualización**: 12 de noviembre de 2025  
**Autor**: GitHub Copilot
