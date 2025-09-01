# Sistema Administrativo de Pigmea

## 📋 Descripción

Sistema administrativo completo para la gestión de usuarios, auditoría y monitoreo del sistema de gestión de pedidos Pigmea. Incluye un panel web administrativo separado con funcionalidades avanzadas de control y supervisión.

## 🚀 Características Principales

### 👥 Gestión de Usuarios
- **Creación y edición de usuarios** con diferentes roles
- **Sistema de permisos granular** para controlar acceso a funcionalidades
- **Activación/desactivación** de cuentas de usuario
- **Reset de contraseñas** y gestión de credenciales
- **Exportación de datos** de usuarios en formato CSV
- **Eliminación en lote** de usuarios seleccionados

### 🔐 Sistema de Autenticación
- **Login seguro** con JWT tokens
- **Verificación de tokens** automática
- **Sesiones con expiración** configurable (8 horas por defecto)
- **Cambio de contraseñas** con validación de seguridad
- **Logout seguro** con invalidación de sesión

### 📊 Dashboard Administrativo
- **Métricas en tiempo real** del sistema
- **Estado de salud** de componentes (Base de datos, Servidor, WebSockets)
- **Usuarios activos** y estadísticas de conexión
- **Actividad reciente** con timeline de eventos
- **Estadísticas de pedidos** y rendimiento

### 🔍 Sistema de Auditoría
- **Registro automático** de todas las acciones administrativas
- **Logs detallados** con información de usuario, IP y timestamp
- **Filtrado avanzado** por usuario, acción, módulo y fechas
- **Exportación de reportes** de auditoría
- **Búsqueda y paginación** eficiente

### ⚙️ Gestión del Sistema
- **Monitoreo de salud** en tiempo real
- **Gestión de backups** de base de datos
- **Configuración del sistema** centralizada
- **Mantenimiento y limpieza** de datos
- **Logs del sistema** y diagnósticos

### 🛡️ Seguridad
- **Encriptación de contraseñas** con bcrypt (12 rounds)
- **Rate limiting** para prevenir ataques
- **Validación de entrada** estricta
- **Headers de seguridad** con Helmet
- **Auditoría completa** de acciones

## 🏗️ Arquitectura

### Frontend (Admin Panel)
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para comunicación con API
- **Chart.js** para gráficos y métricas
- **Date-fns** para manejo de fechas
- **Lucide React** para iconografía

### Backend (API Admin)
- **Express.js** framework
- **PostgreSQL** base de datos
- **JWT** para autenticación
- **bcryptjs** para encriptación
- **Socket.io** para tiempo real
- **Helmet** para seguridad
- **Compression** para optimización

## 📁 Estructura del Proyecto

```
admin/                          # Panel administrativo frontend
├── src/
│   ├── components/            # Componentes reutilizables
│   ├── pages/                # Páginas principales
│   ├── services/             # Servicios API
│   ├── contexts/             # Contextos de React
│   ├── types/                # Tipos TypeScript
│   └── hooks/                # Hooks personalizados
├── package.json              # Dependencias frontend
└── vite.config.ts           # Configuración Vite

backend/admin/                 # API administrativa backend
├── controllers/              # Controladores de API
├── middleware/              # Middleware de autenticación y auditoría
├── routes/                  # Rutas de la API
├── models/                  # Modelos de datos
└── migrations/              # Migraciones de base de datos
```

## 🔧 Instalación y Configuración

### 1. Ejecutar Script de Configuración
```bash
./setup-admin.sh
```

### 2. Configurar Base de Datos
Crear las tablas necesarias en PostgreSQL:

```sql
-- Tabla de usuarios administrativos
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER')),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs de auditoría
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id),
    username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    affected_resource UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones (opcional)
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id),
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
```

### 3. Crear Usuario Administrador Inicial
```sql
-- Insertar usuario admin inicial (contraseña: admin123)
INSERT INTO admin_users (
    username, 
    email, 
    first_name, 
    last_name, 
    password_hash, 
    role,
    permissions
) VALUES (
    'admin', 
    'admin@pigmea.com', 
    'Administrador', 
    'Principal', 
    '$2b$12$LQv3c1yqBwEHvEfnUUQZT.JQnQE7vOE8KoKjUpXc4mA8WiGp7Y.O2', -- admin123
    'ADMIN',
    '["dashboard.view","users.view","users.create","users.edit","users.delete","audit.view","audit.export","system.view","system.manage","database.view","database.backup","settings.view","settings.edit"]'
);
```

### 4. Iniciar Servicios

#### Backend
```bash
cd backend
npm start
```

#### Panel Administrativo
```bash
cd admin
npm run dev
```

## 🌐 URLs del Sistema

- **Aplicación Principal**: http://localhost:3000
- **Panel Administrativo**: http://localhost:3001
- **API Backend**: http://localhost:5000

## 👥 Roles y Permisos

### 🔥 ADMIN (Administrador)
- **Acceso completo** a todas las funcionalidades
- **Gestión de usuarios** y permisos
- **Configuración del sistema**
- **Acceso a auditoría completa**

### 👨‍💼 SUPERVISOR
- **Visualización de métricas** y reportes
- **Gestión limitada de usuarios**
- **Acceso a auditoría de lectura**
- **Monitoreo del sistema**

### 👨‍🔧 OPERATOR
- **Operaciones básicas** del sistema
- **Visualización de dashboard**
- **Acceso limitado a configuración**

### 👀 VIEWER
- **Solo lectura** de información
- **Dashboard básico**
- **Sin permisos de modificación**

## 🔐 Seguridad Implementada

### Autenticación
- ✅ JWT tokens con expiración
- ✅ Encriptación de contraseñas bcrypt
- ✅ Validación de sesiones
- ✅ Logout seguro

### Autorización
- ✅ Sistema de roles jerárquico
- ✅ Permisos granulares por funcionalidad
- ✅ Verificación en cada endpoint
- ✅ Restricciones por IP (configurable)

### Protección
- ✅ Rate limiting
- ✅ Headers de seguridad
- ✅ Validación de entrada
- ✅ Sanitización de datos
- ✅ Protección CSRF

### Auditoría
- ✅ Log de todas las acciones
- ✅ Rastreo de cambios
- ✅ Información de sesión
- ✅ Historial completo

## 📊 Métricas y Monitoreo

### Dashboard Principal
- 📈 **Usuarios totales y activos**
- 📋 **Pedidos del día y completados**
- 🔌 **Conexiones en tiempo real**
- ⚡ **Estado de salud del sistema**

### Métricas Avanzadas
- 📊 **Tiempo de respuesta promedio**
- 💾 **Uso de recursos del servidor**
- 🔄 **Conexiones de base de datos**
- 📡 **Estadísticas de WebSocket**

## 🚀 Funcionalidades Avanzadas

### Exportación de Datos
- 📄 **CSV de usuarios** con información completa
- 📋 **Reportes de auditoría** filtrados
- 📊 **Métricas históricas** por períodos
- 💾 **Backups programados** de base de datos

### Notificaciones
- 🔔 **Alertas en tiempo real** para administradores
- 📧 **Notificaciones por email** (configurable)
- ⚠️ **Alertas de seguridad** automáticas
- 📱 **Dashboard en tiempo real** con WebSockets

### Automatización
- 🤖 **Limpieza automática** de logs antiguos
- 📦 **Backups programados** de base de datos
- 🔄 **Actualización automática** de métricas
- 🧹 **Mantenimiento del sistema** programado

## 🔧 Configuración Avanzada

### Variables de Entorno

#### Backend (.env)
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/pigmea_db
ADMIN_EMAIL=admin@pigmea.com
BACKUP_RETENTION_DAYS=30
LOG_LEVEL=info
```

#### Frontend (.env)
```bash
VITE_API_URL=https://api.pigmea.com
VITE_APP_TITLE=Panel de Administración - Pigmea
VITE_REFRESH_INTERVAL=30000
```

## 📝 API Endpoints

### Autenticación
- `POST /api/admin/auth/login` - Login de administrador
- `GET /api/admin/auth/verify` - Verificar token
- `POST /api/admin/auth/logout` - Logout
- `PUT /api/admin/auth/change-password` - Cambiar contraseña

### Usuarios
- `GET /api/admin/users` - Listar usuarios
- `POST /api/admin/users` - Crear usuario
- `PUT /api/admin/users/:id` - Actualizar usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario
- `PATCH /api/admin/users/:id/activate` - Activar usuario
- `PATCH /api/admin/users/:id/deactivate` - Desactivar usuario

### Sistema
- `GET /api/admin/dashboard` - Datos del dashboard
- `GET /api/admin/health` - Estado del sistema
- `GET /api/admin/audit-logs` - Logs de auditoría
- `POST /api/admin/backups` - Crear backup
- `GET /api/admin/config` - Configuración del sistema

## 🐛 Resolución de Problemas

### Errores Comunes

#### Error de Conexión a Base de Datos
```bash
# Verificar conexión
psql -h localhost -U username -d pigmea_db

# Verificar variables de entorno
echo $DATABASE_URL
```

#### Error de Autenticación JWT
```bash
# Verificar JWT_SECRET en .env
# Limpiar tokens del navegador
# Revisar logs del servidor
```

#### Error de Permisos
```bash
# Verificar rol del usuario en base de datos
SELECT username, role, permissions FROM admin_users WHERE username = 'admin';

# Actualizar permisos si es necesario
UPDATE admin_users SET permissions = '["dashboard.view","users.view"]' WHERE username = 'admin';
```

## 🔄 Actualizaciones y Mantenimiento

### Backup Regular
```bash
# Backup manual de base de datos
pg_dump pigmea_db > backup_$(date +%Y%m%d).sql

# Restauración de backup
psql pigmea_db < backup_20241201.sql
```

### Limpieza de Logs
```bash
# Limpiar logs antiguos (más de 90 días)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

### Actualización de Dependencias
```bash
# Backend
cd backend && npm update

# Frontend
cd admin && npm update
```

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema administrativo:

- 📧 **Email**: admin@pigmea.com
- 📱 **Sistema de tickets**: En desarrollo
- 📚 **Documentación**: Este archivo
- 🔧 **Logs del sistema**: `/api/admin/system/logs`

---

**Desarrollado para Pigmea** - Sistema de Gestión de Pedidos  
**Versión**: 1.0.0  
**Fecha**: Diciembre 2024
