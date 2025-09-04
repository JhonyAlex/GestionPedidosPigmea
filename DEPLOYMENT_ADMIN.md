# 🎛️ Configuración para Deployment del Panel de Administración

## 📁 Archivos a subir al servidor

1. **Backend actualizado**: 
   - El archivo `backend/index.js` ya incluye las rutas para servir el panel
   - Las rutas `/admin/*` están configuradas
   - Las APIs `/api/admin/*` están disponibles

2. **Panel compilado**:
   - Carpeta `admin/dist/` contiene todos los archivos del panel
   - Ya configurado para usar `https://planning.pigmea.click` como base

## 🚀 Pasos para Deployment

### Opción A: Usando tu servidor actual

1. **Subir archivos al servidor**:
   ```bash
   # Subir el backend actualizado
   scp -r backend/ usuario@planning.pigmea.click:/ruta/al/proyecto/
   
   # Subir el panel compilado
   scp -r admin/dist/ usuario@planning.pigmea.click:/ruta/al/proyecto/admin/
   ```

2. **Reiniciar el servidor backend** en tu servidor de producción
3. **Acceder al panel**: `https://planning.pigmea.click/admin`

### Opción B: Usando Docker (si tienes configurado)

1. **Agregar al Dockerfile del backend**:
   ```dockerfile
   # Copiar el panel de administración
   COPY admin/dist/ /app/admin/dist/
   ```

2. **Reconstruir y deployar el contenedor**

## 🔧 Verificación en Producción

### 1. Verificar que el backend sirve los archivos
```bash
curl https://planning.pigmea.click/admin/
# Debería devolver el HTML del panel
```

### 2. Verificar las APIs administrativas
```bash
curl https://planning.pigmea.click/api/admin/users
# Debería devolver error 401 (sin autenticación)
```

### 3. Verificar el login
```bash
curl -X POST https://planning.pigmea.click/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Debería devolver un token JWT
```

## 🎯 URLs de Acceso

- **Panel Principal**: `https://planning.pigmea.click/admin`
- **API Admin**: `https://planning.pigmea.click/api/admin/*`
- **App Principal**: `https://planning.pigmea.click/` (sin cambios)

## 🔐 Credenciales (Modo sin BD)

- **admin** / **admin123** (Acceso total)
- **supervisor** / **super123** (Acceso limitado)

## 🛡️ Seguridad

✅ **Ya configurado**:
- CORS para `planning.pigmea.click`
- Rate limiting en rutas admin
- Autenticación JWT
- Contraseñas hasheadas (cuando hay BD)

## ⚠️ Importante

- El panel funciona **SIN base de datos** usando usuarios mock
- Perfecto para pruebas y demo
- Los cambios se pierden al reiniciar (modo desarrollo)
- Para producción real, configurar PostgreSQL
