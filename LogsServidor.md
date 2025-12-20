2025-12-20T17:58:56.569Z psql:../database/migrations/023-add-performance-indexes.sql:19: NOTICE:  relation "idx_pedidos_etapa_fecha" already exists, skipping
2025-12-20T17:58:56.569Z CREATE INDEX
2025-12-20T17:58:56.571Z psql:../database/migrations/023-add-performance-indexes.sql:23: NOTICE:  relation "idx_pedidos_secuencia" already exists, skipping
2025-12-20T17:58:56.571Z CREATE INDEX
2025-12-20T17:58:56.572Z psql:../database/migrations/023-add-performance-indexes.sql:27: NOTICE:  relation "idx_pedidos_numeros_compra_gin" already exists, skipping
2025-12-20T17:58:56.572Z CREATE INDEX
2025-12-20T17:58:56.574Z psql:../database/migrations/023-add-performance-indexes.sql:31: NOTICE:  relation "idx_pedidos_cliente_id" already exists, skipping
2025-12-20T17:58:56.574Z CREATE INDEX
2025-12-20T17:58:56.575Z psql:../database/migrations/023-add-performance-indexes.sql:35: NOTICE:  relation "idx_pedidos_vendedor_id" already exists, skipping
2025-12-20T17:58:56.575Z CREATE INDEX
2025-12-20T17:58:56.576Z psql:../database/migrations/023-add-performance-indexes.sql:39: NOTICE:  relation "idx_pedidos_fecha_entrega" already exists, skipping
2025-12-20T17:58:56.576Z CREATE INDEX
2025-12-20T17:58:56.578Z psql:../database/migrations/023-add-performance-indexes.sql:44: NOTICE:  ✅ Índices de rendimiento creados exitosamente.
2025-12-20T17:58:56.579Z DO
2025-12-20T17:58:56.583Z ✅ Migración 'Agregar Índices de Rendimiento' aplicada exitosamente.
2025-12-20T17:58:56.583Z 🔄 Aplicando migración: Agregar Campo Tiempo Producción Decimal...
2025-12-20T17:58:56.630Z psql:../database/migrations/024-add-tiempo-produccion-decimal.sql:7: NOTICE:  column "tiempo_produccion_decimal" of relation "pedidos" already exists, skipping
2025-12-20T17:58:56.632Z ALTER TABLE
2025-12-20T17:58:56.633Z COMMENT
2025-12-20T17:58:56.634Z psql:../database/migrations/024-add-tiempo-produccion-decimal.sql:15: NOTICE:  relation "idx_pedidos_tiempo_produccion_decimal" already exists, skipping
2025-12-20T17:58:56.634Z CREATE INDEX
2025-12-20T17:58:56.637Z ✅ Migración 'Agregar Campo Tiempo Producción Decimal' aplicada exitosamente.
2025-12-20T17:58:56.637Z 🔄 Aplicando migración: Crear Tabla de Notificaciones...
2025-12-20T17:58:56.675Z psql:../database/migrations/025-create-notifications-table.sql:17: NOTICE:  relation "notifications" already exists, skipping
2025-12-20T17:58:56.677Z psql:../database/migrations/025-create-notifications-table.sql:20: NOTICE:  relation "idx_notifications_user_id" already exists, skipping
2025-12-20T17:58:56.677Z CREATE TABLE
2025-12-20T17:58:56.677Z CREATE INDEX
2025-12-20T17:58:56.677Z psql:../database/migrations/025-create-notifications-table.sql:21: NOTICE:  relation "idx_notifications_timestamp" already exists, skipping
2025-12-20T17:58:56.677Z CREATE INDEX
2025-12-20T17:58:56.678Z psql:../database/migrations/025-create-notifications-table.sql:22: NOTICE:  relation "idx_notifications_read" already exists, skipping
2025-12-20T17:58:56.678Z CREATE INDEX
2025-12-20T17:58:56.679Z psql:../database/migrations/025-create-notifications-table.sql:23: NOTICE:  relation "idx_notifications_pedido_id" already exists, skipping
2025-12-20T17:58:56.679Z psql:../database/migrations/025-create-notifications-table.sql:24: NOTICE:  relation "idx_notifications_user_timestamp" already exists, skipping
2025-12-20T17:58:56.679Z CREATE INDEX
2025-12-20T17:58:56.679Z CREATE INDEX
2025-12-20T17:58:56.681Z COMMENT
2025-12-20T17:58:56.682Z COMMENT
2025-12-20T17:58:56.684Z COMMENT
2025-12-20T17:58:56.684Z COMMENT
2025-12-20T17:58:56.685Z COMMENT
2025-12-20T17:58:56.686Z COMMENT
2025-12-20T17:58:56.687Z COMMENT
2025-12-20T17:58:56.689Z COMMENT
2025-12-20T17:58:56.690Z COMMENT
2025-12-20T17:58:56.691Z COMMENT
2025-12-20T17:58:56.692Z COMMENT
2025-12-20T17:58:56.697Z ✅ Migración 'Crear Tabla de Notificaciones' aplicada exitosamente.
2025-12-20T17:58:56.697Z 🔄 Aplicando migración: Crear Sistema de Tracking de Producción...
2025-12-20T17:58:56.746Z psql:../database/migrations/026-create-produccion-tracking.sql:28: NOTICE:  relation "operaciones_produccion" already exists, skipping
2025-12-20T17:58:56.746Z CREATE TABLE
2025-12-20T17:58:56.748Z psql:../database/migrations/026-create-produccion-tracking.sql:30: NOTICE:  relation "idx_operaciones_pedido_id" already exists, skipping
2025-12-20T17:58:56.749Z CREATE INDEX
2025-12-20T17:58:56.749Z psql:../database/migrations/026-create-produccion-tracking.sql:31: NOTICE:  relation "idx_operaciones_operador_id" already exists, skipping
2025-12-20T17:58:56.749Z CREATE INDEX
2025-12-20T17:58:56.749Z psql:../database/migrations/026-create-produccion-tracking.sql:32: NOTICE:  relation "idx_operaciones_estado" already exists, skipping
2025-12-20T17:58:56.749Z CREATE INDEX
2025-12-20T17:58:56.750Z psql:../database/migrations/026-create-produccion-tracking.sql:33: NOTICE:  relation "idx_operaciones_maquina" already exists, skipping
2025-12-20T17:58:56.750Z CREATE INDEX
2025-12-20T17:58:56.751Z psql:../database/migrations/026-create-produccion-tracking.sql:34: NOTICE:  relation "idx_operaciones_fecha_inicio" already exists, skipping
2025-12-20T17:58:56.751Z CREATE INDEX
2025-12-20T17:58:56.753Z psql:../database/migrations/026-create-produccion-tracking.sql:35: NOTICE:  relation "idx_operaciones_activas" already exists, skipping
2025-12-20T17:58:56.753Z CREATE INDEX
2025-12-20T17:58:56.755Z COMMENT
2025-12-20T17:58:56.755Z psql:../database/migrations/026-create-produccion-tracking.sql:51: NOTICE:  relation "pausas_operacion" already exists, skipping
2025-12-20T17:58:56.755Z CREATE TABLE
2025-12-20T17:58:56.756Z psql:../database/migrations/026-create-produccion-tracking.sql:53: NOTICE:  relation "idx_pausas_operacion_id" already exists, skipping
2025-12-20T17:58:56.756Z CREATE INDEX
2025-12-20T17:58:56.757Z CREATE INDEX
2025-12-20T17:58:56.757Z psql:../database/migrations/026-create-produccion-tracking.sql:54: NOTICE:  relation "idx_pausas_fecha_inicio" already exists, skipping
2025-12-20T17:58:56.759Z psql:../database/migrations/026-create-produccion-tracking.sql:72: NOTICE:  relation "metraje_produccion" already exists, skipping
2025-12-20T17:58:56.759Z psql:../database/migrations/026-create-produccion-tracking.sql:74: NOTICE:  relation "idx_metraje_operacion_id" already exists, skipping
2025-12-20T17:58:56.759Z CREATE TABLE
2025-12-20T17:58:56.759Z CREATE INDEX
2025-12-20T17:58:56.760Z psql:../database/migrations/026-create-produccion-tracking.sql:75: NOTICE:  relation "idx_metraje_pedido_id" already exists, skipping
2025-12-20T17:58:56.760Z CREATE INDEX
2025-12-20T17:58:56.760Z psql:../database/migrations/026-create-produccion-tracking.sql:76: NOTICE:  relation "idx_metraje_fecha" already exists, skipping
2025-12-20T17:58:56.761Z CREATE INDEX
2025-12-20T17:58:56.761Z CREATE TABLE
2025-12-20T17:58:56.761Z psql:../database/migrations/026-create-produccion-tracking.sql:92: NOTICE:  relation "observaciones_produccion" already exists, skipping
2025-12-20T17:58:56.762Z psql:../database/migrations/026-create-produccion-tracking.sql:94: NOTICE:  relation "idx_observaciones_operacion_id" already exists, skipping
2025-12-20T17:58:56.762Z CREATE INDEX
2025-12-20T17:58:56.762Z CREATE INDEX
2025-12-20T17:58:56.762Z psql:../database/migrations/026-create-produccion-tracking.sql:95: NOTICE:  relation "idx_observaciones_pedido_id" already exists, skipping
2025-12-20T17:58:56.762Z psql:../database/migrations/026-create-produccion-tracking.sql:96: NOTICE:  relation "idx_observaciones_fecha" already exists, skipping
2025-12-20T17:58:56.763Z psql:../database/migrations/026-create-produccion-tracking.sql:97: NOTICE:  relation "idx_observaciones_tipo" already exists, skipping
2025-12-20T17:58:56.763Z CREATE INDEX
2025-12-20T17:58:56.763Z CREATE INDEX
2025-12-20T17:58:56.763Z psql:../database/migrations/026-create-produccion-tracking.sql:104: NOTICE:  view "v_pedidos_disponibles_produccion" does not exist, skipping
2025-12-20T17:58:56.764Z DROP VIEW
2025-12-20T17:58:56.795Z psql:../database/migrations/026-create-produccion-tracking.sql:159: NOTICE:  🔄 Verificando columna metros_restantes...
2025-12-20T17:58:56.799Z psql:../database/migrations/026-create-produccion-tracking.sql:159: NOTICE:  ✓ Columna metros_restantes eliminada (si existía)
2025-12-20T17:58:56.802Z psql:../database/migrations/026-create-produccion-tracking.sql:159: ERROR:  tables can have at most 1600 columns
2025-12-20T17:58:56.802Z CONTEXT:  SQL statement "ALTER TABLE pedidos ADD COLUMN metros_restantes NUMERIC(10, 2) DEFAULT 0"
2025-12-20T17:58:56.802Z PL/pgSQL function inline_code_block line 30 at SQL statement
2025-12-20T17:58:56.805Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.