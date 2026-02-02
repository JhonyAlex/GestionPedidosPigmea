# 🛠️ Configuración de Entorno de Desarrollo Local

Guía para ejecutar el sistema localmente mientras la versión de producción sigue funcionando en el servidor.

## 📋 Requisitos Previos

### 1. Node.js (v18 o superior)
**Descargar e instalar:**
- Ir a: https://nodejs.org/
- Descargar versión LTS (Long Term Support)
- Ejecutar instalador y seguir pasos
- Verificar instalación:
```powershell
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
```

### 2. PostgreSQL (v15 o superior)
**Opción A - PostgreSQL nativo (Recomendado para desarrollo):**
- Descargar: https://www.postgresql.org/download/windows/
- Ejecutar instalador
- Durante instalación:
  - Puerto: `5432` (por defecto)
  - Usuario: `postgres`
  - Contraseña: *La que quieras* (guardar bien)
- Verificar instalación:
```powershell
psql --version    # Debe mostrar PostgreSQL 15.x
```

**Opción B - Docker Desktop (Más ligero):**
- Descargar: https://www.docker.com/products/docker-desktop/
- Instalar Docker Desktop
- Ejecutar contenedor de PostgreSQL:
```powershell
docker run -d `
  --name postgres-local `
  -e POSTGRES_USER=pigmea_user `
  -e POSTGRES_PASSWORD=pigmea_password `
  -e POSTGRES_DB=gestion_pedidos `
  -p 5432:5432 `
  postgres:15
```

### 3. Git (Ya instalado ✅)
Ya lo tienes funcionando.

### 4. Visual Studio Code (Ya instalado ✅)
Ya lo tienes funcionando.

---

## 🚀 Configuración del Proyecto Local

### Paso 1: Clonar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```powershell
# Copiar desde el template
Copy-Item .env .env.local
```

Editar `.env.local` con estos valores:

```env
# Base de datos LOCAL
DATABASE_URL=postgresql://pigmea_user:pigmea_password@localhost:5432/gestion_pedidos

# Puerto del backend (diferente a producción para evitar conflictos)
PORT=3001

# Modo desarrollo
NODE_ENV=development

# JWT Secret (usar diferente a producción)
JWT_SECRET=tu_secret_local_desarrollo_12345

# Frontend (si usas Vite dev server)
VITE_API_URL=http://localhost:3001/api
```

### Paso 2: Crear Base de Datos Local

```powershell
# Conectar a PostgreSQL
psql -U postgres

# En el prompt de PostgreSQL:
CREATE DATABASE gestion_pedidos;
CREATE USER pigmea_user WITH PASSWORD 'pigmea_password';
GRANT ALL PRIVILEGES ON DATABASE gestion_pedidos TO pigmea_user;
\q
```

### Paso 3: Restaurar Backup en Local

```powershell
# Usar el backup que acabas de descargar
psql -U pigmea_user -d gestion_pedidos < backup_pigmea_2026-02-02_13-57.sql
```

O crear BD desde cero con migraciones:

```powershell
cd backend
node migrations.js
```

### Paso 4: Instalar Dependencias

```powershell
# Backend
cd backend
npm install

# Frontend (volver a raíz)
cd ..
npm install
```

### Paso 5: Ejecutar en Modo Desarrollo

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
# O si no existe script dev:
node index.js
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

El sistema estará disponible en:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Base de datos:** localhost:5432

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Desarrollo Local
```powershell
# 1. Hacer cambios en el código
# 2. Probar en http://localhost:5173
# 3. Verificar que funciona correctamente
```

### 2. Commit y Push
```powershell
git add .
git commit -m "descripción del cambio"
git push origin main
```

### 3. Desplegar a Producción
- Ir a Dokploy (http://195.201.141.3:3000)
- Click en "Redeploy"
- Esperar 2-3 minutos

---

## 📁 Estructura de Archivos

```
GestionPedidosPigmea/
├── .env                    # Producción (NO SUBIR A GIT)
├── .env.local              # Local (NO SUBIR A GIT)
├── .env.example            # Template (SÍ subir a git)
├── backend/
│   ├── index.js            # Servidor backend
│   ├── postgres-client.js  # Cliente BD
│   └── package.json
├── src/                    # Frontend
├── components/
├── hooks/
└── package.json
```

---

## 🔧 Comandos Útiles

### Backend
```powershell
cd backend
npm run dev          # Modo desarrollo con hot-reload
npm start            # Modo producción
node migrations.js   # Ejecutar migraciones
```

### Frontend
```powershell
npm run dev          # Servidor desarrollo (Vite)
npm run build        # Build para producción
npm run preview      # Preview del build
```

### Base de Datos
```powershell
# Crear backup local
pg_dump -U pigmea_user gestion_pedidos > backup_local.sql

# Restaurar backup
psql -U pigmea_user -d gestion_pedidos < backup_local.sql

# Conectar a BD
psql -U pigmea_user -d gestion_pedidos

# Ver tablas
\dt limpio.*

# Salir
\q
```

---

## ⚠️ Importante

### Archivos que NO subir a Git:
- `.env`
- `.env.local`
- `node_modules/`
- `dist/`
- `*.sql` (backups)

Ya están en `.gitignore` ✅

### Diferencias Local vs Producción:
| Aspecto | Local | Producción |
|---------|-------|------------|
| Base de Datos | localhost:5432 | servidor remoto |
| Puerto Backend | 3001 | 3001 (interno Docker) |
| URL Frontend | localhost:5173 | tu-dominio.com |
| NODE_ENV | development | production |

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED localhost:5432"
```powershell
# Verificar que PostgreSQL esté corriendo
# Si usas Docker:
docker ps | grep postgres

# Si usas PostgreSQL nativo:
Get-Service -Name postgresql*
```

### Error: "Port 3001 already in use"
```powershell
# Encontrar qué usa el puerto
Get-NetTCPConnection -LocalPort 3001

# Matar proceso (usa el PID del comando anterior)
Stop-Process -Id <PID>
```

### Error: "Cannot find module"
```powershell
# Reinstalar dependencias
cd backend
Remove-Item -Recurse -Force node_modules
npm install

cd ..
Remove-Item -Recurse -Force node_modules
npm install
```

---

## ✅ Verificación Final

Checklist para confirmar que todo funciona:

- [ ] `node --version` muestra v18+
- [ ] `psql --version` muestra PostgreSQL 15+
- [ ] Base de datos `gestion_pedidos` existe
- [ ] `npm install` sin errores (backend y frontend)
- [ ] Backend inicia en `http://localhost:3001`
- [ ] Frontend inicia en `http://localhost:5173`
- [ ] Puedes hacer login
- [ ] Puedes ver pedidos
- [ ] Los cambios se guardan en BD local

---

**¿Necesitas ayuda con algún paso?** Avísame y te guío 👨‍💻
