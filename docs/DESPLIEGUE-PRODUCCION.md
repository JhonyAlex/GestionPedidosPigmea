# 🚀 Guía de Despliegue en Producción - Optimizaciones

## 📍 Estamos en GitHub Codespaces

Como estamos en **Codespaces** y la base de datos está en tu **VPS de producción**, necesitas ejecutar los comandos **directamente en tu servidor**.

---

## 🎯 Pasos para Aplicar las Optimizaciones

### **PASO 1: Conectar a tu Servidor de Producción**

```bash
# Conectar vía SSH a tu VPS
ssh tu-usuario@tu-servidor.com

# O si usas Dokploy/Panel de control, abre una terminal SSH desde allí
```

---

### **PASO 2: Ir al Directorio del Proyecto**

```bash
cd /ruta/a/tu/proyecto/backend

# Verificar que estés en el lugar correcto
pwd
# Debería mostrar algo como: /app/backend o /home/usuario/GestionPedidosPigmea/backend
```

---

### **PASO 3: Verificar Estado Actual de la BD**

```bash
# Ejecutar script de verificación
./scripts/verificar-estado-bd.sh
```

**Esto mostrará:**
- ✅ Si la columna `estado` existe
- 📊 Cuántos índices hay creados
- 📊 Distribución de pedidos por estado
- 💾 Tamaño de la tabla

---

### **PASO 4: Aplicar las Migraciones de Optimización**

```bash
# Ejecutar script de aplicación de migraciones
./scripts/aplicar-migraciones-optimizacion.sh
```

**Este script:**
1. Te pedirá confirmación (escribe `si` para continuar)
2. Aplicará la Migración 022 (campo `estado`)
3. Aplicará la Migración 023 (índices de rendimiento)
4. Marcará automáticamente pedidos antiguos como INACTIVO

**Resultado esperado:**
```
✅ Migración 022 aplicada exitosamente
✅ Migración 023 aplicada exitosamente
```

---

### **PASO 5: (Opcional) Ejecutar Archivado Automático**

```bash
# Archivar pedidos completados hace más de 2 meses
node scripts/auto-archive-old-pedidos.js
```

**Esto mostrará:**
```
🗄️ Iniciando proceso de archivado automático...
🔍 Se encontraron 15 pedidos para archivar:
   1. Pedido #12345 | Entrega: 2025-07-15 | ID: abc123
   ...
✅ 15 pedidos archivados exitosamente.
```

---

### **PASO 6: Reiniciar el Backend**

```bash
# Si usas PM2
pm2 restart backend

# Si usas systemd
sudo systemctl restart gestion-pedidos

# Si usas Docker
docker-compose restart backend

# Si usas Dokploy
# Reiniciar desde el panel de control
```

---

### **PASO 7: Verificar que Funciona**

```bash
# Probar endpoint paginado
curl "http://localhost:3001/api/pedidos?page=1&limit=10" | jq '.pagination'

# Debería devolver:
# {
#   "page": 1,
#   "limit": 10,
#   "total": 35,
#   "totalPages": 4
# }
```

---

## 📋 Archivos que Necesitas en el Servidor

He creado estos scripts para que los ejecutes:

1. **`scripts/verificar-estado-bd.sh`** - Verifica el estado actual
2. **`scripts/aplicar-migraciones-optimizacion.sh`** - Aplica las migraciones
3. **`scripts/auto-archive-old-pedidos.js`** - Archiva pedidos antiguos

---

## 🔄 Alternativa: Subir Cambios Vía Git

Si prefieres, puedes:

```bash
# Desde Codespaces (aquí donde estamos)
git add .
git commit -m "feat: Agregar optimizaciones de rendimiento con paginación"
git push origin main

# Luego en tu servidor de producción
git pull origin main
cd backend
./scripts/aplicar-migraciones-optimizacion.sh
pm2 restart backend  # o como reinicies tu app
```

---

## ⚠️ Consideraciones Importantes

1. **Backup:** Asegúrate de tener un backup de PostgreSQL antes de aplicar migraciones
2. **Downtime:** Las migraciones toman ~10-30 segundos, puede haber breve interrupción
3. **Índices:** La creación de índices puede tomar más tiempo si tienes muchos pedidos (1000+)

---

## 🆘 Si Algo Sale Mal

### Error: "column estado already exists"
**Solución:** La migración ya fue aplicada antes. Todo OK, continúa con el PASO 5.

### Error: "relation already exists"
**Solución:** Los índices ya existen. Todo OK, continúa.

### Error: "connection refused"
**Solución:** Verifica que PostgreSQL esté corriendo: `sudo systemctl status postgresql`

---

## 📞 ¿Necesitas Ayuda?

Si tienes algún problema al ejecutar estos comandos en tu servidor, **dime:**

1. ¿Qué error específico te aparece?
2. ¿Qué sistema de despliegue usas? (PM2, Docker, Dokploy, systemd)
3. ¿Dónde está ubicado el proyecto en tu servidor?

Y te ayudo a ajustar los comandos para tu caso específico.

---

## ✅ Resumen

**Desde Codespaces (aquí):**
- ✅ Ya creé todo el código necesario
- ✅ Ya creé las migraciones SQL
- ✅ Ya modifiqué el backend para soportar paginación
- ✅ Ya creé los scripts de verificación y aplicación

**En tu servidor de producción (tú ejecutas):**
1. Conectar vía SSH
2. Ejecutar `./scripts/verificar-estado-bd.sh`
3. Ejecutar `./scripts/aplicar-migraciones-optimizacion.sh`
4. Ejecutar `node scripts/auto-archive-old-pedidos.js` (opcional)
5. Reiniciar backend

---

**¿Quieres que prepare algo más antes de que ejecutes en el servidor?** 🚀
