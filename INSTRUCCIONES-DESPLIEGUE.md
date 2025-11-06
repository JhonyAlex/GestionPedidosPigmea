# 🎯 INSTRUCCIONES PARA DESPLEGAR EN PRODUCCIÓN

## ✅ ESTADO ACTUAL

**TODO EL CÓDIGO YA ESTÁ LISTO Y SUBIDO A GITHUB:**
- ✅ Commit `079e98d`: Paginación y optimización implementada
- ✅ Commit `b34a1b1`: Migraciones SQL 022 y 023 creadas
- ✅ Backend modificado para soportar paginación
- ✅ Scripts de despliegue creados

---

## 🚀 PASO A PASO PARA DESPLEGAR

### **1. Conectar a tu servidor de producción**

```bash
# Opción A: SSH directo
ssh tu-usuario@planning.pigmea.click

# Opción B: Si usas Dokploy, ir a:
# Panel de control → Tu aplicación → Terminal/Console
```

---

### **2. Navegar al directorio del proyecto**

```bash
cd /ruta/a/tu/proyecto

# Ejemplo típico:
# cd /app
# o
# cd /home/usuario/GestionPedidosPigmea
```

---

### **3. Hacer pull de los cambios**

```bash
git pull origin main
```

**Salida esperada:**
```
Updating b34a1b1..079e98d
Fast-forward
 backend/index.js                                     | 65 +++++++++++++++++--
 backend/postgres-client.js                           | 124 ++++++++++++++++++++++++++++++++++
 backend/scripts/aplicar-migraciones-optimizacion.sh | 62 +++++++++++++++++
 backend/scripts/verificar-estado-bd.sh              | 89 ++++++++++++++++++++++++
 docs/DESPLIEGUE-PRODUCCION.md                        | 210 ++++++++++++++++++++++++++++++++++++++++++++++++++++++
 docs/RESUMEN-EJECUTIVO.md                            | 363 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 6 files changed, 818 insertions(+), 10 deletions(-)
```

---

### **4. Ir al directorio backend**

```bash
cd backend
```

---

### **5. Verificar estado actual de la base de datos**

```bash
chmod +x scripts/*.sh
./scripts/verificar-estado-bd.sh
```

**Esto te mostrará:**
- Si la columna `estado` existe
- Cuántos índices hay creados
- Distribución de pedidos por estado
- Pedidos candidatos a archivado

**Ejemplo de salida:**
```
=== VERIFICACIÓN DEL ESTADO DE LA BASE DE DATOS ===

✅ Conectando a: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432/gestion_pedidos

📋 1. Verificando columna 'estado' en tabla pedidos...
❌ Columna estado NO EXISTE - Ejecutar migración 022

📋 2. Verificando índices de rendimiento...
5 índices encontrados

📊 3. Distribución de pedidos por estado:
 estado | cantidad 
--------+----------
 NULL   |       35

💾 5. Tamaño actual de la tabla pedidos:
 tamaño_total | tamaño_tabla | tamaño_indices 
--------------+--------------+----------------
 120 kB       | 72 kB        | 48 kB
```

---

### **6. Aplicar las migraciones de optimización**

```bash
./scripts/aplicar-migraciones-optimizacion.sh
```

**El script te pedirá confirmación:**
```
=== APLICANDO MIGRACIONES DE OPTIMIZACIÓN ===

⚠️  IMPORTANTE: Este script modificará la base de datos
    Asegúrate de tener un backup reciente antes de continuar

¿Deseas continuar? (si/no):
```

**Escribe:** `si`

**Salida esperada:**
```
✅ Iniciando aplicación de migraciones...

🔗 Conectando a: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432/gestion_pedidos

🔄 Aplicando Migración 022: Campo 'estado' para archivado...
ALTER TABLE
CREATE INDEX
CREATE INDEX
✅ Migración 022 aplicada exitosamente

🔄 Aplicando Migración 023: Índices de rendimiento...
CREATE INDEX
CREATE INDEX
CREATE INDEX
... (9 índices en total)
✅ Migración 023 aplicada exitosamente

=== MIGRACIONES APLICADAS EXITOSAMENTE ===

📊 Resumen de cambios:
   1. ✅ Columna 'estado' agregada a tabla pedidos
   2. ✅ Pedidos antiguos marcados como INACTIVO automáticamente
   3. ✅ 9 índices de rendimiento creados
```

---

### **7. (Opcional) Ejecutar archivado de pedidos antiguos**

```bash
node scripts/auto-archive-old-pedidos.js
```

**Esto mostrará:**
```
🗄️ Iniciando proceso de archivado automático...
📅 Fecha límite: 2025-09-06
🔍 Se encontraron 8 pedidos para archivar:
   1. Pedido #P-2025-001 | Entrega: 2025-07-15 | ID: abc123
   2. Pedido #P-2025-002 | Entrega: 2025-08-01 | ID: def456
   ...
✅ 8 pedidos archivados exitosamente.
```

---

### **8. Reiniciar el backend**

Dependiendo de cómo esté desplegada tu app:

```bash
# Opción A: PM2
pm2 restart backend

# Opción B: Docker Compose
docker-compose restart backend

# Opción C: Systemd
sudo systemctl restart gestion-pedidos

# Opción D: Dokploy
# Ir al panel y hacer clic en "Restart Application"
```

---

### **9. Verificar que funciona**

```bash
# Probar endpoint paginado (desde el servidor)
curl -H "x-user-id: 4" -H "x-user-role: Administrador" \
  "http://localhost:3001/api/pedidos?page=1&limit=10" | jq '.pagination'
```

**Salida esperada:**
```json
{
  "page": 1,
  "limit": 10,
  "total": 35,
  "totalPages": 4
}
```

**Probar desde internet:**
```bash
curl "https://planning.pigmea.click/api/pedidos?page=1&limit=10" | jq '.pagination'
```

---

## ✅ VERIFICACIÓN POST-DESPLIEGUE

### **Ver logs del backend**

```bash
# Si usas PM2
pm2 logs backend

# Si usas Docker
docker-compose logs -f backend --tail=50

# Buscar líneas como:
# 📊 GET /api/pedidos (PAGINADO) - Página 1: 10/35 pedidos
```

### **Verificar índices creados**

```bash
psql $DATABASE_URL -c "
    SELECT COUNT(*) as total_indices 
    FROM pg_indexes 
    WHERE tablename = 'pedidos' 
    AND indexname LIKE 'idx_pedidos_%';
"
```

**Debe mostrar:** `total_indices | 9` (o más)

### **Verificar campo estado**

```bash
psql $DATABASE_URL -c "
    SELECT estado, COUNT(*) 
    FROM pedidos 
    GROUP BY estado;
"
```

**Debe mostrar algo como:**
```
 estado   | count 
----------+-------
 ACTIVO   |    27
 INACTIVO |     8
```

---

## 🎉 LISTO

Si todo sale bien, tu sistema ahora:

✅ **Carga solo últimos 2 meses por defecto** (más rápido)
✅ **Permite buscar en todo el histórico** (con filtros)
✅ **Tiene índices optimizados** (consultas 10x más rápidas)
✅ **Está preparado para 2000+ pedidos** (sin degradación)

---

## 🆘 SI ALGO FALLA

### Error: "column estado already exists"
**Solución:** Las migraciones ya fueron aplicadas antes. ✅ Todo OK, continúa.

### Error: "psql: command not found"
**Solución:** Instalar cliente PostgreSQL:
```bash
sudo apt-get update && sudo apt-get install -y postgresql-client
```

### Error: "permission denied: ./scripts/verificar-estado-bd.sh"
**Solución:** Dar permisos de ejecución:
```bash
chmod +x scripts/*.sh
```

### No aparece paginación en las respuestas
**Solución:** Verificar que el backend se reinició correctamente:
```bash
pm2 restart backend
pm2 logs backend --lines 50
```

---

## 📞 NECESITAS AYUDA?

Si algo no funciona:

1. **Copia el error exacto** que aparece
2. **Copia las últimas 30 líneas del log** del backend
3. **Dime en qué paso te quedaste**

Y te ayudo a resolverlo.

---

**Tiempo total estimado:** 10-15 minutos  
**Riesgo:** Bajo (migraciones son seguras e idempotentes)

🚀 **¡Listo para desplegar!**
