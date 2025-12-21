2025-12-21T12:02:06.730Z psql:../database/migrations/026-create-produccion-tracking.sql:32: NOTICE:  relation "idx_operaciones_estado" already exists, skipping
2025-12-21T12:02:06.731Z psql:../database/migrations/026-create-produccion-tracking.sql:33: NOTICE:  relation "idx_operaciones_maquina" already exists, skipping
2025-12-21T12:02:06.731Z CREATE INDEX
2025-12-21T12:02:06.731Z CREATE INDEX
2025-12-21T12:02:06.731Z CREATE INDEX
2025-12-21T12:02:06.731Z psql:../database/migrations/026-create-produccion-tracking.sql:34: NOTICE:  relation "idx_operaciones_fecha_inicio" already exists, skipping
2025-12-21T12:02:06.732Z CREATE INDEX
2025-12-21T12:02:06.732Z psql:../database/migrations/026-create-produccion-tracking.sql:35: NOTICE:  relation "idx_operaciones_activas" already exists, skipping
2025-12-21T12:02:06.733Z COMMENT
2025-12-21T12:02:06.734Z psql:../database/migrations/026-create-produccion-tracking.sql:51: NOTICE:  relation "pausas_operacion" already exists, skipping
2025-12-21T12:02:06.734Z CREATE TABLE
2025-12-21T12:02:06.734Z psql:../database/migrations/026-create-produccion-tracking.sql:53: NOTICE:  relation "idx_pausas_operacion_id" already exists, skipping
2025-12-21T12:02:06.735Z CREATE INDEX
2025-12-21T12:02:06.735Z CREATE INDEX
2025-12-21T12:02:06.735Z psql:../database/migrations/026-create-produccion-tracking.sql:54: NOTICE:  relation "idx_pausas_fecha_inicio" already exists, skipping
2025-12-21T12:02:06.735Z psql:../database/migrations/026-create-produccion-tracking.sql:72: NOTICE:  relation "metraje_produccion" already exists, skipping
2025-12-21T12:02:06.735Z psql:../database/migrations/026-create-produccion-tracking.sql:74: NOTICE:  relation "idx_metraje_operacion_id" already exists, skipping
2025-12-21T12:02:06.735Z CREATE TABLE
2025-12-21T12:02:06.735Z CREATE INDEX
2025-12-21T12:02:06.736Z psql:../database/migrations/026-create-produccion-tracking.sql:75: NOTICE:  relation "idx_metraje_pedido_id" already exists, skipping
2025-12-21T12:02:06.736Z psql:../database/migrations/026-create-produccion-tracking.sql:76: NOTICE:  relation "idx_metraje_fecha" already exists, skipping
2025-12-21T12:02:06.736Z CREATE INDEX
2025-12-21T12:02:06.736Z CREATE INDEX
2025-12-21T12:02:06.736Z CREATE TABLE
2025-12-21T12:02:06.737Z psql:../database/migrations/026-create-produccion-tracking.sql:92: NOTICE:  relation "observaciones_produccion" already exists, skipping
2025-12-21T12:02:06.737Z psql:../database/migrations/026-create-produccion-tracking.sql:94: NOTICE:  relation "idx_observaciones_operacion_id" already exists, skipping
2025-12-21T12:02:06.737Z CREATE INDEX
2025-12-21T12:02:06.737Z psql:../database/migrations/026-create-produccion-tracking.sql:95: NOTICE:  relation "idx_observaciones_pedido_id" already exists, skipping
2025-12-21T12:02:06.737Z CREATE INDEX
2025-12-21T12:02:06.738Z CREATE INDEX
2025-12-21T12:02:06.738Z psql:../database/migrations/026-create-produccion-tracking.sql:96: NOTICE:  relation "idx_observaciones_fecha" already exists, skipping
2025-12-21T12:02:06.738Z psql:../database/migrations/026-create-produccion-tracking.sql:97: NOTICE:  relation "idx_observaciones_tipo" already exists, skipping
2025-12-21T12:02:06.738Z CREATE INDEX
2025-12-21T12:02:06.773Z psql:../database/migrations/026-create-produccion-tracking.sql:143: NOTICE:  ℹ️ Columna metros_restantes ya existe, se mantiene
2025-12-21T12:02:06.777Z psql:../database/migrations/026-create-produccion-tracking.sql:143: NOTICE:  ℹ️ Columna porcentaje_completado ya existe, se mantiene
2025-12-21T12:02:06.782Z DO
2025-12-21T12:02:06.782Z psql:../database/migrations/026-create-produccion-tracking.sql:145: NOTICE:  relation "idx_pedidos_operador_actual" already exists, skipping
2025-12-21T12:02:06.782Z CREATE INDEX
2025-12-21T12:02:06.783Z psql:../database/migrations/026-create-produccion-tracking.sql:146: NOTICE:  relation "idx_pedidos_operacion_curso" already exists, skipping
2025-12-21T12:02:06.783Z CREATE INDEX
2025-12-21T12:02:06.784Z psql:../database/migrations/026-create-produccion-tracking.sql:147: NOTICE:  relation "idx_pedidos_metros_producidos" already exists, skipping
2025-12-21T12:02:06.784Z CREATE INDEX
2025-12-21T12:02:06.786Z CREATE FUNCTION
2025-12-21T12:02:06.787Z DROP TRIGGER
2025-12-21T12:02:06.789Z CREATE TRIGGER
2025-12-21T12:02:06.790Z CREATE FUNCTION
2025-12-21T12:02:06.791Z DROP TRIGGER
2025-12-21T12:02:06.791Z CREATE TRIGGER
2025-12-21T12:02:06.802Z id | pedido_id | operador_id | operador_nombre | maquina | etapa | estado | fecha_inicio | fecha_fin | tiempo_total_segundos | tiempo_pausado_segundos | metros_producidos | metros_objetivo | observaciones | motivo_pausa | metadata | created_at | updated_at | numero_pedido_cliente | cliente | metros_totales_pedido | producto | colores | prioridad | fecha_entrega | observaciones_pedido | segundos_desde_inicio
2025-12-21T12:02:06.802Z ----+-----------+-------------+-----------------+---------+-------+--------+--------------+-----------+-----------------------+-------------------------+-------------------+-----------------+---------------+--------------+----------+------------+------------+-----------------------+---------+-----------------------+----------+---------+-----------+---------------+----------------------+-----------------------
2025-12-21T12:02:06.802Z (0 rows)
2025-12-21T12:02:06.806Z CREATE VIEW
2025-12-21T12:02:06.812Z CREATE VIEW
2025-12-21T12:02:06.818Z ✅ Migración 'Crear Sistema de Tracking de Producción' aplicada exitosamente.
2025-12-21T12:02:06.818Z 🔄 Aplicando migración: Crear Sistema de Gestión de Materiales...
2025-12-21T12:02:06.863Z psql:../database/migrations/027-create-materiales-table.sql:15: NOTICE:  relation "materiales" already exists, skipping
2025-12-21T12:02:06.863Z CREATE TABLE
2025-12-21T12:02:06.865Z COMMENT
2025-12-21T12:02:06.865Z COMMENT
2025-12-21T12:02:06.867Z COMMENT
2025-12-21T12:02:06.868Z COMMENT
2025-12-21T12:02:06.869Z COMMENT
2025-12-21T12:02:06.871Z psql:../database/migrations/027-create-materiales-table.sql:25: NOTICE:  relation "idx_materiales_numero" already exists, skipping
2025-12-21T12:02:06.871Z CREATE INDEX
2025-12-21T12:02:06.871Z CREATE INDEX
2025-12-21T12:02:06.871Z psql:../database/migrations/027-create-materiales-table.sql:28: NOTICE:  relation "idx_materiales_estados" already exists, skipping
2025-12-21T12:02:06.875Z CREATE FUNCTION
2025-12-21T12:02:06.877Z DROP TRIGGER
2025-12-21T12:02:06.878Z CREATE TRIGGER
2025-12-21T12:02:06.879Z psql:../database/migrations/027-create-materiales-table.sql:54: NOTICE:  relation "pedidos_materiales" already exists, skipping
2025-12-21T12:02:06.880Z CREATE TABLE
2025-12-21T12:02:06.881Z COMMENT
2025-12-21T12:02:06.882Z CREATE INDEX
2025-12-21T12:02:06.882Z psql:../database/migrations/027-create-materiales-table.sql:60: NOTICE:  relation "idx_pedidos_materiales_pedido" already exists, skipping
2025-12-21T12:02:06.883Z CREATE INDEX
2025-12-21T12:02:06.883Z psql:../database/migrations/027-create-materiales-table.sql:61: NOTICE:  relation "idx_pedidos_materiales_material" already exists, skipping
2025-12-21T12:02:06.940Z psql:../database/migrations/027-create-materiales-table.sql:111: NOTICE:  Migración de números de compra a materiales completada
2025-12-21T12:02:06.941Z DO
2025-12-21T12:02:06.943Z ✅ Migración 'Crear Sistema de Gestión de Materiales' aplicada exitosamente.
2025-12-21T12:02:06.943Z === SCRIPT DE MIGRACIÓN COMPLETADO ===
2025-12-21T12:02:06.943Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2025-12-21T12:02:07.121Z /app/backend/index.js:1066
2025-12-21T12:02:07.121Z ]
2025-12-21T12:02:07.121Z ^
2025-12-21T12:02:07.121Z SyntaxError: Unexpected token ']'
2025-12-21T12:02:07.121Z at internalCompileFunction (node:internal/vm:76:18)
2025-12-21T12:02:07.121Z at wrapSafe (node:internal/modules/cjs/loader:1283:20)
2025-12-21T12:02:07.121Z at Module._compile (node:internal/modules/cjs/loader:1328:27)
2025-12-21T12:02:07.121Z at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
2025-12-21T12:02:07.121Z at Module.load (node:internal/modules/cjs/loader:1203:32)
2025-12-21T12:02:07.122Z at Module._load (node:internal/modules/cjs/loader:1019:12)
2025-12-21T12:02:07.122Z at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12)
2025-12-21T12:02:07.122Z at node:internal/main/run_main_module:28:49
2025-12-21T12:02:07.122Z Node.js v18.20.8