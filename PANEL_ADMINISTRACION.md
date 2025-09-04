# Panel de Administración - Gestión de Usuarios

## 🌐 Acceso al Sistema

### 🔗 URL Pública (Producción)
```
https://planning.pigmea.click/admin
```

### 🔗 URL Local (Desarrollo)
```
http://localhost:3001
```

## 🔐 Credenciales de Acceso

### Para desarrollo (sin base de datos):

**Administrador Principal:**
- Usuario: `admin`
- Contraseña: `admin123`
- Permisos: Acceso completo (crear, editar, eliminar usuarios + configuración del sistema)

**Supervisor:**
- Usuario: `supervisor`
- Contraseña: `super123`
- Permisos: Ver y editar usuarios (sin poder eliminar)

## 🎯 Funcionalidades Implementadas

### ✅ Ya Disponibles:
1. **Autenticación Segura**
   - Login con JWT tokens
   - Sesiones de 8 horas
   - Diferentes niveles de acceso por rol

2. **Gestión de Usuarios**
   - Ver lista completa de usuarios
   - Filtros por rol, estado, búsqueda por nombre
   - Estadísticas en tiempo real (usuarios totales, activos, etc.)
   - Información de último acceso

3. **Panel de Control**
   - Dashboard con métricas del sistema
   - Lista de usuarios conectados
   - Actividad reciente
   - Estado del sistema

4. **Seguridad**
   - Diferentes roles: ADMIN, SUPERVISOR, OPERATOR, VIEWER
   - Permisos granulares por funcionalidad
   - Auditoría de acciones

### 📋 Usuarios de Ejemplo (Modo Desarrollo):
- **admin** (Administrador) - Acceso total
- **supervisor** (Supervisor) - Gestión de usuarios limitada  
- **operador1** (Operador) - Usuario regular activo
- **visor1** (Visor) - Usuario con acceso limitado (inactivo)

## 🔧 Funcionalidades por Implementar

### 🚧 En Desarrollo:
1. **Gestión Avanzada de Usuarios**
   - ✅ Crear nuevos usuarios
   - ✅ Editar información de usuarios existentes
   - ✅ Cambiar contraseñas
   - ✅ Activar/desactivar usuarios
   - ✅ Eliminar usuarios
   - ⏳ Asignación de permisos personalizados

2. **Exportación de Datos**
   - ⏳ Exportar lista de usuarios a CSV/Excel
   - ⏳ Reportes de actividad

3. **Configuración del Sistema**
   - ⏳ Configuraciones generales
   - ⏳ Parámetros de seguridad
   - ⏳ Configuración de base de datos

## 🖥️ Cómo Usar el Sistema

### 1. Acceder al Panel
1. Abrir navegador en `http://localhost:3001`
2. Usar credenciales de administrador (`admin` / `admin123`)

### 2. Gestionar Usuarios
1. Ir a la sección "Usuarios" en la barra lateral
2. Ver lista completa con filtros disponibles
3. Usar botón "➕ Nuevo Usuario" para crear usuarios
4. Hacer clic en cualquier usuario para editarlo
5. Usar los botones de acción para activar/desactivar/eliminar

### 3. Monitorear Sistema
1. El Dashboard muestra estadísticas en tiempo real
2. Ver usuarios conectados actualmente
3. Revisar actividad reciente del sistema

## 🏗️ Arquitectura Técnica

### Frontend (Puerto 3001)
- **Framework**: React + TypeScript + Vite
- **Diseño**: Tailwind CSS
- **Navegación**: React Router
- **Estado**: Context API
- **HTTP**: Axios

### Backend (Puerto 5000)
- **Framework**: Node.js + Express
- **Autenticación**: JWT + bcrypt
- **Base de datos**: PostgreSQL (con fallback a datos mock)
- **WebSockets**: Socket.io para tiempo real

### Endpoints API Disponibles:
```
POST /api/admin/auth/login          # Login
GET  /api/admin/auth/verify         # Verificar token
GET  /api/admin/users               # Listar usuarios
POST /api/admin/users               # Crear usuario
PUT  /api/admin/users/:id           # Actualizar usuario
DELETE /api/admin/users/:id         # Eliminar usuario
PATCH /api/admin/users/:id/activate # Activar usuario
PATCH /api/admin/users/:id/deactivate # Desactivar usuario
POST /api/admin/users/:id/reset-password # Reset contraseña
```

## 🛡️ Seguridad

### Medidas Implementadas:
- Hashing de contraseñas con bcrypt (rounds: 12)
- Tokens JWT con expiración
- Rate limiting en endpoints críticos
- Validación de permisos por rol
- Auditoría de acciones administrativas

### Roles y Permisos:
- **ADMIN**: Acceso completo al sistema
- **SUPERVISOR**: Gestión limitada de usuarios
- **OPERATOR**: Operaciones básicas
- **VIEWER**: Solo lectura

## 🚀 Próximos Pasos

1. **Integración con Base de Datos**: Configurar PostgreSQL para persistencia real
2. **Notificaciones**: Sistema de alertas en tiempo real
3. **Auditoría Avanzada**: Logs detallados de todas las acciones
4. **Backup/Restore**: Funciones de respaldo de datos
5. **API Keys**: Gestión de claves API para integraciones

---

**¡El panel ya está funcional y listo para usar!** 🎉

Para probar: Ve a `http://localhost:3001` y usa `admin` / `admin123`
