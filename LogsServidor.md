2026-01-28T16:09:20.831Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Columna numero_compra: ELIMINADA
2026-01-28T16:09:20.831Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Índices creados: 1
2026-01-28T16:09:20.831Z DO
2026-01-28T16:09:20.834Z COMMIT
2026-01-28T16:09:20.838Z ✅ Migración 'Convertir Números de Compra a Array' aplicada.
2026-01-28T16:09:20.839Z 🔄 Aplicando migración: Agregar Información de Cliché...
2026-01-28T16:09:20.881Z psql:/app/database/migrations/009-add-cliche-info.sql:8: NOTICE:  column "cliche_info_adicional" of relation "pedidos" already exists, skipping
2026-01-28T16:09:20.882Z ALTER TABLE
2026-01-28T16:09:20.883Z COMMENT
2026-01-28T16:09:20.899Z psql:/app/database/migrations/009-add-cliche-info.sql:26: NOTICE:  Columna cliche_info_adicional añadida exitosamente a la tabla pedidos
2026-01-28T16:09:20.899Z DO
2026-01-28T16:09:20.899Z ✅ Migración 'Agregar Información de Cliché' aplicada.
2026-01-28T16:09:20.899Z 🔄 Aplicando migración: Auto-actualizar Estado de Cliente...
2026-01-28T16:09:20.947Z CREATE FUNCTION
2026-01-28T16:09:20.949Z COMMENT
2026-01-28T16:09:20.950Z CREATE FUNCTION
2026-01-28T16:09:20.951Z COMMENT
2026-01-28T16:09:20.953Z CREATE FUNCTION
2026-01-28T16:09:20.955Z COMMENT
2026-01-28T16:09:20.957Z DROP TRIGGER
2026-01-28T16:09:20.958Z CREATE TRIGGER
2026-01-28T16:09:20.959Z COMMENT
2026-01-28T16:09:20.964Z CREATE VIEW
2026-01-28T16:09:20.966Z COMMENT
2026-01-28T16:09:20.996Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:193: NOTICE:  Estados actualizados para 124 clientes
2026-01-28T16:09:20.996Z DO
2026-01-28T16:09:20.997Z CREATE INDEX
2026-01-28T16:09:20.997Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:201: NOTICE:  relation "idx_pedidos_cliente_etapa" already exists, skipping
2026-01-28T16:09:20.998Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:206: NOTICE:  relation "idx_pedidos_activos" already exists, skipping
2026-01-28T16:09:20.998Z CREATE INDEX
2026-01-28T16:09:20.999Z COMMENT
2026-01-28T16:09:21.000Z COMMENT
2026-01-28T16:09:21.001Z DO
2026-01-28T16:09:21.001Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:230: NOTICE:  Test completado: Cliente a0d1e7fd-186c-4cfb-8087-9203d3828408 tiene estado calculado: Activo
2026-01-28T16:09:21.007Z trigger_name           | event_manipulation | event_object_table |                   action_statement
2026-01-28T16:09:21.007Z ----------------------------------+--------------------+--------------------+------------------------------------------------------
2026-01-28T16:09:21.007Z trigger_pedido_actualiza_cliente | INSERT             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:09:21.007Z trigger_pedido_actualiza_cliente | DELETE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:09:21.007Z trigger_pedido_actualiza_cliente | UPDATE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:09:21.007Z (3 rows)
2026-01-28T16:09:21.008Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:248: NOTICE:  ✅ Migración completada: Sistema de actualización automática de estado de clientes instalado correctamente.
2026-01-28T16:09:21.008Z DO
2026-01-28T16:09:21.013Z ✅ Migración 'Auto-actualizar Estado de Cliente' aplicada.
2026-01-28T16:09:21.014Z 🔄 Aplicando migración: Agregar Campo Anónimo...
2026-01-28T16:09:21.074Z psql:/app/database/migrations/011-add-anonimo.sql:7: NOTICE:  column "anonimo" of relation "pedidos" already exists, skipping
2026-01-28T16:09:21.075Z ALTER TABLE
2026-01-28T16:09:21.076Z psql:/app/database/migrations/011-add-anonimo.sql:10: NOTICE:  relation "idx_pedidos_anonimo" already exists, skipping
2026-01-28T16:09:21.076Z CREATE INDEX
2026-01-28T16:09:21.078Z COMMENT
2026-01-28T16:09:21.086Z ✅ Migración 'Agregar Campo Anónimo' aplicada.
2026-01-28T16:09:21.087Z 🔄 Aplicando migración: Agregar Fechas de Cliché...
2026-01-28T16:09:21.119Z psql:/app/database/migrations/013-add-cliche-dates.sql:5: NOTICE:  column "dto_compra" of relation "pedidos" already exists, skipping
2026-01-28T16:09:21.120Z ALTER TABLE
2026-01-28T16:09:21.120Z psql:/app/database/migrations/013-add-cliche-dates.sql:8: NOTICE:  column "recepcion_cliche" of relation "pedidos" already exists, skipping
2026-01-28T16:09:21.121Z ALTER TABLE
2026-01-28T16:09:21.121Z psql:/app/database/migrations/013-add-cliche-dates.sql:11: NOTICE:  relation "idx_pedidos_dto_compra" already exists, skipping
2026-01-28T16:09:21.122Z CREATE INDEX
2026-01-28T16:09:21.122Z psql:/app/database/migrations/013-add-cliche-dates.sql:12: NOTICE:  relation "idx_pedidos_recepcion_cliche" already exists, skipping
2026-01-28T16:09:21.122Z CREATE INDEX
2026-01-28T16:09:21.123Z COMMENT
2026-01-28T16:09:21.126Z COMMENT
2026-01-28T16:09:21.128Z ✅ Migración 'Agregar Fechas de Cliché' aplicada.
2026-01-28T16:09:21.128Z 🔄 Aplicando migración: Crear Tabla de Vendedores...
2026-01-28T16:09:21.153Z psql:/app/database/migrations/014-create-vendedores-table.sql:13: NOTICE:  relation "vendedores" already exists, skipping
2026-01-28T16:09:21.153Z CREATE TABLE
2026-01-28T16:09:21.154Z psql:/app/database/migrations/014-create-vendedores-table.sql:16: NOTICE:  relation "idx_vendedores_nombre" already exists, skipping
2026-01-28T16:09:21.154Z CREATE INDEX
2026-01-28T16:09:21.155Z psql:/app/database/migrations/014-create-vendedores-table.sql:17: NOTICE:  relation "idx_vendedores_activo" already exists, skipping
2026-01-28T16:09:21.155Z CREATE INDEX
2026-01-28T16:09:21.155Z psql:/app/database/migrations/014-create-vendedores-table.sql:18: NOTICE:  relation "idx_vendedores_email" already exists, skipping
2026-01-28T16:09:21.156Z CREATE INDEX
2026-01-28T16:09:21.159Z CREATE FUNCTION
2026-01-28T16:09:21.166Z DROP TRIGGER
2026-01-28T16:09:21.168Z CREATE TRIGGER
2026-01-28T16:09:21.175Z INSERT 0 0
2026-01-28T16:09:21.176Z COMMENT
2026-01-28T16:09:21.178Z COMMENT
2026-01-28T16:09:21.180Z COMMENT
2026-01-28T16:09:21.183Z COMMENT
2026-01-28T16:09:21.184Z COMMENT
2026-01-28T16:09:21.186Z COMMENT
2026-01-28T16:09:21.188Z COMMENT
2026-01-28T16:09:21.190Z COMMENT
2026-01-28T16:09:21.192Z ✅ Migración 'Crear Tabla de Vendedores' aplicada.
2026-01-28T16:09:21.192Z 🔄 Aplicando migración: Agregar Vendedor FK a Pedidos...
2026-01-28T16:09:21.243Z DO
2026-01-28T16:09:21.247Z DO
2026-01-28T16:09:21.253Z DO
2026-01-28T16:09:21.262Z DO
2026-01-28T16:09:21.265Z DO
2026-01-28T16:09:21.265Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:87: NOTICE:  relation "idx_pedidos_vendedor_id" already exists, skipping
2026-01-28T16:09:21.265Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:91: ERROR:  column "vendedor" of relation "pedidos" does not exist
2026-01-28T16:09:21.265Z CREATE INDEX
2026-01-28T16:09:21.268Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.