# Configuración de Almacenamiento Persistente en Dokploy

## Resumen del Problema
La aplicación perdía todos los datos cada vez que se reiniciaba porque usaba almacenamiento en memoria.

## Solución Implementada
Se ha implementado almacenamiento persistente usando SQLite con volúmenes Docker.

## Configuración en Dokploy

### 1. Configuración de Volúmenes

En la configuración de tu aplicación en Dokploy, necesitas agregar un volumen:

**Mapeo de Volumen:**
- **Volumen Host:** `pedidos_data` (o el nombre que prefieras)
- **Ruta del Contenedor:** `/app/backend/data`
- **Tipo:** Volumen Docker

### 2. Variables de Entorno (Opcionales)

Puedes agregar estas variables para control adicional:

```bash
# Para forzar el uso de SQLite (opcional, es el comportamiento por defecto)
FORCE_SQLITE=true

# Para debugging
NODE_ENV=production
```

### 3. Configuración del Servicio

```yaml
# Configuración equivalente en docker-compose.yml (para referencia)
version: '3.8'
services:
  gestion-pedidos:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - pedidos_data:/app/backend/data
    environment:
      - NODE_ENV=production
      - PORT=8080

volumes:
  pedidos_data:
```

## Verificación

### 1. Check de Estado
Después del despliegue, verifica que SQLite está funcionando:

```bash
curl http://tu-dominio.com/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "firestoreEnabled": false,
  "sqliteEnabled": true,
  "inMemoryFallback": false
}
```

### 2. Logs del Contenedor
En los logs deberías ver:
```
SQLite database initialized successfully
Servidor escuchando en el puerto 8080
Modo: Local/SQLite
```

## Backup y Restauración

### Backup Manual
```bash
# Conectar al contenedor
docker exec -it <container_name> sh

# Copiar la base de datos
cp /app/backend/data/pedidos.db /tmp/backup.db

# Desde el host, copiar el backup
docker cp <container_name>:/tmp/backup.db ./pedidos_backup_$(date +%Y%m%d).db
```

### Restauración
```bash
# Copiar backup al contenedor
docker cp ./pedidos_backup.db <container_name>:/app/backend/data/pedidos.db

# Reiniciar el servicio
docker restart <container_name>
```

### Backup Automático (Recomendado)
Configura un cron job o script para backup regular del volumen:

```bash
#!/bin/bash
# Script de backup automatico
DATE=$(date +%Y%m%d_%H%M%S)
docker run --rm -v pedidos_data:/data -v $(pwd):/backup alpine tar czf /backup/pedidos_backup_$DATE.tar.gz -C /data .
```

## Migración de Datos Existentes

Si ya tienes datos y quieres migrarlos:

1. **Exporta** los datos usando la función de exportar en la interfaz
2. **Despliega** la nueva versión con persistencia
3. **Importa** los datos usando la función de importar

## Monitoreo

### Logs Importantes
- `SQLite database initialized successfully` - Inicialización correcta
- `Using SQLite...` - Confirmación de uso de SQLite
- `Found X pedidos in SQLite` - Datos cargados correctamente

### Errores Comunes
- `Error opening SQLite database` - Problema de permisos o volumen
- `Database not initialized` - SQLite no se inicializó correctamente
- `using in-memory storage` - Fallback activado, revisar configuración

## Ventajas de esta Solución

✅ **Persistencia completa** - Los datos se mantienen entre reinicios
✅ **Backup simple** - Solo necesitas respaldar el volumen
✅ **Performance** - SQLite es muy rápido para esta aplicación
✅ **Sin dependencias externas** - No necesitas servicios adicionales
✅ **Compatibilidad** - Funciona con Firestore en cloud
✅ **Transacciones** - SQLite garantiza integridad de datos

## Próximos Pasos

1. Configurar el volumen en Dokploy
2. Redesplegar la aplicación
3. Verificar que el health check muestra `sqliteEnabled: true`
4. Configurar backup automático (recomendado)
