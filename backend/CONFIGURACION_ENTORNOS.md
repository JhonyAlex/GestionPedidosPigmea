# Configuración de Entornos - Backend Gestión Pedidos Pigmea

## 📁 Archivos de configuración disponibles:

### 🔧 Para DESARROLLO LOCAL (.env)
```bash
# Puerto del servidor
PORT=3001

# Entorno de desarrollo
NODE_ENV=development

# CORS Origins
CORS_ORIGINS=https://planning.pigmea.click,http://localhost:5173,http://localhost:3000

# ⚠️ NO incluir variables de base de datos para usar modo desarrollo
# Esto permite que la aplicación funcione sin PostgreSQL instalado localmente
```

### 🚀 Para PRODUCCIÓN (.env en el servidor)
```bash
# Base de datos PostgreSQL - PRODUCCIÓN
DB_HOST=control-produccin-pigmea-gestionpedidosdb-vcfcjc
DB_PORT=5432
DB_USER=pigmea_user
DB_PASSWORD=Pigmea_2025_DbSecure42
DB_NAME=gestion_pedidos

# Puerto del servidor
PORT=8080

# Entorno de producción
NODE_ENV=production

# CORS Origins para producción
CORS_ORIGINS=https://planning.pigmea.click
```

## 🔄 Instrucciones de despliegue:

### Para desarrollo local:
1. Usar el archivo `.env` actual (sin variables de BD)
2. El backend funcionará en "modo desarrollo" con usuarios hardcodeados
3. No requiere PostgreSQL instalado

### Para despliegue en producción:
1. Copiar `.env.production` como `.env` en el servidor
2. El backend se conectará a la base de datos PostgreSQL real
3. Se crearán automáticamente las tablas necesarias:
   - `admin_users` (usuarios administrativos con hash de contraseñas)
   - `audit_logs` (logs de auditoría con claves foráneas)
   - `pedidos` (gestión de pedidos)
   - `users` (usuarios legacy)
   - `audit_log` (auditoría legacy)

## ✅ Solución al error de clave foránea:

El error `foreign key constraint "audit_logs_user_id_fkey" cannot be implemented` se resolvió:

1. **Reordenando la creación de tablas**: `admin_users` se crea ANTES que `audit_logs`
2. **Separando la creación de claves foráneas**: Se agregan DESPUÉS de crear ambas tablas
3. **Verificación de existencia**: Solo se crea la clave foránea si no existe previamente

## 🎯 Resultado:

- ✅ **Desarrollo local**: Funciona sin base de datos
- ✅ **Producción**: Se conecta y crea tablas automáticamente
- ✅ **Sin errores de claves foráneas**: Orden correcto de creación
- ✅ **Gestión de usuarios**: Completamente funcional en ambos entornos
