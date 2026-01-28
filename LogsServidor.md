2026-01-28T16:13:28.679Z COMMENT
2026-01-28T16:13:28.682Z CREATE FUNCTION
2026-01-28T16:13:28.684Z COMMENT
2026-01-28T16:13:28.686Z DROP TRIGGER
2026-01-28T16:13:28.689Z CREATE TRIGGER
2026-01-28T16:13:28.690Z COMMENT
2026-01-28T16:13:28.695Z CREATE VIEW
2026-01-28T16:13:28.697Z COMMENT
2026-01-28T16:13:28.713Z DO
2026-01-28T16:13:28.713Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:193: NOTICE:  Estados actualizados para 124 clientes
2026-01-28T16:13:28.714Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:201: NOTICE:  relation "idx_pedidos_cliente_etapa" already exists, skipping
2026-01-28T16:13:28.714Z CREATE INDEX
2026-01-28T16:13:28.715Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:206: NOTICE:  relation "idx_pedidos_activos" already exists, skipping
2026-01-28T16:13:28.716Z CREATE INDEX
2026-01-28T16:13:28.716Z COMMENT
2026-01-28T16:13:28.717Z COMMENT
2026-01-28T16:13:28.719Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:230: NOTICE:  Test completado: Cliente a0d1e7fd-186c-4cfb-8087-9203d3828408 tiene estado calculado: Activo
2026-01-28T16:13:28.719Z DO
2026-01-28T16:13:28.723Z trigger_name           | event_manipulation | event_object_table |                   action_statement
2026-01-28T16:13:28.723Z ----------------------------------+--------------------+--------------------+------------------------------------------------------
2026-01-28T16:13:28.723Z trigger_pedido_actualiza_cliente | INSERT             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:13:28.723Z trigger_pedido_actualiza_cliente | DELETE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:13:28.723Z trigger_pedido_actualiza_cliente | UPDATE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:13:28.723Z (3 rows)
2026-01-28T16:13:28.725Z DO
2026-01-28T16:13:28.725Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:248: NOTICE:  ✅ Migración completada: Sistema de actualización automática de estado de clientes instalado correctamente.
2026-01-28T16:13:28.730Z ✅ Migración 'Auto-actualizar Estado de Cliente' aplicada.
2026-01-28T16:13:28.731Z 🔄 Aplicando migración: Agregar Campo Anónimo...
2026-01-28T16:13:28.776Z psql:/app/database/migrations/011-add-anonimo.sql:7: NOTICE:  column "anonimo" of relation "pedidos" already exists, skipping
2026-01-28T16:13:28.777Z ALTER TABLE
2026-01-28T16:13:28.778Z CREATE INDEX
2026-01-28T16:13:28.778Z psql:/app/database/migrations/011-add-anonimo.sql:10: NOTICE:  relation "idx_pedidos_anonimo" already exists, skipping
2026-01-28T16:13:28.781Z COMMENT
2026-01-28T16:13:28.783Z ✅ Migración 'Agregar Campo Anónimo' aplicada.
2026-01-28T16:13:28.784Z 🔄 Aplicando migración: Agregar Fechas de Cliché...
2026-01-28T16:13:28.816Z psql:/app/database/migrations/013-add-cliche-dates.sql:5: NOTICE:  column "dto_compra" of relation "pedidos" already exists, skipping
2026-01-28T16:13:28.817Z ALTER TABLE
2026-01-28T16:13:28.817Z psql:/app/database/migrations/013-add-cliche-dates.sql:8: NOTICE:  column "recepcion_cliche" of relation "pedidos" already exists, skipping
2026-01-28T16:13:28.818Z ALTER TABLE
2026-01-28T16:13:28.819Z psql:/app/database/migrations/013-add-cliche-dates.sql:11: NOTICE:  relation "idx_pedidos_dto_compra" already exists, skipping
2026-01-28T16:13:28.819Z CREATE INDEX
2026-01-28T16:13:28.819Z CREATE INDEX
2026-01-28T16:13:28.819Z psql:/app/database/migrations/013-add-cliche-dates.sql:12: NOTICE:  relation "idx_pedidos_recepcion_cliche" already exists, skipping
2026-01-28T16:13:28.821Z COMMENT
2026-01-28T16:13:28.823Z COMMENT
2026-01-28T16:13:28.826Z ✅ Migración 'Agregar Fechas de Cliché' aplicada.
2026-01-28T16:13:28.826Z 🔄 Aplicando migración: Crear Tabla de Vendedores...
2026-01-28T16:13:28.872Z psql:/app/database/migrations/014-create-vendedores-table.sql:13: NOTICE:  relation "vendedores" already exists, skipping
2026-01-28T16:13:28.873Z CREATE TABLE
2026-01-28T16:13:28.874Z psql:/app/database/migrations/014-create-vendedores-table.sql:16: NOTICE:  relation "idx_vendedores_nombre" already exists, skipping
2026-01-28T16:13:28.875Z CREATE INDEX
2026-01-28T16:13:28.875Z CREATE INDEX
2026-01-28T16:13:28.876Z psql:/app/database/migrations/014-create-vendedores-table.sql:17: NOTICE:  relation "idx_vendedores_activo" already exists, skipping
2026-01-28T16:13:28.877Z psql:/app/database/migrations/014-create-vendedores-table.sql:18: NOTICE:  relation "idx_vendedores_email" already exists, skipping
2026-01-28T16:13:28.878Z CREATE INDEX
2026-01-28T16:13:28.882Z CREATE FUNCTION
2026-01-28T16:13:28.884Z DROP TRIGGER
2026-01-28T16:13:28.887Z CREATE TRIGGER
2026-01-28T16:13:28.892Z INSERT 0 0
2026-01-28T16:13:28.893Z COMMENT
2026-01-28T16:13:28.895Z COMMENT
2026-01-28T16:13:28.896Z COMMENT
2026-01-28T16:13:28.897Z COMMENT
2026-01-28T16:13:28.899Z COMMENT
2026-01-28T16:13:28.900Z COMMENT
2026-01-28T16:13:28.901Z COMMENT
2026-01-28T16:13:28.902Z COMMENT
2026-01-28T16:13:28.904Z ✅ Migración 'Crear Tabla de Vendedores' aplicada.
2026-01-28T16:13:28.905Z 🔄 Aplicando migración: Agregar Vendedor FK a Pedidos...
2026-01-28T16:13:28.975Z DO
2026-01-28T16:13:28.982Z DO
2026-01-28T16:13:28.995Z DO
2026-01-28T16:13:29.006Z DO
2026-01-28T16:13:29.012Z DO
2026-01-28T16:13:29.013Z CREATE INDEX
2026-01-28T16:13:29.014Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:87: NOTICE:  relation "idx_pedidos_vendedor_id" already exists, skipping
2026-01-28T16:13:29.019Z DO
2026-01-28T16:13:29.020Z COMMENT
2026-01-28T16:13:29.028Z DO
2026-01-28T16:13:29.030Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:118: NOTICE:  Migración completada:
2026-01-28T16:13:29.030Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:118: NOTICE:  - Total pedidos: 751
2026-01-28T16:13:29.030Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:118: NOTICE:  - Pedidos con vendedor asignado: 751
2026-01-28T16:13:29.030Z psql:/app/database/migrations/015-add-vendedor-fk-to-pedidos.sql:118: NOTICE:  - Total vendedores: 13
2026-01-28T16:13:29.034Z ✅ Migración 'Agregar Vendedor FK a Pedidos' aplicada.
2026-01-28T16:13:29.035Z 🔄 Aplicando migración: Agregar Observaciones de Material...
2026-01-28T16:13:29.087Z psql:/app/database/migrations/016-add-observaciones-material.sql:5: NOTICE:  column "observaciones_material" of relation "pedidos" already exists, skipping
2026-01-28T16:13:29.088Z ALTER TABLE
2026-01-28T16:13:29.093Z COMMENT
2026-01-28T16:13:29.096Z ✅ Migración 'Agregar Observaciones de Material' aplicada.
2026-01-28T16:13:29.096Z 🔄 Aplicando migración: Renombrar DTO de Compra...
2026-01-28T16:13:29.177Z psql:/app/database/migrations/017-rename-dto-compra.sql:36: ERROR:  column "compra_cliche" of relation "pedidos" already exists
2026-01-28T16:13:29.177Z CONTEXT:  SQL statement "ALTER TABLE pedidos RENAME COLUMN dto_compra TO compra_cliche"
2026-01-28T16:13:29.177Z PL/pgSQL function inline_code_block line 9 at SQL statement
2026-01-28T16:13:29.181Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.