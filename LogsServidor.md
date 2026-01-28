2026-01-28T16:06:38.982Z GRANT
2026-01-28T16:06:39.003Z DO
2026-01-28T16:06:39.004Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:  ✅ Migración 008 completada exitosamente
2026-01-28T16:06:39.004Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Columna numeros_compra: CREADA
2026-01-28T16:06:39.004Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Columna numero_compra: ELIMINADA
2026-01-28T16:06:39.004Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Índices creados: 1
2026-01-28T16:06:39.011Z COMMIT
2026-01-28T16:06:39.016Z ✅ Migración 'Convertir Números de Compra a Array' aplicada.
2026-01-28T16:06:39.016Z 🔄 Aplicando migración: Agregar Información de Cliché...
2026-01-28T16:06:39.055Z psql:/app/database/migrations/009-add-cliche-info.sql:8: NOTICE:  column "cliche_info_adicional" of relation "pedidos" already exists, skipping
2026-01-28T16:06:39.056Z ALTER TABLE
2026-01-28T16:06:39.058Z COMMENT
2026-01-28T16:06:39.075Z psql:/app/database/migrations/009-add-cliche-info.sql:26: NOTICE:  Columna cliche_info_adicional añadida exitosamente a la tabla pedidos
2026-01-28T16:06:39.078Z DO
2026-01-28T16:06:39.078Z ✅ Migración 'Agregar Información de Cliché' aplicada.
2026-01-28T16:06:39.078Z 🔄 Aplicando migración: Auto-actualizar Estado de Cliente...
2026-01-28T16:06:39.109Z CREATE FUNCTION
2026-01-28T16:06:39.110Z COMMENT
2026-01-28T16:06:39.112Z CREATE FUNCTION
2026-01-28T16:06:39.113Z COMMENT
2026-01-28T16:06:39.114Z CREATE FUNCTION
2026-01-28T16:06:39.115Z COMMENT
2026-01-28T16:06:39.116Z DROP TRIGGER
2026-01-28T16:06:39.118Z CREATE TRIGGER
2026-01-28T16:06:39.119Z COMMENT
2026-01-28T16:06:39.126Z CREATE VIEW
2026-01-28T16:06:39.127Z COMMENT
2026-01-28T16:06:39.152Z DO
2026-01-28T16:06:39.152Z CREATE INDEX
2026-01-28T16:06:39.153Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:193: NOTICE:  Estados actualizados para 124 clientes
2026-01-28T16:06:39.153Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:201: NOTICE:  relation "idx_pedidos_cliente_etapa" already exists, skipping
2026-01-28T16:06:39.153Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:206: NOTICE:  relation "idx_pedidos_activos" already exists, skipping
2026-01-28T16:06:39.153Z CREATE INDEX
2026-01-28T16:06:39.154Z COMMENT
2026-01-28T16:06:39.155Z COMMENT
2026-01-28T16:06:39.156Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:230: NOTICE:  Test completado: Cliente a0d1e7fd-186c-4cfb-8087-9203d3828408 tiene estado calculado: Activo
2026-01-28T16:06:39.156Z DO
2026-01-28T16:06:39.159Z trigger_name           | event_manipulation | event_object_table |                   action_statement
2026-01-28T16:06:39.159Z ----------------------------------+--------------------+--------------------+------------------------------------------------------
2026-01-28T16:06:39.159Z trigger_pedido_actualiza_cliente | INSERT             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:06:39.159Z trigger_pedido_actualiza_cliente | DELETE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:06:39.159Z trigger_pedido_actualiza_cliente | UPDATE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:06:39.159Z (3 rows)
2026-01-28T16:06:39.159Z DO
2026-01-28T16:06:39.159Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:248: NOTICE:  ✅ Migración completada: Sistema de actualización automática de estado de clientes instalado correctamente.
2026-01-28T16:06:39.162Z ✅ Migración 'Auto-actualizar Estado de Cliente' aplicada.
2026-01-28T16:06:39.163Z 🔄 Aplicando migración: Agregar Campo Anónimo...
2026-01-28T16:06:39.191Z psql:/app/database/migrations/011-add-anonimo.sql:7: NOTICE:  column "anonimo" of relation "pedidos" already exists, skipping
2026-01-28T16:06:39.192Z ALTER TABLE
2026-01-28T16:06:39.193Z psql:/app/database/migrations/011-add-anonimo.sql:10: NOTICE:  relation "idx_pedidos_anonimo" already exists, skipping
2026-01-28T16:06:39.193Z CREATE INDEX
2026-01-28T16:06:39.194Z COMMENT
2026-01-28T16:06:39.198Z ✅ Migración 'Agregar Campo Anónimo' aplicada.
2026-01-28T16:06:39.198Z 🔄 Aplicando migración: Agregar Fechas de Cliché...
2026-01-28T16:06:39.243Z psql:/app/database/migrations/013-add-cliche-dates.sql:5: NOTICE:  column "dto_compra" of relation "pedidos" already exists, skipping
2026-01-28T16:06:39.244Z ALTER TABLE
2026-01-28T16:06:39.245Z psql:/app/database/migrations/013-add-cliche-dates.sql:8: NOTICE:  column "recepcion_cliche" of relation "pedidos" already exists, skipping
2026-01-28T16:06:39.246Z ALTER TABLE
2026-01-28T16:06:39.247Z psql:/app/database/migrations/013-add-cliche-dates.sql:11: NOTICE:  relation "idx_pedidos_dto_compra" already exists, skipping
2026-01-28T16:06:39.247Z CREATE INDEX
2026-01-28T16:06:39.248Z psql:/app/database/migrations/013-add-cliche-dates.sql:12: NOTICE:  relation "idx_pedidos_recepcion_cliche" already exists, skipping
2026-01-28T16:06:39.248Z CREATE INDEX
2026-01-28T16:06:39.250Z COMMENT
2026-01-28T16:06:39.252Z COMMENT
2026-01-28T16:06:39.253Z ✅ Migración 'Agregar Fechas de Cliché' aplicada.
2026-01-28T16:06:39.253Z 🔄 Aplicando migración: Crear Tabla de Vendedores...
2026-01-28T16:06:39.296Z psql:/app/database/migrations/014-create-vendedores-table.sql:13: NOTICE:  relation "vendedores" already exists, skipping
2026-01-28T16:06:39.296Z CREATE TABLE
2026-01-28T16:06:39.298Z CREATE INDEX
2026-01-28T16:06:39.298Z psql:/app/database/migrations/014-create-vendedores-table.sql:16: NOTICE:  relation "idx_vendedores_nombre" already exists, skipping
2026-01-28T16:06:39.299Z psql:/app/database/migrations/014-create-vendedores-table.sql:17: NOTICE:  relation "idx_vendedores_activo" already exists, skipping
2026-01-28T16:06:39.299Z CREATE INDEX
2026-01-28T16:06:39.300Z CREATE INDEX
2026-01-28T16:06:39.300Z psql:/app/database/migrations/014-create-vendedores-table.sql:18: NOTICE:  relation "idx_vendedores_email" already exists, skipping
2026-01-28T16:06:39.306Z CREATE FUNCTION
2026-01-28T16:06:39.308Z DROP TRIGGER
2026-01-28T16:06:39.310Z CREATE TRIGGER
2026-01-28T16:06:39.313Z INSERT 0 0
2026-01-28T16:06:39.314Z COMMENT
2026-01-28T16:06:39.315Z COMMENT
2026-01-28T16:06:39.316Z COMMENT
2026-01-28T16:06:39.318Z COMMENT
2026-01-28T16:06:39.319Z COMMENT
2026-01-28T16:06:39.320Z COMMENT
2026-01-28T16:06:39.321Z COMMENT
2026-01-28T16:06:39.322Z COMMENT
2026-01-28T16:06:39.327Z ✅ Migración 'Crear Tabla de Vendedores' aplicada.
2026-01-28T16:06:39.328Z 🔄 Aplicando migración: Agregar Vendedor FK a Pedidos...
2026-01-28T16:06:39.389Z DO
2026-01-28T16:06:39.390Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:26: ERROR:  column "vendedor" does not exist
2026-01-28T16:06:39.390Z LINE 2: SELECT DISTINCT TRIM(vendedor) as nombre, true
2026-01-28T16:06:39.390Z ^
2026-01-28T16:06:39.390Z HINT:  Perhaps you meant to reference the column "pedidos.vendedor_id".
2026-01-28T16:06:39.392Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.