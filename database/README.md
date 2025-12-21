# 📁 Database Migrations

Este directorio contiene las **migraciones SQL** que definen el esquema completo de la base de datos PostgreSQL.

## 🎯 Propósito

Las migraciones son la **fuente de verdad** del esquema de la base de datos. Permiten:
- 🆕 Crear la base de datos desde cero en nuevos servidores
- 🔄 Replicar el ambiente en desarrollo local
- 🛡️ Recuperación ante desastres (disaster recovery)
- 📝 Historial completo de cambios del esquema
- 🚀 Deploys reproducibles en staging/producción

## 📂 Estructura

```
database/
├── README.md                          # Este archivo
└── migrations/                        # Migraciones SQL numeradas (CRÍTICO - NO ELIMINAR)
    ├── 000-create-pedidos-table.sql   # Tabla principal de pedidos
    ├── 001-add-clientes-system.sql    # Sistema de clientes
    ├── 002-fix-clientes-structure.sql # Correcciones de estructura
    └── ...                            # Migraciones subsecuentes
```

## 🔄 Cómo Funcionan las Migraciones

### Ejecución Automática
Las migraciones se ejecutan **automáticamente** en cada deploy mediante:
- [`backend/run-migrations.sh`](../backend/run-migrations.sh) - Script principal
- [`backend/docker-entrypoint.sh`](../backend/docker-entrypoint.sh) - Entrypoint de Docker

### Idempotencia
**Todas las migraciones son idempotentes** - se pueden ejecutar múltiples veces sin causar errores:

```sql
-- ✅ CORRECTO - Usa IF NOT EXISTS
CREATE TABLE IF NOT EXISTS mi_tabla (...);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mi_campo VARCHAR(255);

-- ✅ CORRECTO - Verifica antes de modificar
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'pedidos' AND column_name = 'campo_viejo') THEN
        ALTER TABLE pedidos RENAME COLUMN campo_viejo TO campo_nuevo;
    END IF;
END $$;
```

### Logs Esperados
Al ejecutarse, verás mensajes como:
```
NOTICE: relation "materiales" already exists, skipping
NOTICE: relation "idx_materiales_numero" already exists, skipping
✅ Migración 'Crear Sistema de Gestión de Materiales' aplicada exitosamente.
```

Esto es **normal y correcto** - significa que las migraciones están funcionando como deben.

## 📋 Lista de Migraciones

| # | Archivo | Descripción |
|---|---------|-------------|
| 000 | `create-pedidos-table.sql` | Tabla principal de pedidos |
| 001 | `add-clientes-system.sql` | Sistema de clientes |
| 002 | `fix-clientes-structure.sql` | Correcciones estructura clientes |
| 003 | `add-razon-social.sql` | Campo razón social |
| 006 | `add-nueva-fecha-entrega.sql` | Campo nueva fecha de entrega |
| 007 | `add-numero-compra.sql` | Número de compra |
| 008 | `convert-numero-compra-to-array.sql` | Múltiples números de compra |
| 009 | `add-cliche-info.sql` | Información de clichés |
| 010 | `auto-update-cliente-estado.sql` | Auto-actualización estado cliente |
| 011 | `add-anonimo.sql` | Campo anónimo |
| 013 | `add-cliche-dates.sql` | Fechas de cliché |
| 014 | `create-vendedores-table.sql` | Tabla de vendedores |
| 015 | `add-vendedor-fk-to-pedidos.sql` | Relación pedidos-vendedores |
| 016 | `add-observaciones-material.sql` | Observaciones de material |
| 017 | `rename-dto-compra.sql` | Renombrar dto_compra |
| 018 | `add-perforado-fields.sql` | Campos de perforado |
| 019 | `add-anonimo-post-impresion.sql` | Anónimo post-impresión |
| 020 | `create-clientes-history.sql` | Historial de clientes |
| 021 | `create-vendedores-history.sql` | Historial de vendedores |
| 022 | `add-estado-pedido.sql` | Estados de pedido |
| 023 | `add-performance-indexes.sql` | Índices de optimización |
| 024 | `add-tiempo-produccion-decimal.sql` | Tiempo de producción decimal |
| 025 | `create-notifications-table.sql` | Sistema de notificaciones |
| 026 | `create-produccion-tracking.sql` | Tracking de producción |
| 027 | `create-materiales-table.sql` | Sistema de gestión de materiales |

## ➕ Agregar una Nueva Migración

### 1. Crear el archivo SQL
Nombrar con el siguiente número secuencial:
```bash
# Si la última es 027, crear:
database/migrations/028-descripcion-del-cambio.sql
```

### 2. Contenido del archivo
```sql
-- ============================================================================
-- Migración: [Descripción breve]
-- Versión: 028
-- Fecha: YYYY-MM-DD
-- Descripción: [Descripción detallada del cambio]
-- ============================================================================

-- SIEMPRE usar IF NOT EXISTS para idempotencia
ALTER TABLE mi_tabla ADD COLUMN IF NOT EXISTS mi_nuevo_campo VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_mi_campo ON mi_tabla(mi_nuevo_campo);

-- Para renombrar columnas, verificar primero
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'mi_tabla' AND column_name = 'nombre_viejo') THEN
        ALTER TABLE mi_tabla RENAME COLUMN nombre_viejo TO nombre_nuevo;
    END IF;
END $$;
```

### 3. Registrar en el script de migraciones
Agregar al archivo [`backend/run-migrations.sh`](../backend/run-migrations.sh):
```bash
apply_migration "028-descripcion-del-cambio.sql" "Descripción breve"
```

### 4. Probar localmente
```bash
cd backend
sh run-migrations.sh
```

### 5. Verificar idempotencia
Ejecutar el script **dos veces** - no debe fallar la segunda vez.

## 🚨 Reglas Críticas

### ✅ SIEMPRE
- ✅ Usar `IF NOT EXISTS` en CREATE TABLE/INDEX
- ✅ Verificar existencia antes de ALTER/RENAME
- ✅ Probar la migración localmente antes de deploy
- ✅ Ejecutar dos veces para verificar idempotencia
- ✅ Agregar comentarios descriptivos
- ✅ Mantener el orden numérico secuencial

### ❌ NUNCA
- ❌ Modificar migraciones ya aplicadas en producción
- ❌ Eliminar migraciones del historial
- ❌ Usar DROP TABLE sin verificación
- ❌ Hacer cambios destructivos sin respaldo
- ❌ Saltarse números en la secuencia

## 🛡️ Recuperación ante Desastres

Si necesitas recrear la base de datos desde cero:

### Opción 1: Docker (recomendado)
```bash
docker build -t gestion-pedidos .
docker run -p 8080:8080 --env-file .env gestion-pedidos
# Las migraciones se ejecutan automáticamente
```

### Opción 2: Manual
```bash
# 1. Crear base de datos vacía
createdb gestion_pedidos

# 2. Ejecutar migraciones
cd backend
sh run-migrations.sh

# 3. Verificar
psql gestion_pedidos -c "\dt"
```

## 📞 Soporte

Si una migración falla:
1. Revisar los logs en [`LogsServidor.md`](../LogsServidor.md)
2. Verificar que la migración es idempotente
3. Consultar el historial de git para ver cambios recientes
4. Restaurar desde backup si es necesario

---

**⚠️ IMPORTANTE:** Este directorio contiene la estructura **crítica** de la base de datos. Cualquier cambio debe ser revisado cuidadosamente antes de aplicarse en producción.
