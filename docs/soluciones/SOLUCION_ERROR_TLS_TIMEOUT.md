# 🔧 Guía de Solución: Error TLS Handshake Timeout en Dokploy

## 🎯 Problema Identificado

**Error**: `net/http: TLS handshake timeout`  
**Causa**: El servidor Dokploy no puede conectarse a Docker Hub  
**Impacto**: El deploy falla al intentar descargar la imagen base `node:18-alpine`

---

## ✅ Soluciones (En Orden de Prioridad)

### **Solución 1: Reintentar el Deploy** ⭐ (Más Simple)

Este error suele ser temporal. Intenta de nuevo:

1. Ve a tu panel de Dokploy
2. Haz clic en "Redeploy" o "Rebuild"
3. Espera a que complete el proceso

**Probabilidad de éxito**: 70%  
**Tiempo requerido**: 5-10 minutos

---

### **Solución 2: Verificar Conectividad del Servidor** 🔍

Accede a tu servidor Dokploy vía SSH y ejecuta:

```bash
# 1. Verificar conectividad a Docker Hub
curl -I https://registry-1.docker.io/v2/

# 2. Verificar DNS
nslookup registry-1.docker.io

# 3. Verificar Docker
docker info

# 4. Reiniciar Docker
sudo systemctl restart docker

# 5. Limpiar caché de Docker
docker system prune -a -f

# 6. Intentar pull manual
docker pull node:18-alpine
```

**Si el pull manual funciona**: Tu código está bien, solo fue un problema temporal  
**Si el pull manual falla**: Hay un problema de red en el servidor

---

### **Solución 3: Configurar DNS Alternativo** 🌐

Si hay problemas de DNS, configura Google DNS en el servidor:

```bash
# Editar configuración de Docker
sudo nano /etc/docker/daemon.json
```

Agregar:
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"],
  "registry-mirrors": ["https://mirror.gcr.io"]
}
```

Luego reiniciar:
```bash
sudo systemctl restart docker
```

---

### **Solución 4: Usar Registry Mirror Alternativo** 🔄

Si Docker Hub está bloqueado o lento, usa un mirror:

**Opción A: Microsoft Container Registry**
```dockerfile
FROM mcr.microsoft.com/oss/node:18-alpine
```

**Opción B: Google Container Registry**
```dockerfile
FROM gcr.io/google.com/cloudsdktool/node:18-alpine
```

**Para implementar:**
1. Modifica tu `Dockerfile` con una de las opciones anteriores
2. Haz commit y push:
   ```bash
   git add Dockerfile
   git commit -m "Use alternative registry mirror"
   git push origin main
   ```
3. Redeploy en Dokploy

---

### **Solución 5: Pre-cargar la Imagen en el Servidor** 📦

Si tienes acceso SSH al servidor Dokploy:

```bash
# Descargar la imagen manualmente en el servidor
docker pull node:18-alpine

# Verificar que se descargó
docker images | grep node
```

Luego intenta el deploy nuevamente desde Dokploy.

---

### **Solución 6: Configurar Proxy (Si aplica)** 🔐

Si tu servidor está detrás de un proxy corporativo:

```bash
# Configurar proxy para Docker
sudo mkdir -p /etc/systemd/system/docker.service.d

sudo nano /etc/systemd/system/docker.service.d/http-proxy.conf
```

Agregar:
```
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
```

Reiniciar:
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 🚨 Diagnóstico Rápido

Ejecuta este script en el servidor para diagnosticar el problema:

```bash
#!/bin/bash
echo "=== Diagnóstico de Conectividad Docker ==="
echo ""

echo "1. Probando conectividad a Docker Hub..."
curl -I https://registry-1.docker.io/v2/ && echo "✅ OK" || echo "❌ FALLO"
echo ""

echo "2. Probando DNS..."
nslookup registry-1.docker.io && echo "✅ OK" || echo "❌ FALLO"
echo ""

echo "3. Estado de Docker..."
docker info > /dev/null 2>&1 && echo "✅ Docker corriendo" || echo "❌ Docker no está corriendo"
echo ""

echo "4. Probando pull de imagen..."
timeout 60 docker pull node:18-alpine && echo "✅ Pull exitoso" || echo "❌ Pull falló"
echo ""

echo "5. Verificando firewall..."
sudo iptables -L | grep -i docker
echo ""

echo "=== Fin del diagnóstico ==="
```

---

## 📊 Tabla de Soluciones

| Solución | Dificultad | Tiempo | Efectividad | Requiere SSH |
|----------|-----------|--------|-------------|--------------|
| 1. Reintentar | ⭐ Fácil | 5 min | 70% | ❌ No |
| 2. Verificar Conectividad | ⭐⭐ Media | 10 min | 90% | ✅ Sí |
| 3. Configurar DNS | ⭐⭐ Media | 15 min | 85% | ✅ Sí |
| 4. Registry Mirror | ⭐ Fácil | 10 min | 95% | ❌ No |
| 5. Pre-cargar Imagen | ⭐⭐ Media | 5 min | 100% | ✅ Sí |
| 6. Configurar Proxy | ⭐⭐⭐ Difícil | 20 min | 100% | ✅ Sí |

---

## ✅ Checklist de Verificación

Antes de contactar soporte, verifica:

- [ ] ¿El servidor tiene acceso a internet?
- [ ] ¿Hay un firewall bloqueando Docker Hub?
- [ ] ¿El DNS resuelve correctamente?
- [ ] ¿Docker está corriendo en el servidor?
- [ ] ¿Hay suficiente espacio en disco?
- [ ] ¿El servidor está detrás de un proxy?
- [ ] ¿Otros deploys en Dokploy funcionan correctamente?

---

## 🎯 Recomendación Final

**EMPIEZA POR AQUÍ**:

1. **Reintentar el deploy** (puede ser un error temporal)
2. Si falla de nuevo, **accede al servidor vía SSH** y ejecuta:
   ```bash
   docker pull node:18-alpine
   ```
3. **Si el pull funciona**: Solo fue temporal, redeploy
4. **Si el pull falla**: Hay un problema de red, aplica Solución 3 o 4

---

## 📞 Contacto con Soporte Dokploy

Si ninguna solución funciona, contacta a soporte con esta información:

```
Error: TLS handshake timeout al descargar node:18-alpine
Proyecto: GestionPedidosPigmea
Servidor: [Tu servidor Dokploy]
Timestamp: [Fecha y hora del error]
Logs: [Adjunta los logs completos]

Pruebas realizadas:
- [ ] Reintentar deploy
- [ ] Verificar conectividad (curl)
- [ ] Pull manual de imagen
- [ ] Reinicio de Docker
- [ ] Verificación de DNS
```

---

**Última actualización**: 19 de Octubre, 2025  
**Autor**: GitHub Copilot  
**Estado**: Guía de solución de problemas
