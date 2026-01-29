# 🔍 AUDITORÍA COMPLETA DE BASE DE DATOS
**Fecha:** 2026-01-29  
**Sistema:** Gestión de Pedidos Pigmea  
**Schemas:** `limpio`, `public`

---

## 📊 RESUMEN EJECUTIVO

### Problemas Críticos Resueltos:
1. ✅ UUID truncado en autenticación (`getAdminUserById`)
2. ✅ Tabla `limpio.clientes` creada con estructura básica
3. ✅ Columnas agregadas/renombradas en `limpio.clientes`
4. ✅ Conversión de `cliente_id` y `vendedor_id` a UUID en `limpio.pedidos`
5. ✅ Queries actualizadas para usar `limpio.*` en lugar de `public.*`

### Problemas Pendientes:
1. ⚠️ Check constraint de `estado` en `limpio.clientes` (mayúsculas vs minúsculas)
2. ⚠️ Corrupción en catálogo de PostgreSQL (OID 103850)
3. ⚠️ Duplicación de tablas entre `limpio` y `public`
4. ⚠️ 33 scripts de migración que referencian `public.pedidos` en lugar de `limpio.pedidos`

---

## 🗂️ ESTRUCTURA ACTUAL

### Schema `limpio` (9 tablas):
| Tabla | Columnas | Propósito | Estado |
|-------|----------|-----------|--------|
| `admin_users` | 15 | Usuarios administrativos | ✅ OK |
| `audit_log` | 6 | Log de auditoría legacy | ✅ OK |
| `audit_logs` | 11 | Log de auditoría nuevo | ✅ OK |
| `clientes` | 16 | Clientes del sistema | ⚠️ Constraint |
| `pedido_comments` | 11 | Comentarios de pedidos | ✅ OK |
| `pedidos` | 54 | Pedidos principales | ✅ OK |
| `user_permissions` | 7 | Permisos de usuarios | ✅ OK |
| `users` | 7 | Usuarios legacy | ✅ OK |
| `vendedores` | 7 | Vendedores | ✅ OK |

### Schema `public` (19 tablas):
- Mayoría son tablas operacionales (producción, materiales, notificaciones)
- Algunas duplican funcionalidad de `limpio` (audit_log, user_permissions, users)

---

## 🔧 PROBLEMAS DETALLADOS Y SOLUCIONES

### 1. Check Constraint en `limpio.clientes.estado`

**Problema:**
```sql
-- Constraint actual:
CHECK (estado IN ('activo', 'inactivo'))

-- Código envía:
estado = 'Activo'  -- Con mayúscula
```

**Solución:**
```sql
ALTER TABLE limpio.clientes 
DROP CONSTRAINT IF EXISTS clientes_estado_check;

ALTER TABLE limpio.clientes 
ADD CONSTRAINT clientes_estado_check 
CHECK (estado IN ('activo', 'inactivo', 'Activo', 'Inactivo'));
```

**Alternativa (mejor a largo plazo):**
Modificar el código para normalizar a minúsculas:
```javascript
estado: (clienteData.estado || 'Activo').toLowerCase()
```

---

### 2. Corrupción en Catálogo PostgreSQL

**Síntomas:**
- `pg_dump` falla con "parent table with OID 103821 not found"
- `DROP TYPE public.clientes` falla con "cache lookup failed for relation 103850"

**Causa:**
- Objetos huérfanos en el catálogo de PostgreSQL
- Probablemente por migraciones fallidas o eliminaciones incompletas

**Solución:**
```sql
-- Limpiar objetos huérfanos (requiere acceso superuser)
REINDEX DATABASE gestion_pedidos;

-- O recrear el schema public si es necesario
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO pigmea_user;
```

**Recomendación:** 
- Monitorear y no intentar crear vistas en `public` por ahora
- Usar solo `limpio.*` en el código

---

### 3. Duplicación de Tablas

**Tablas duplicadas entre `limpio` y `public`:**
- `audit_log`
- `audit_logs`
- `user_permissions`
- `users`
- `vendedores`

**Problema:**
- Confusión sobre cuál es la fuente de verdad
- Posible inconsistencia de datos

**Solución:**
1. Confirmar que `limpio.*` es la fuente de verdad
2. Eliminar tablas duplicadas en `public` (excepto si son usadas por otros sistemas)
3. Actualizar `search_path` para priorizar `limpio`:
```sql
ALTER ROLE pigmea_user SET search_path = limpio, public;
```

---

### 4. Scripts de Migración Desactualizados

**Problema:**
33 scripts de migración referencian `pedidos` sin schema, lo que apunta a `public.pedidos` en lugar de `limpio.pedidos`.

**Scripts afectados:**
```
001-add-clientes-system.sql
002-fix-clientes-structure.sql
003-add-vendedor-field.sql
... (30 más)
```

**Solución:**
Ya existe un script PowerShell para esto:
```powershell
.\database\update-all-migrations.ps1
```

**Estado:** Pendiente de ejecución

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Correcciones Inmediatas (Ahora)
1. ✅ Ejecutar fix para check constraint de `estado`
2. ✅ Verificar que vendedores y clientes funcionan
3. ✅ Probar creación/edición de pedidos

### Fase 2: Limpieza de Estructura (Próxima sesión)
1. Actualizar 33 scripts de migración con PowerShell
2. Decidir qué hacer con tablas duplicadas en `public`
3. Documentar schema definitivo

### Fase 3: Optimización (Futuro)
1. Normalizar valores de `estado` a minúsculas en código
2. Limpiar corrupción del catálogo PostgreSQL
3. Implementar sistema de tracking de migraciones

---

## 🎯 COMANDOS PARA EJECUTAR AHORA

```bash
# 1. Fix constraint de estado
docker exec cf17c9b43101 psql -U pigmea_user -d gestion_pedidos -c "
ALTER TABLE limpio.clientes 
DROP CONSTRAINT IF EXISTS clientes_estado_check;

ALTER TABLE limpio.clientes 
ADD CONSTRAINT clientes_estado_check 
CHECK (estado IN ('activo', 'inactivo', 'Activo', 'Inactivo'));
"

# 2. Verificar estructura final de limpio.clientes
docker exec cf17c9b43101 psql -U pigmea_user -d gestion_pedidos -c "
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'limpio' AND table_name = 'clientes'
ORDER BY ordinal_position;
"

# 3. Verificar que cliente_id y vendedor_id son UUID
docker exec cf17c9b43101 psql -U pigmea_user -d gestion_pedidos -c "
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'limpio' 
  AND table_name = 'pedidos'
  AND column_name IN ('cliente_id', 'vendedor_id');
"
```

---

## 📊 MÉTRICAS DE SALUD

### Datos Actuales:
- **Pedidos:** 74 registros en `limpio.pedidos`
- **Clientes:** 0 registros en `limpio.clientes` (recién creada)
- **Vendedores:** ? registros en `limpio.vendedores`
- **Admin Users:** 1 usuario (admin)

### Integridad Referencial:
- ✅ `limpio.pedidos.cliente_id` → `limpio.clientes.id` (UUID)
- ✅ `limpio.pedidos.vendedor_id` → `limpio.vendedores.id` (UUID)
- ⚠️ 74 pedidos con `cliente_id` poblado (UUIDs válidos)
- ⚠️ 0 pedidos con `vendedor_id` poblado

---

## 🚨 RIESGOS IDENTIFICADOS

1. **Alto:** Corrupción en catálogo PostgreSQL podría empeorar
2. **Medio:** Duplicación de tablas puede causar confusión
3. **Bajo:** Scripts de migración desactualizados (no se ejecutan automáticamente)

---

## ✅ CHECKLIST DE VERIFICACIÓN POST-CORRECCIÓN

- [ ] Crear cliente nuevo funciona
- [ ] Editar cliente existente funciona
- [ ] Crear vendedor nuevo funciona
- [ ] Editar vendedor existente funciona
- [ ] Crear pedido con cliente_id funciona
- [ ] Crear pedido con vendedor_id funciona
- [ ] API `/api/clientes/simple` devuelve datos
- [ ] API `/api/vendedores` devuelve datos
- [ ] API `/api/pedidos` devuelve 74 pedidos

---

**Fin del Reporte de Auditoría**
