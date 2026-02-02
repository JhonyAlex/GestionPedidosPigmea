# 🔧 Configuración: Local vs Producción

Este documento explica cómo está configurado el sistema para funcionar tanto en local como en producción.

---

## 📋 Resumen

El proyecto usa **variables de entorno** para cambiar automáticamente entre configuración local y producción.

| Archivo | Cuándo se usa | Puerto Backend |
|---------|---------------|----------------|
| `.env` | Desarrollo local | 3001 |
| `.env.production` | Producción (Dokploy) | 8080 |

---

## 🏠 Configuración Local

### Archivo: `.env`
```env
# Configuración LOCAL (desarrollo)
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

### Uso:
Cuando ejecutas `npm run dev`, Vite usa automáticamente `.env`.

### Iniciar sistema local:
```powershell
# Terminal 1 - Backend
cd backend
node index.js

# Terminal 2 - Frontend
npm run dev
```

### Acceso:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001

---

## 🌐 Configuración Producción

### Archivo: `.env.production`
```env
VITE_API_BASE_URL=https://planning.pigmea.click/api
VITE_WS_URL=https://planning.pigmea.click
```

### Uso:
Cuando ejecutas `npm run build`, Vite usa automáticamente `.env.production`.

### Deploy automático:
Dokploy está configurado para hacer **redeploy automático** cuando detecta cambios en GitHub:

1. Haces `git push` de tus cambios
2. Dokploy detecta el cambio en el repositorio
3. Ejecuta `npm run build` (usa `.env.production`)
4. Despliega la nueva versión

### Acceso:
- Producción: https://planning.pigmea.click

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Desarrollo Local
```bash
# 1. Hacer cambios en el código
# 2. Probar en local (localhost:5173)
git add .
git commit -m "Descripción del cambio"
```

### 2. Push a GitHub
```bash
git push origin main
```

### 3. Deploy Automático
- Dokploy detecta el push
- Hace redeploy automáticamente
- La nueva versión estará en https://planning.pigmea.click en 2-3 minutos

---

## 🛠️ Configuración de Vite

El archivo `vite.config.ts` está configurado para usar las variables de entorno:

```typescript
server: {
  proxy: {
    '/api': {
      target: env.VITE_WS_URL || 'http://localhost:3001',
      changeOrigin: true
    },
    '/socket.io': {
      target: env.VITE_WS_URL || 'http://localhost:3001',
      changeOrigin: true,
      ws: true
    }
  }
}
```

**¿Qué hace esto?**
- Lee la variable `VITE_WS_URL` del archivo `.env` correspondiente
- Redirige todas las peticiones `/api/*` al backend
- Redirige WebSocket `/socket.io/*` al backend
- Si no encuentra la variable, usa `localhost:3001` por defecto

---

## ⚙️ Backend - Variables de Entorno

### Archivo: `backend/.env`
```env
# Base de datos local
DATABASE_URL=postgresql://pigmea_user:Hc33JLjNRPth@localhost:5432/gestion_pedidos

# Servidor
PORT=3001
NODE_ENV=development
```

### Archivo: `backend/.env.production` (para Dokploy)
Este archivo contiene las credenciales de producción (base de datos remota, puerto 8080, etc.)

---

## 🚨 Troubleshooting

### Error: "ERR_CONNECTION_REFUSED"
**Problema:** El frontend no puede conectar al backend.

**Solución:**
1. Verifica que el backend esté corriendo:
   ```powershell
   Get-Process node
   ```

2. Verifica el puerto correcto en `.env`:
   ```env
   VITE_WS_URL=http://localhost:3001  # ✅ Correcto
   VITE_WS_URL=http://localhost:8080  # ❌ Incorrecto (puerto de producción)
   ```

3. Reinicia el frontend:
   ```powershell
   # Detener (Ctrl+C en la terminal)
   npm run dev
   ```

### Error: "Login failed - 500 Internal Server Error"
**Problema:** Error al iniciar sesión.

**Solución:**
1. Verifica que la base de datos local esté corriendo:
   ```powershell
   Get-Service postgresql-x64-15
   ```

2. Verifica que el usuario `pigmea_user` exista:
   ```powershell
   psql -U postgres -d gestion_pedidos -c "\du"
   ```

3. Verifica las credenciales en `backend/.env`:
   ```env
   DATABASE_URL=postgresql://pigmea_user:Hc33JLjNRPth@localhost:5432/gestion_pedidos
   ```

### Cambios no se reflejan después de push
**Problema:** Hiciste push pero la producción no se actualiza.

**Solución:**
1. Ve a Dokploy: http://195.201.141.3:3000
2. Busca el proyecto "produccionpgimea"
3. Click en "Redeploy" manualmente
4. Espera 2-3 minutos

---

## 📝 Notas Importantes

1. **Nunca subas credenciales a GitHub**
   - `.env` está en `.gitignore`
   - Solo sube archivos `.env.example`

2. **Prueba siempre en local primero**
   - Evita errores en producción
   - Más rápido para debugging

3. **Dokploy hace deploy automático**
   - Cada push a `main` activa un redeploy
   - Si necesitas evitarlo, usa branches separadas

4. **WebSockets requieren configuración especial**
   - El proxy de Vite maneja esto automáticamente
   - No necesitas cambiar código de Socket.IO

---

## 🎯 Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    DESARROLLO LOCAL                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (localhost:5173)                                  │
│      ↓ usa .env                                             │
│      ↓ VITE_WS_URL=http://localhost:3001                    │
│      ↓                                                       │
│  Backend (localhost:3001)                                   │
│      ↓ usa backend/.env                                     │
│      ↓ DATABASE_URL=localhost:5432                          │
│      ↓                                                       │
│  PostgreSQL Local (localhost:5432)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       PRODUCCIÓN                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Usuario → https://planning.pigmea.click                    │
│                ↓                                            │
│  Frontend (puerto 80)                                       │
│      ↓ usa .env.production                                  │
│      ↓ VITE_WS_URL=https://planning.pigmea.click            │
│      ↓                                                       │
│  Backend (puerto 8080)                                      │
│      ↓ usa backend/.env.production                          │
│      ↓ DATABASE_URL=contenedor:5432                         │
│      ↓                                                       │
│  PostgreSQL Producción (contenedor Docker)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**✅ Con esta configuración:**
- El sistema funciona en local sin cambios de código
- Dokploy despliega automáticamente cuando haces push
- No necesitas cambiar configuración manualmente
