# 🚀 Guía de Limpieza y Re-habilitación de Migraciones (PRODUCCIÓN)

## 📋 Contexto del Servidor

- **Entorno:** Servidor de producción con Docker Swarm
- **Base de Datos:** Contenedor `b03f8648f450` (PostgreSQL)
- **Aplicación:** Contenedor `ea4b2ce1562e` (Node.js + React)
- **Estado Actual:** Servidor funcionando, migraciones deshabilitadas temporalmente
- **Backup Existente:** ✅ Ya creado (`backup_seguro_pedidos.sql` - 1 MB)

---

## ✅ ESTADO ACTUAL (VERIFICADO)

| Item | Estado |
|------|--------|
| Backup de seguridad | ✅ Creado (`backup_seguro_pedidos.sql`) |
| Columnas duplicadas | ✅ **LIMPIO** (0 columnas duplicadas) |
| Servidor funcionando | ✅ Operativo |
| Migraciones bloqueadas | ⚠️ Líneas 85-87 de `run-migrations.sh` comentadas |

---

## 🎯 OBJETIVO

Re-habilitar las migraciones de números de compra que fueron deshabilitadas temporalmente.

---

## 📝 PASOS A SEGUIR

### Paso 1: Conectarse al Servidor (YA HECHO)

```bash
# Ya estás conectado como root
ssh root@pigmea-server
```

**Estado:** ✅ Completado

---

### Paso 2: Verificar Estado de la Base de Datos (YA HECHO)

```bash
# Verificar que NO hay columnas duplicadas
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name ~ '_[0-9]+$';"
```

**Resultado esperado:** `(0 rows)` ✅

**Estado:** ✅ Completado (tabla limpia)

---

### Paso 3: Re-habilitar las Migraciones en el Contenedor

**Opción A: Usando sed (Recomendado - Más Rápido)**

```bash
# Entrar al contenedor de la aplicación
docker exec -it ea4b2ce1562e /bin/bash

# Una vez dentro del contenedor, ejecutar:
cd /app/backend

# Descomenta la migración de numero_compra
sed -i 's/^# apply_migration "Agregar Número de Compra"/apply_migration "Agregar Número de Compra"/' run-migrations.sh

# Descomenta la migración de numeros_compra array
sed -i 's/^# apply_migration "Convertir Número Compra a Array"/apply_migration "Convertir Número Compra a Array"/' run-migrations.sh

# Verificar que los cambios se aplicaron correctamente
grep -nC 2 "Número de Compra" run-migrations.sh
```

**Resultado esperado:**
```bash
85:apply_migration "Agregar Número de Compra" "$NUMERO_COMPRA_MIGRATION"
87:apply_migration "Convertir Número Compra a Array" "$NUMEROS_COMPRA_ARRAY_MIGRATION"
```

**Salir del contenedor:**
```bash
exit
```

---

**Opción B: Usando vi/nano (Si prefieres editor manual)**

```bash
docker exec -it ea4b2ce1562e /bin/bash
cd /app/backend
vi run-migrations.sh

# Buscar las líneas 85-87 y eliminar los "#" al inicio
# Guardar y salir (:wq en vi)
exit
```

---

### Paso 4: Reiniciar el Contenedor para Aplicar Migraciones

```bash
# Reiniciar el contenedor de la aplicación
docker restart ea4b2ce1562e

# Esperar 10-15 segundos para que inicie completamente
sleep 15
```

**⏱️ Tiempo estimado:** 15-30 segundos

---

### Paso 5: Verificar que las Migraciones se Aplicaron Exitosamente

```bash
# Ver los logs del contenedor en tiempo real
docker logs -f ea4b2ce1562e
```

**Buscar en los logs:**
```
🔄 Aplicando migración: Agregar Número de Compra...
✅ Migración 'Agregar Número de Compra' aplicada exitosamente.
🔄 Aplicando migración: Convertir Número Compra a Array...
✅ Migración 'Convertir Número Compra a Array' aplicada exitosamente.
...
🚀 Servidor iniciado en puerto 8080
```

**Presiona `Ctrl+C` para salir de los logs cuando veas "Servidor iniciado"**

---

### Paso 6: Verificar que las Columnas se Crearon Correctamente

```bash
# Verificar que las columnas existen en la base de datos
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name IN ('numero_compra', 'numeros_compra');"
```

**Resultado esperado:**
```
    column_name    |     data_type      
-------------------+--------------------
 numero_compra     | character varying
 numeros_compra    | ARRAY
```

---

### Paso 7: Verificación Final - Probar el Sistema

```bash
# 1. Verificar que el contenedor está corriendo
docker ps | grep ea4b2ce1562e

# 2. Hacer una petición de prueba a la API
docker exec -it ea4b2ce1562e curl -s http://localhost:8080/health | head -20

# 3. Verificar que los datos siguen intactos
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) as total_pedidos FROM pedidos;"
```

**Resultado esperado:**
- Contenedor: `Up XX minutes`
- Health check: `{"status":"healthy"}`
- Total pedidos: Mismo número que antes

---

## ✅ CHECKLIST COMPLETO

Marca cada paso conforme lo completes:

### Pre-verificación (YA COMPLETADO)
- [x] Acceso SSH al servidor
- [x] Backup creado (`backup_seguro_pedidos.sql`)
- [x] Tabla limpia (0 columnas duplicadas)

### Re-habilitación de Migraciones
- [ ] Paso 3: Archivo `run-migrations.sh` editado dentro del contenedor
- [ ] Paso 4: Contenedor reiniciado
- [ ] Paso 5: Logs muestran migraciones exitosas
- [ ] Paso 6: Columnas `numero_compra` y `numeros_compra` creadas
- [ ] Paso 7: Sistema funcionando correctamente

### Verificación Post-Deploy
- [ ] API responde correctamente (`/health`)
- [ ] Frontend accesible
- [ ] Datos intactos (mismo número de pedidos)
- [ ] No hay errores en logs

---

## 🆘 EN CASO DE PROBLEMAS

### Problema 1: Migraciones Fallan

**Síntoma:**
```
❌ ERROR: tables can have at most 1600 columns
```

**Causa:** La tabla aún tiene columnas duplicadas (poco probable ya que verificamos que está limpia).

**Solución:**
```bash
# Verificar de nuevo columnas duplicadas
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pedidos';"

# Si el número es > 100, hay un problema. Restaurar backup:
docker cp ./backup_seguro_pedidos.sql b03f8648f450:/tmp/
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos < /tmp/backup_seguro_pedidos.sql
```

---

### Problema 2: Contenedor No Arranca

**Síntoma:**
```
docker ps  # No muestra el contenedor ea4b2ce1562e
```

**Solución:**
```bash
# Ver logs de error
docker logs ea4b2ce1562e

# Si es error de sintaxis en run-migrations.sh, restaurar versión anterior
docker exec -it ea4b2ce1562e /bin/bash
cd /app/backend
# Volver a comentar las líneas (añadir # al inicio)
vi run-migrations.sh
exit

# Reiniciar
docker restart ea4b2ce1562e
```

---

### Problema 3: Datos Corruptos o Perdidos

**Solución Inmediata:**
```bash
# Restaurar el backup de seguridad
docker cp ./backup_seguro_pedidos.sql b03f8648f450:/tmp/backup.sql
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -f /tmp/backup.sql
docker restart ea4b2ce1562e
```

---

## 📊 COMANDOS DE DIAGNÓSTICO RÁPIDO

```bash
# Ver estado de todos los contenedores
docker ps

# Ver logs de la aplicación
docker logs --tail 50 ea4b2ce1562e

# Ver logs de la base de datos
docker logs --tail 50 b03f8648f450

# Contar columnas de la tabla pedidos
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pedidos';"

# Contar pedidos totales
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) FROM pedidos;"

# Ver últimas 10 columnas de la tabla
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos' ORDER BY ordinal_position DESC LIMIT 10;"
```

---

## ⏱️ TIEMPO TOTAL ESTIMADO

- **Si todo va bien:** 2-3 minutos
- **Con verificaciones completas:** 5-7 minutos
- **Si hay problemas (restauración):** 10-15 minutos

---

## 💡 IMPORTANTE: DESPLIEGUES FUTUROS

### Para Mantener los Cambios Permanentemente

Los cambios en el contenedor se perderán si Dokploy hace un redeploy. Para hacerlos permanentes:

**Opción 1: Actualizar el Repositorio Git**

```bash
# En tu máquina local (Windows)
# Editar backend/run-migrations.sh y descomentar las líneas 85-87

# Commit y push
git add backend/run-migrations.sh
git commit -m "fix: Re-habilitar migraciones de números de compra"
git push

# En Dokploy: Hacer redeploy del proyecto
```

**Opción 2: Crear Variable de Entorno en Dokploy**

- Ir a Dokploy → Proyecto → Environment Variables
- Añadir: `SKIP_NUMERO_COMPRA_MIGRATION=false`
- Redeploy

---

## 📞 SOPORTE ADICIONAL

Si después de seguir estos pasos encuentras problemas:

1. **Captura de pantalla de los logs:**
   ```bash
   docker logs ea4b2ce1562e > /tmp/app_logs.txt
   cat /tmp/app_logs.txt
   ```

2. **Estado de la base de datos:**
   ```bash
   docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "\d pedidos" > /tmp/schema.txt
   cat /tmp/schema.txt
   ```

3. **Backup siempre disponible:**
   ```bash
   ls -lh ./backup_seguro_pedidos.sql
   ```

---

## ✅ CONFIRMACIÓN FINAL

Después de completar todos los pasos, deberías tener:

- ✅ Migraciones de números de compra **habilitadas**
- ✅ Columnas `numero_compra` y `numeros_compra` **creadas**
- ✅ Servidor **funcionando** sin errores
- ✅ Datos **intactos** (mismo número de pedidos)
- ✅ Sistema **completamente operativo**

---

## 🚀 COMANDO RESUMIDO (COPY-PASTE)

```bash
# ===== PROCESO COMPLETO EN UN SOLO BLOQUE =====

# 1. Entrar al contenedor
docker exec -it ea4b2ce1562e /bin/bash

# 2. Editar archivo (dentro del contenedor)
cd /app/backend
sed -i 's/^# apply_migration "Agregar Número de Compra"/apply_migration "Agregar Número de Compra"/' run-migrations.sh
sed -i 's/^# apply_migration "Convertir Número Compra a Array"/apply_migration "Convertir Número Compra a Array"/' run-migrations.sh

# 3. Verificar cambios
grep -nC 2 "Número de Compra" run-migrations.sh

# 4. Salir del contenedor
exit

# 5. Reiniciar contenedor
docker restart ea4b2ce1562e

# 6. Esperar inicio (15 segundos)
sleep 15

# 7. Ver logs (Ctrl+C para salir cuando veas "Servidor iniciado")
docker logs -f ea4b2ce1562e
```

**Después de los logs, ejecutar verificación:**

```bash
# Verificar columnas creadas
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name IN ('numero_compra', 'numeros_compra');"

# Verificar datos intactos
docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) as total_pedidos FROM pedidos;"
```

---

*Última actualización: 2025-12-20*  
*Versión: 1.0 (Producción Docker)*  
*Servidor: pigmea-server*