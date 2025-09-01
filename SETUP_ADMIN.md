# 🔧 Configuración del Sistema Administrativo

## 🚀 Inicio Rápido

### 1. Ejecutar Setup Automático
```bash
./setup-admin.sh
```

### 2. Configurar Base de Datos PostgreSQL

#### Opción A: Configuración Manual
```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear base de datos si no existe
CREATE DATABASE gestion_pedidos;

-- Conectar a la base de datos
\c gestion_pedidos

-- Ejecutar script de inicialización
\i database/init-admin-system.sql
```

#### Opción B: Comando Directo
```bash
# Desde el directorio del proyecto
psql -U postgres -d gestion_pedidos -f database/init-admin-system.sql
```

### 3. Iniciar Servicios

#### Terminal 1 - Backend
```bash
cd backend
npm start
```

#### Terminal 2 - Panel Administrativo
```bash
cd admin
npm run dev
```

#### Terminal 3 - Aplicación Principal (opcional)
```bash
npm run dev
```

## 🌐 URLs de Acceso

- **Aplicación Principal**: http://localhost:3000
- **Panel Administrativo**: http://localhost:3001
- **API Backend**: http://localhost:5000

## 🔐 Credenciales Iniciales

### Usuario Administrador Principal
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Email**: `admin@pigmea.com`

### Usuarios de Prueba
| Usuario | Contraseña | Rol | Email |
|---------|------------|-----|--------|
| supervisor | admin123 | SUPERVISOR | supervisor@pigmea.com |
| operator | admin123 | OPERATOR | operator@pigmea.com |
| viewer | admin123 | VIEWER | viewer@pigmea.com |

> ⚠️ **IMPORTANTE**: Cambiar las contraseñas después del primer login

## 🏗️ Estructura de Archivos Creados

```
admin/                         # Panel administrativo
├── src/
│   ├── components/           # Componentes React
│   ├── pages/               # Páginas principales
│   ├── services/            # Servicios API
│   ├── contexts/            # Contextos React
│   └── types/               # Tipos TypeScript
├── package.json
└── vite.config.ts

backend/admin/                # Backend administrativo
├── controllers/             # Controladores API
├── middleware/             # Middleware auth/audit
├── routes/                 # Rutas API
└── models/                 # Modelos datos

database/
└── init-admin-system.sql   # Script inicialización DB
```

## 📊 Funcionalidades Disponibles

### ✅ Implementado
- [x] Autenticación con JWT
- [x] Gestión de usuarios y roles
- [x] Dashboard con métricas
- [x] Sistema de auditoría
- [x] Configuración del sistema
- [x] Monitoreo de salud
- [x] Rate limiting y seguridad

### 🚧 Próximamente
- [ ] Gestión de backups automáticos
- [ ] Notificaciones por email
- [ ] Reportes avanzados
- [ ] Métricas en tiempo real
- [ ] API de configuración avanzada

## 🔧 Configuración Avanzada

### Variables de Entorno

#### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
JWT_SECRET=tu-clave-secreta-super-segura
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/gestion_pedidos
```

#### Admin Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=Panel de Administración - Pigmea
```

### Configuración de Base de Datos

Si usas Docker para PostgreSQL:
```bash
docker run --name postgres-pigmea \
  -e POSTGRES_PASSWORD=tu_contraseña \
  -e POSTGRES_DB=gestion_pedidos \
  -p 5432:5432 \
  -d postgres:15
```

## 🐛 Solución de Problemas

### Error: No se puede conectar a la base de datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -h localhost -p 5432
```

### Error: Módulo no encontrado
```bash
# Reinstalar dependencias backend
cd backend && npm install

# Reinstalar dependencias admin
cd admin && npm install
```

### Error: Puerto en uso
```bash
# Verificar qué proceso usa el puerto
lsof -i :5000
lsof -i :3001

# Matar proceso si es necesario
kill -9 <PID>
```

### Error: Credenciales incorrectas
```sql
-- Verificar usuarios en la base de datos
SELECT username, email, role, is_active FROM admin_users;

-- Resetear contraseña de admin
UPDATE admin_users 
SET password_hash = '$2b$12$LQv3c1yqBwEHvEfnUUQZT.JQnQE7vOE8KoKjUpXc4mA8WiGp7Y.O2' 
WHERE username = 'admin';
```

## 📝 Desarrollo

### Agregar Nuevos Endpoints
1. Crear controlador en `backend/admin/controllers/`
2. Agregar rutas en `backend/admin/routes/`
3. Registrar rutas en `backend/index.js`

### Agregar Nuevas Páginas Admin
1. Crear componente en `admin/src/pages/`
2. Agregar ruta en `admin/src/App.tsx`
3. Actualizar sidebar en `admin/src/components/Sidebar.tsx`

### Agregar Nuevos Permisos
```sql
-- En la base de datos
INSERT INTO system_config (config_key, config_value, description, category) 
VALUES ('permissions.new_permission', 'true', 'Descripción del permiso', 'permissions');
```

## 🔒 Seguridad

### Medidas Implementadas
- ✅ JWT con expiración
- ✅ bcrypt para contraseñas (12 rounds)
- ✅ Rate limiting
- ✅ Headers de seguridad (Helmet)
- ✅ Validación de entrada
- ✅ Auditoría completa
- ✅ CORS configurado

### Recomendaciones Producción
1. Cambiar `JWT_SECRET` a valor aleatorio seguro
2. Usar HTTPS en producción
3. Configurar firewall para puertos
4. Habilitar logging avanzado
5. Configurar backups automáticos
6. Monitoreo de seguridad

## 📞 Soporte

Si tienes problemas con la configuración:

1. **Revisar logs**: Los errores aparecen en la consola del backend
2. **Verificar puertos**: Asegurar que no estén en uso
3. **Base de datos**: Verificar conexión y permisos
4. **Permisos**: Verificar roles y permisos de usuario

---

¡Sistema administrativo listo para usar! 🚀
