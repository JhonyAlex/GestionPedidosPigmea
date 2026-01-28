2026-01-28T16:00:32.930Z psql:/app/database/migrations/002-fix-clientes-structure.sql:172: NOTICE:  relation "idx_clientes_provincia" already exists, skipping
2026-01-28T16:00:32.930Z CREATE INDEX
2026-01-28T16:00:32.930Z psql:/app/database/migrations/002-fix-clientes-structure.sql:173: NOTICE:  relation "idx_clientes_fecha_baja" already exists, skipping
2026-01-28T16:00:32.931Z CREATE INDEX
2026-01-28T16:00:32.931Z COMMENT
2026-01-28T16:00:32.932Z COMMENT
2026-01-28T16:00:32.933Z COMMENT
2026-01-28T16:00:32.934Z COMMENT
2026-01-28T16:00:32.934Z COMMENT
2026-01-28T16:00:32.935Z COMMENT
2026-01-28T16:00:32.936Z COMMENT
2026-01-28T16:00:32.937Z COMMENT
2026-01-28T16:00:32.938Z COMMENT
2026-01-28T16:00:32.939Z psql:/app/database/migrations/002-fix-clientes-structure.sql:199: NOTICE:  Permisos actualizados para pigmea_user
2026-01-28T16:00:32.942Z DO
2026-01-28T16:00:32.943Z ✅ Migración 'Fix Clientes Structure' aplicada.
2026-01-28T16:00:32.943Z 🔄 Aplicando migración: Agregar Razón Social...
2026-01-28T16:00:33.005Z psql:/app/database/migrations/003-add-razon-social.sql:21: NOTICE:  Columna razon_social ya existe
2026-01-28T16:00:33.005Z psql:/app/database/migrations/003-add-razon-social.sql:24: NOTICE:  relation "idx_clientes_razon_social" already exists, skipping
2026-01-28T16:00:33.005Z DO
2026-01-28T16:00:33.006Z CREATE INDEX
2026-01-28T16:00:33.007Z COMMENT
2026-01-28T16:00:33.009Z psql:/app/database/migrations/003-add-razon-social.sql:36: NOTICE:  Permisos actualizados para pigmea_user
2026-01-28T16:00:33.009Z DO
2026-01-28T16:00:33.012Z ✅ Migración 'Agregar Razón Social' aplicada.
2026-01-28T16:00:33.012Z 🔄 Aplicando migración: Agregar Nueva Fecha de Entrega...
2026-01-28T16:00:33.052Z psql:/app/database/migrations/006-add-nueva-fecha-entrega.sql:6: NOTICE:  column "nueva_fecha_entrega" of relation "pedidos" already exists, skipping
2026-01-28T16:00:33.052Z ALTER TABLE
2026-01-28T16:00:33.054Z CREATE INDEX
2026-01-28T16:00:33.054Z psql:/app/database/migrations/006-add-nueva-fecha-entrega.sql:9: NOTICE:  relation "idx_pedidos_nueva_fecha_entrega" already exists, skipping
2026-01-28T16:00:33.054Z COMMENT
2026-01-28T16:00:33.058Z ✅ Migración 'Agregar Nueva Fecha de Entrega' aplicada.
2026-01-28T16:00:33.060Z 🔄 Aplicando migración: Agregar Número de Compra...
2026-01-28T16:00:33.090Z BEGIN
2026-01-28T16:00:33.098Z DO
2026-01-28T16:00:33.106Z DO
2026-01-28T16:00:33.106Z psql:/app/database/migrations/007-add-numero-compra.sql:55: NOTICE:  Columna numero_compra agregada exitosamente a la tabla pedidos
2026-01-28T16:00:33.115Z DO
2026-01-28T16:00:33.115Z psql:/app/database/migrations/007-add-numero-compra.sql:73: NOTICE:  Índice idx_pedidos_numero_compra creado exitosamente
2026-01-28T16:00:33.117Z psql:/app/database/migrations/007-add-numero-compra.sql:98: NOTICE:  extension "pg_trgm" already exists, skipping
2026-01-28T16:00:33.121Z DO
2026-01-28T16:00:33.121Z psql:/app/database/migrations/007-add-numero-compra.sql:98: NOTICE:  Índice de búsqueda de texto idx_pedidos_numero_compra_text creado exitosamente
2026-01-28T16:00:33.129Z DO
2026-01-28T16:00:33.129Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:  ✅ Migración completada exitosamente:
2026-01-28T16:00:33.129Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:     - Campo numero_compra agregado
2026-01-28T16:00:33.129Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:     - Índice para búsquedas creado
2026-01-28T16:00:33.129Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:     - Listo para implementación en backend y frontend
2026-01-28T16:00:33.130Z COMMIT
2026-01-28T16:00:33.132Z ✅ Migración 'Agregar Número de Compra' aplicada.
2026-01-28T16:00:33.132Z 🔄 Aplicando migración: Convertir Números de Compra a Array...
2026-01-28T16:00:33.164Z BEGIN
2026-01-28T16:00:33.165Z CREATE TABLE AS
2026-01-28T16:00:33.165Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:19: NOTICE:  relation "pedidos_backup_numeros_compra" already exists, skipping
2026-01-28T16:00:33.167Z ALTER TABLE
2026-01-28T16:00:33.167Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:26: NOTICE:  column "numeros_compra" of relation "pedidos" already exists, skipping
2026-01-28T16:00:33.171Z UPDATE 0
2026-01-28T16:00:33.238Z UPDATE 751
2026-01-28T16:00:33.239Z DROP INDEX
2026-01-28T16:00:33.240Z DROP INDEX
2026-01-28T16:00:33.241Z ALTER TABLE
2026-01-28T16:00:33.241Z CREATE INDEX
2026-01-28T16:00:33.241Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:57: NOTICE:  relation "idx_pedidos_numeros_compra_gin" already exists, skipping
2026-01-28T16:00:33.242Z COMMENT
2026-01-28T16:00:33.243Z CREATE FUNCTION
2026-01-28T16:00:33.244Z DO
2026-01-28T16:00:33.245Z DO
2026-01-28T16:00:33.245Z GRANT
2026-01-28T16:00:33.261Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:  ✅ Migración 008 completada exitosamente
2026-01-28T16:00:33.261Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Columna numeros_compra: CREADA
2026-01-28T16:00:33.261Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Columna numero_compra: ELIMINADA
2026-01-28T16:00:33.261Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Índices creados: 1
2026-01-28T16:00:33.262Z DO
2026-01-28T16:00:33.264Z COMMIT
2026-01-28T16:00:33.266Z ✅ Migración 'Convertir Números de Compra a Array' aplicada.
2026-01-28T16:00:33.266Z 🔄 Aplicando migración: Agregar Información de Cliché...
2026-01-28T16:00:33.296Z psql:/app/database/migrations/009-add-cliche-info.sql:8: NOTICE:  column "cliche_info_adicional" of relation "pedidos" already exists, skipping
2026-01-28T16:00:33.297Z ALTER TABLE
2026-01-28T16:00:33.298Z COMMENT
2026-01-28T16:00:33.314Z psql:/app/database/migrations/009-add-cliche-info.sql:26: NOTICE:  Columna cliche_info_adicional añadida exitosamente a la tabla pedidos
2026-01-28T16:00:33.314Z DO
2026-01-28T16:00:33.317Z ✅ Migración 'Agregar Información de Cliché' aplicada.
2026-01-28T16:00:33.318Z 🔄 Aplicando migración: Auto-actualizar Estado de Cliente...
2026-01-28T16:00:33.373Z CREATE FUNCTION
2026-01-28T16:00:33.375Z COMMENT
2026-01-28T16:00:33.376Z CREATE FUNCTION
2026-01-28T16:00:33.377Z COMMENT
2026-01-28T16:00:33.379Z CREATE FUNCTION
2026-01-28T16:00:33.380Z COMMENT
2026-01-28T16:00:33.382Z DROP TRIGGER
2026-01-28T16:00:33.383Z CREATE TRIGGER
2026-01-28T16:00:33.384Z COMMENT
2026-01-28T16:00:33.387Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:172: ERROR:  column p.fecha_creacion does not exist
2026-01-28T16:00:33.387Z LINE 16:     MAX(p.fecha_creacion) as ultimo_pedido_fecha
2026-01-28T16:00:33.387Z ^
2026-01-28T16:00:33.389Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.