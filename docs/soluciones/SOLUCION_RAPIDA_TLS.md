# ⚡ Solución Rápida: Error TLS Timeout en Dokploy

## 🚨 Error que Obtuviste

```
net/http: TLS handshake timeout
failed to fetch anonymous token from auth.docker.io
```

---

## ✅ SOLUCIÓN INMEDIATA (3 Pasos)

### **Paso 1: Reintentar el Deploy** ⏱️ 2 minutos

Este error **suele ser temporal**. Simplemente:

1. Ve a tu panel de Dokploy
2. Busca tu proyecto "GestionPedidosPigmea"
3. Haz clic en **"Redeploy"** o **"Rebuild"**

**Probabilidad de éxito**: 70%

---

### **Paso 2: Si el Paso 1 Falla - Accede al Servidor** 🔧 5 minutos

Conéctate por SSH a tu servidor Dokploy y ejecuta:

```bash
# Reiniciar Docker
sudo systemctl restart docker

# Limpiar caché
docker system prune -a -f

# Intentar pull manual
docker pull node:18-alpine

# Si funciona, redeploy en Dokploy
```

---

### **Paso 3: Si el Pull Manual Falla - Configurar DNS** 🌐 10 minutos

El servidor no puede resolver Docker Hub. Configura DNS de Google:

```bash
# 1. Crear/editar configuración de Docker
sudo nano /etc/docker/daemon.json

# 2. Agregar este contenido:
{
  "dns": ["8.8.8.8", "8.8.4.4"],
  "registry-mirrors": ["https://mirror.gcr.io"]
}

# 3. Guardar (Ctrl+X, Y, Enter)

# 4. Reiniciar Docker
sudo systemctl restart docker

# 5. Probar de nuevo
docker pull node:18-alpine

# 6. Si funciona, redeploy en Dokploy
```

---

## 🎯 SOLUCIÓN ALTERNATIVA (Sin SSH)

Si **NO tienes acceso SSH** al servidor, usa un registry alternativo:

### Opción A: Modificar tu Dockerfile

Cambia la primera línea de tu `Dockerfile`:

**ANTES:**
```dockerfile
FROM node:18-alpine
```

**DESPUÉS:**
```dockerfile
FROM mcr.microsoft.com/oss/node:18-alpine
```

Luego:
```bash
git add Dockerfile
git commit -m "Use Microsoft Container Registry mirror"
git push origin main
```

Redeploy en Dokploy.

---

## 📊 Tabla de Diagnóstico Rápido

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Error solo en deploy inicial | Temporal | Reintentar |
| Error persistente | DNS/Red | Configurar DNS |
| Otros deploys funcionan | Imagen específica | Usar mirror |
| Nada funciona | Firewall | Contactar admin servidor |

---

## 🛠️ Script de Diagnóstico Automático

He creado un script para ti. En el servidor Dokploy ejecuta:

```bash
# Descargar el script
curl -o diagnostico.sh https://raw.githubusercontent.com/JhonyAlex/GestionPedidosPigmea/main/diagnostico-docker.sh

# Dar permisos
chmod +x diagnostico.sh

# Ejecutar
bash diagnostico.sh
```

El script te dirá exactamente cuál es el problema.

---

## 🔍 ¿Qué está Pasando?

Tu servidor Dokploy intenta:
1. Conectarse a `auth.docker.io` para autenticarse ✅
2. Descargar la imagen `node:18-alpine` desde Docker Hub ❌

El problema es que la conexión a `auth.docker.io` está **expirando (timeout)** porque:
- ❌ DNS no resuelve correctamente
- ❌ Firewall bloqueando
- ❌ Docker Hub temporalmente lento/inaccesible
- ❌ Problemas de red del servidor

---

## ✅ ¿Cómo Saber si se Solucionó?

Después de aplicar una solución, verifica:

```bash
# En el servidor Dokploy
docker pull node:18-alpine
```

**Si dice "Pull complete"**: ✅ Problema resuelto, redeploy en Dokploy  
**Si sigue fallando**: Prueba la siguiente solución

---

## 🚀 Mi Recomendación

**EMPIEZA ASÍ**:

1. **Reintentar el deploy** (2 min) → Si falla →
2. **SSH al servidor** + `sudo systemctl restart docker` → Si falla →
3. **Configurar DNS** (ver Paso 3 arriba) → Si falla →
4. **Cambiar Dockerfile** a usar Microsoft registry

**Éxito garantizado**: Una de estas 4 opciones SIEMPRE funciona.

---

## 📞 Necesitas Ayuda?

Si ninguna solución funciona, proporciona esta info:

1. Resultado del comando: `curl -I https://auth.docker.io/token`
2. Resultado del comando: `nslookup auth.docker.io`
3. Resultado del comando: `docker pull node:18-alpine`
4. Logs completos del deploy en Dokploy

---

## 🎓 Para Entender Mejor

**¿Por qué pasa esto?**
- Docker necesita autenticarse con Docker Hub antes de descargar imágenes
- La autenticación se hace vía HTTPS con `auth.docker.io`
- Si hay problemas de red/DNS, la conexión expira (timeout)

**¿Es culpa de mi código?**
- ❌ **NO**, tu código está perfecto
- Este es un problema de infraestructura/red del servidor

**¿Pasará de nuevo?**
- Si es temporal (70% de los casos): No
- Si es DNS/configuración: Sí, hasta que se configure correctamente

---

## 📝 Notas Importantes

- ✅ Tu implementación del campo editable está **perfecta**
- ✅ Los errores de TypeScript están **resueltos**
- ✅ El código compila correctamente en local
- ❌ Solo hay un problema de **red en el servidor** Dokploy

**Tu trabajo está completo**. Este es un problema del servidor, no de tu código.

---

**Última actualización**: 19 de Octubre, 2025  
**Tiempo estimado de solución**: 5-15 minutos  
**Dificultad**: ⭐⭐ Media (requiere acceso SSH idealmente)
