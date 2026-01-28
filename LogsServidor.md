2026-01-28T16:03:43.423Z psql:/app/database/migrations/003-add-razon-social.sql:24: NOTICE:  relation "idx_clientes_razon_social" already exists, skipping
2026-01-28T16:03:43.423Z CREATE INDEX
2026-01-28T16:03:43.424Z COMMENT
2026-01-28T16:03:43.426Z psql:/app/database/migrations/003-add-razon-social.sql:36: NOTICE:  Permisos actualizados para pigmea_user
2026-01-28T16:03:43.430Z DO
2026-01-28T16:03:43.430Z ✅ Migración 'Agregar Razón Social' aplicada.
2026-01-28T16:03:43.430Z 🔄 Aplicando migración: Agregar Nueva Fecha de Entrega...
2026-01-28T16:03:43.477Z psql:/app/database/migrations/006-add-nueva-fecha-entrega.sql:6: NOTICE:  column "nueva_fecha_entrega" of relation "pedidos" already exists, skipping
2026-01-28T16:03:43.477Z ALTER TABLE
2026-01-28T16:03:43.478Z psql:/app/database/migrations/006-add-nueva-fecha-entrega.sql:9: NOTICE:  relation "idx_pedidos_nueva_fecha_entrega" already exists, skipping
2026-01-28T16:03:43.478Z CREATE INDEX
2026-01-28T16:03:43.480Z COMMENT
2026-01-28T16:03:43.484Z ✅ Migración 'Agregar Nueva Fecha de Entrega' aplicada.
2026-01-28T16:03:43.484Z 🔄 Aplicando migración: Agregar Número de Compra...
2026-01-28T16:03:43.519Z BEGIN
2026-01-28T16:03:43.526Z DO
2026-01-28T16:03:43.537Z psql:/app/database/migrations/007-add-numero-compra.sql:55: NOTICE:  Columna numero_compra agregada exitosamente a la tabla pedidos
2026-01-28T16:03:43.537Z DO
2026-01-28T16:03:43.550Z psql:/app/database/migrations/007-add-numero-compra.sql:73: NOTICE:  Índice idx_pedidos_numero_compra creado exitosamente
2026-01-28T16:03:43.550Z DO
2026-01-28T16:03:43.552Z psql:/app/database/migrations/007-add-numero-compra.sql:98: NOTICE:  extension "pg_trgm" already exists, skipping
2026-01-28T16:03:43.555Z psql:/app/database/migrations/007-add-numero-compra.sql:98: NOTICE:  Índice de búsqueda de texto idx_pedidos_numero_compra_text creado exitosamente
2026-01-28T16:03:43.555Z DO
2026-01-28T16:03:43.562Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:  ✅ Migración completada exitosamente:
2026-01-28T16:03:43.563Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:     - Campo numero_compra agregado
2026-01-28T16:03:43.563Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:     - Índice para búsquedas creado
2026-01-28T16:03:43.563Z psql:/app/database/migrations/007-add-numero-compra.sql:129: NOTICE:     - Listo para implementación en backend y frontend
2026-01-28T16:03:43.563Z DO
2026-01-28T16:03:43.564Z COMMIT
2026-01-28T16:03:43.566Z ✅ Migración 'Agregar Número de Compra' aplicada.
2026-01-28T16:03:43.566Z 🔄 Aplicando migración: Convertir Números de Compra a Array...
2026-01-28T16:03:43.600Z BEGIN
2026-01-28T16:03:43.602Z CREATE TABLE AS
2026-01-28T16:03:43.602Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:19: NOTICE:  relation "pedidos_backup_numeros_compra" already exists, skipping
2026-01-28T16:03:43.603Z ALTER TABLE
2026-01-28T16:03:43.603Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:26: NOTICE:  column "numeros_compra" of relation "pedidos" already exists, skipping
2026-01-28T16:03:43.609Z UPDATE 0
2026-01-28T16:03:43.672Z UPDATE 751
2026-01-28T16:03:43.673Z DROP INDEX
2026-01-28T16:03:43.674Z DROP INDEX
2026-01-28T16:03:43.674Z ALTER TABLE
2026-01-28T16:03:43.675Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:57: NOTICE:  relation "idx_pedidos_numeros_compra_gin" already exists, skipping
2026-01-28T16:03:43.675Z CREATE INDEX
2026-01-28T16:03:43.675Z COMMENT
2026-01-28T16:03:43.676Z CREATE FUNCTION
2026-01-28T16:03:43.677Z DO
2026-01-28T16:03:43.677Z DO
2026-01-28T16:03:43.677Z GRANT
2026-01-28T16:03:43.692Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:  ✅ Migración 008 completada exitosamente
2026-01-28T16:03:43.692Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Columna numeros_compra: CREADA
2026-01-28T16:03:43.692Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Columna numero_compra: ELIMINADA
2026-01-28T16:03:43.692Z psql:/app/database/migrations/008-convert-numero-compra-to-array.sql:159: NOTICE:     - Índices creados: 1
2026-01-28T16:03:43.693Z DO
2026-01-28T16:03:43.696Z COMMIT
2026-01-28T16:03:43.698Z ✅ Migración 'Convertir Números de Compra a Array' aplicada.
2026-01-28T16:03:43.699Z 🔄 Aplicando migración: Agregar Información de Cliché...
2026-01-28T16:03:43.732Z psql:/app/database/migrations/009-add-cliche-info.sql:8: NOTICE:  column "cliche_info_adicional" of relation "pedidos" already exists, skipping
2026-01-28T16:03:43.734Z ALTER TABLE
2026-01-28T16:03:43.736Z COMMENT
2026-01-28T16:03:43.756Z psql:/app/database/migrations/009-add-cliche-info.sql:26: NOTICE:  Columna cliche_info_adicional añadida exitosamente a la tabla pedidos
2026-01-28T16:03:43.756Z DO
2026-01-28T16:03:43.760Z ✅ Migración 'Agregar Información de Cliché' aplicada.
2026-01-28T16:03:43.760Z 🔄 Aplicando migración: Auto-actualizar Estado de Cliente...
2026-01-28T16:03:43.803Z CREATE FUNCTION
2026-01-28T16:03:43.804Z COMMENT
2026-01-28T16:03:43.805Z CREATE FUNCTION
2026-01-28T16:03:43.805Z COMMENT
2026-01-28T16:03:43.807Z CREATE FUNCTION
2026-01-28T16:03:43.808Z COMMENT
2026-01-28T16:03:43.811Z DROP TRIGGER
2026-01-28T16:03:43.811Z CREATE TRIGGER
2026-01-28T16:03:43.812Z COMMENT
2026-01-28T16:03:43.818Z CREATE VIEW
2026-01-28T16:03:43.819Z COMMENT
2026-01-28T16:03:43.840Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:193: NOTICE:  Estados actualizados para 124 clientes
2026-01-28T16:03:43.840Z DO
2026-01-28T16:03:43.840Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:201: NOTICE:  relation "idx_pedidos_cliente_etapa" already exists, skipping
2026-01-28T16:03:43.841Z CREATE INDEX
2026-01-28T16:03:43.841Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:206: NOTICE:  relation "idx_pedidos_activos" already exists, skipping
2026-01-28T16:03:43.841Z CREATE INDEX
2026-01-28T16:03:43.842Z COMMENT
2026-01-28T16:03:43.842Z COMMENT
2026-01-28T16:03:43.843Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:230: NOTICE:  Test completado: Cliente a0d1e7fd-186c-4cfb-8087-9203d3828408 tiene estado calculado: Activo
2026-01-28T16:03:43.843Z DO
2026-01-28T16:03:43.845Z trigger_name           | event_manipulation | event_object_table |                   action_statement
2026-01-28T16:03:43.846Z ----------------------------------+--------------------+--------------------+------------------------------------------------------
2026-01-28T16:03:43.846Z trigger_pedido_actualiza_cliente | INSERT             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:03:43.846Z trigger_pedido_actualiza_cliente | DELETE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:03:43.846Z trigger_pedido_actualiza_cliente | UPDATE             | pedidos            | EXECUTE FUNCTION trigger_actualizar_estado_cliente()
2026-01-28T16:03:43.846Z (3 rows)
2026-01-28T16:03:43.846Z psql:/app/database/migrations/010-auto-update-cliente-estado.sql:245: ERROR:  syntax error at or near "RAISE"
2026-01-28T16:03:43.846Z LINE 1: RAISE NOTICE '✅ Migración completada: Sistema de actualizac...
2026-01-28T16:03:43.846Z ^
2026-01-28T16:03:43.847Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.