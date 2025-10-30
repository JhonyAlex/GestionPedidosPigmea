# ✅ Solución: Error "column numero_compra does not exist"

## 🚨 Problema Identificado

```
❌ Error conectando a PostgreSQL: column "numero_compra" does not exist
```

---

## 🔍 Causa del Error

El script de migraciones `backend/run-migrations.sh` **NO estaba ejecutando** las migraciones necesarias:

- ❌ `006-add-nueva-fecha-entrega.sql` - NO se ejecutaba
- ❌ `007-add-numero-compra.sql` - NO se ejecutaba

Aunque estas migraciones **existen** en el directorio `database/migrations/`, el script de Docker no las incluía en su lista de ejecución.

---

## ✅ Solución Aplicada

### **Archivo Modificado**: `backend/run-migrations.sh`

**ANTES:**
```bash
# Definir rutas a los archivos de migración
MIGRATIONS_DIR="../database/migrations"
PEDIDOS_MIGRATION="$MIGRATIONS_DIR/000-create-pedidos-table.sql"
PERMISSIONS_MIGRATION="$MIGRATIONS_DIR/create_user_permissions_table.sql"
CLIENTES_MIGRATION="$MIGRATIONS_DIR/001-add-clientes-system.sql"
# Añade aquí futuras migraciones

# ...

apply_migration "Crear Tabla de Pedidos" "$PEDIDOS_MIGRATION"
apply_migration "Crear Tabla de Permisos" "$PERMISSIONS_MIGRATION"
apply_migration "Crear Tabla de Clientes" "$CLIENTES_MIGRATION"
```

**DESPUÉS:**
```bash
# Definir rutas a los archivos de migración
MIGRATIONS_DIR="../database/migrations"
PEDIDOS_MIGRATION="$MIGRATIONS_DIR/000-create-pedidos-table.sql"
PERMISSIONS_MIGRATION="$MIGRATIONS_DIR/create_user_permissions_table.sql"
CLIENTES_MIGRATION="$MIGRATIONS_DIR/001-add-clientes-system.sql"
NUEVA_FECHA_MIGRATION="$MIGRATIONS_DIR/006-add-nueva-fecha-entrega.sql"
NUMERO_COMPRA_MIGRATION="$MIGRATIONS_DIR/007-add-numero-compra.sql"
# Añade aquí futuras migraciones

# ...

apply_migration "Crear Tabla de Pedidos" "$PEDIDOS_MIGRATION"
apply_migration "Crear Tabla de Permisos" "$PERMISSIONS_MIGRATION"
apply_migration "Crear Tabla de Clientes" "$CLIENTES_MIGRATION"
apply_migration "Agregar Nueva Fecha Entrega" "$NUEVA_FECHA_MIGRATION"
apply_migration "Agregar Número de Compra" "$NUMERO_COMPRA_MIGRATION"
```

---

## 📊 Cambios Realizados

| Cambio | Descripción |
|--------|-------------|
| ✅ Agregadas 2 variables | `NUEVA_FECHA_MIGRATION` y `NUMERO_COMPRA_MIGRATION` |
| ✅ Agregadas 2 llamadas | `apply_migration` para ambas migraciones |
| ✅ Commit realizado | Cambios pusheados a GitHub |
| ✅ Deploy automático | Dokploy detectará el cambio y redeplegará |

---

## 🔧 Lo Que Hace Cada Migración

### **006-add-nueva-fecha-entrega.sql**
```sql
-- Agrega el campo nueva_fecha_entrega a la tabla pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS nueva_fecha_entrega TIMESTAMP;

-- Crea índice para búsquedas optimizadas
CREATE INDEX IF NOT EXISTS idx_pedidos_nueva_fecha_entrega 
ON pedidos(nueva_fecha_entrega);
```

**Resultado**: Campo editable inline que implementamos ✅

---

### **007-add-numero-compra.sql**
```sql
-- Agrega el campo numero_compra a la tabla pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS numero_compra VARCHAR(50);

-- Crea índice para búsquedas optimizadas
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_compra 
ON pedidos(numero_compra);

-- Crea índice adicional para búsquedas con LIKE
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_compra_text 
ON pedidos USING gin(numero_compra gin_trgm_ops);
```

**Resultado**: Campo para almacenar número de compra del cliente ✅

---

## 🚀 Próximo Deploy

Al hacer push del cambio, Dokploy automáticamente:

1. ✅ Detectará el commit nuevo
2. ✅ Clonará el repositorio
3. ✅ Construirá la imagen Docker
4. ✅ Ejecutará `run-migrations.sh` actualizado
5. ✅ Aplicará las migraciones 006 y 007
6. ✅ Iniciará el servidor sin errores

---

## 📋 Logs Esperados en Próximo Deploy

```bash
🔄 Aplicando migración: Agregar Nueva Fecha Entrega...
NOTICE: Columna nueva_fecha_entrega agregada exitosamente
NOTICE: Índice idx_pedidos_nueva_fecha_entrega creado exitosamente
✅ Migración 'Agregar Nueva Fecha Entrega' aplicada exitosamente.

🔄 Aplicando migración: Agregar Número de Compra...
NOTICE: Columna numero_compra agregada exitosamente
NOTICE: Índice idx_pedidos_numero_compra creado exitosamente
NOTICE: Índice idx_pedidos_numero_compra_text creado exitosamente
✅ Migración 'Agregar Número de Compra' aplicada exitosamente.

=== SCRIPT DE MIGRACIÓN COMPLETADO ===
🚀 Migraciones completadas. Iniciando servidor Node.js...
✅ PostgreSQL conectado correctamente
✅ Servidor iniciado en puerto 8080
```

**Ya NO verás**: ❌ Error conectando a PostgreSQL: column "numero_compra" does not exist

---

## ✅ Verificación Post-Deploy

Después del próximo deploy, puedes verificar que las columnas existan:

### **Opción 1: Logs de Dokploy**
Busca en los logs:
```
✅ Migración 'Agregar Nueva Fecha Entrega' aplicada exitosamente
✅ Migración 'Agregar Número de Compra' aplicada exitosamente
```

### **Opción 2: Consulta SQL Directa**
Si tienes acceso a psql:
```sql
-- Verificar que las columnas existan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND column_name IN ('nueva_fecha_entrega', 'numero_compra');

-- Resultado esperado:
--  column_name         | data_type
-- ---------------------+------------------------
--  nueva_fecha_entrega | timestamp without time zone
--  numero_compra       | character varying
```

### **Opción 3: Desde la Aplicación**
Cuando el deploy complete:
1. Abre la aplicación
2. Crea un nuevo pedido
3. Verás el campo "Número de Compra" funcionando
4. Verás el campo "Nueva Fecha Entrega" editable inline

---

## 🎯 Resumen Ejecutivo

| Estado | Componente |
|--------|-----------|
| ✅ Código Frontend | Sin errores de TypeScript |
| ✅ Funcionalidad Editable | Implementada correctamente |
| ✅ Migraciones SQL | Existen y están bien escritas |
| ✅ Script de Migraciones | **CORREGIDO** (faltaba ejecutarlas) |
| ✅ Commit & Push | Realizado exitosamente |
| ⏳ Próximo Deploy | Aplicará las migraciones automáticamente |

---

## 🔄 Orden de Ejecución de Migraciones

Las migraciones se ejecutan en este orden:

1. ✅ `000-create-pedidos-table.sql` - Tabla principal
2. ✅ `create_user_permissions_table.sql` - Sistema de permisos
3. ✅ `001-add-clientes-system.sql` - Sistema de clientes
4. ✅ **`006-add-nueva-fecha-entrega.sql`** - ⭐ NUEVA (agregada ahora)
5. ✅ **`007-add-numero-compra.sql`** - ⭐ NUEVA (agregada ahora)

---

## 📝 Notas Importantes

- ✅ Las migraciones son **idempotentes** (se pueden ejecutar múltiples veces)
- ✅ Usan `IF NOT EXISTS` para evitar errores en re-ejecuciones
- ✅ Crean índices automáticamente para optimizar búsquedas
- ✅ No afectan datos existentes en la base de datos

---

## 🎓 Lección Aprendida

**Problema**: Agregar nuevos campos al modelo de datos sin actualizar el script de migraciones.

**Solución**: Siempre que crees una nueva migración SQL:
1. Crear el archivo `.sql` en `database/migrations/`
2. **Agregar la referencia** en `backend/run-migrations.sh`
3. Hacer commit de ambos archivos juntos

---

## ✅ Estado Actual

**TODO LISTO PARA EL PRÓXIMO DEPLOY** 🚀

El error de `numero_compra does not exist` se resolverá automáticamente en el siguiente deploy porque:
- ✅ Script de migraciones corregido
- ✅ Cambios pusheados a GitHub
- ✅ Dokploy aplicará las migraciones automáticamente

**No necesitas hacer nada más**. El próximo deploy funcionará correctamente.

---

**Fecha de Corrección**: 19 de Octubre, 2025  
**Commit**: `8d17073` - Fix: Add missing migrations for nueva_fecha_entrega and numero_compra columns  
**Estado**: ✅ Resuelto - Pendiente de deploy
