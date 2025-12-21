2025-12-21T12:19:24.892Z CREATE INDEX
2025-12-21T12:19:24.894Z CREATE INDEX
2025-12-21T12:19:24.894Z psql:../database/migrations/026-create-produccion-tracking.sql:75: NOTICE:  relation "idx_metraje_pedido_id" already exists, skipping
2025-12-21T12:19:24.894Z CREATE INDEX
2025-12-21T12:19:24.894Z psql:../database/migrations/026-create-produccion-tracking.sql:76: NOTICE:  relation "idx_metraje_fecha" already exists, skipping
2025-12-21T12:19:24.895Z CREATE TABLE
2025-12-21T12:19:24.895Z psql:../database/migrations/026-create-produccion-tracking.sql:92: NOTICE:  relation "observaciones_produccion" already exists, skipping
2025-12-21T12:19:24.895Z CREATE INDEX
2025-12-21T12:19:24.895Z psql:../database/migrations/026-create-produccion-tracking.sql:94: NOTICE:  relation "idx_observaciones_operacion_id" already exists, skipping
2025-12-21T12:19:24.896Z psql:../database/migrations/026-create-produccion-tracking.sql:95: NOTICE:  relation "idx_observaciones_pedido_id" already exists, skipping
2025-12-21T12:19:24.896Z CREATE INDEX
2025-12-21T12:19:24.896Z psql:../database/migrations/026-create-produccion-tracking.sql:96: NOTICE:  relation "idx_observaciones_fecha" already exists, skipping
2025-12-21T12:19:24.896Z CREATE INDEX
2025-12-21T12:19:24.899Z psql:../database/migrations/026-create-produccion-tracking.sql:97: NOTICE:  relation "idx_observaciones_tipo" already exists, skipping
2025-12-21T12:19:24.899Z CREATE INDEX
2025-12-21T12:19:24.941Z psql:../database/migrations/026-create-produccion-tracking.sql:143: NOTICE:  ℹ️ Columna metros_restantes ya existe, se mantiene
2025-12-21T12:19:24.944Z psql:../database/migrations/026-create-produccion-tracking.sql:143: NOTICE:  ℹ️ Columna porcentaje_completado ya existe, se mantiene
2025-12-21T12:19:24.949Z DO
2025-12-21T12:19:24.950Z CREATE INDEX
2025-12-21T12:19:24.950Z psql:../database/migrations/026-create-produccion-tracking.sql:145: NOTICE:  relation "idx_pedidos_operador_actual" already exists, skipping
2025-12-21T12:19:24.950Z CREATE INDEX
2025-12-21T12:19:24.950Z psql:../database/migrations/026-create-produccion-tracking.sql:146: NOTICE:  relation "idx_pedidos_operacion_curso" already exists, skipping
2025-12-21T12:19:24.951Z psql:../database/migrations/026-create-produccion-tracking.sql:147: NOTICE:  relation "idx_pedidos_metros_producidos" already exists, skipping
2025-12-21T12:19:24.951Z CREATE INDEX
2025-12-21T12:19:24.953Z CREATE FUNCTION
2025-12-21T12:19:24.954Z DROP TRIGGER
2025-12-21T12:19:24.955Z CREATE TRIGGER
2025-12-21T12:19:24.956Z CREATE FUNCTION
2025-12-21T12:19:24.957Z DROP TRIGGER
2025-12-21T12:19:24.958Z CREATE TRIGGER
2025-12-21T12:19:24.962Z id | pedido_id | operador_id | operador_nombre | maquina | etapa | estado | fecha_inicio | fecha_fin | tiempo_total_segundos | tiempo_pausado_segundos | metros_producidos | metros_objetivo | observaciones | motivo_pausa | metadata | created_at | updated_at | numero_pedido_cliente | cliente | metros_totales_pedido | producto | colores | prioridad | fecha_entrega | observaciones_pedido | segundos_desde_inicio
2025-12-21T12:19:24.962Z ----+-----------+-------------+-----------------+---------+-------+--------+--------------+-----------+-----------------------+-------------------------+-------------------+-----------------+---------------+--------------+----------+------------+------------+-----------------------+---------+-----------------------+----------+---------+-----------+---------------+----------------------+-----------------------
2025-12-21T12:19:24.962Z (0 rows)
2025-12-21T12:19:24.965Z CREATE VIEW
2025-12-21T12:19:24.969Z CREATE VIEW
2025-12-21T12:19:24.972Z ✅ Migración 'Crear Sistema de Tracking de Producción' aplicada exitosamente.
2025-12-21T12:19:24.972Z 🔄 Aplicando migración: Crear Sistema de Gestión de Materiales...
2025-12-21T12:19:25.005Z psql:../database/migrations/027-create-materiales-table.sql:15: NOTICE:  relation "materiales" already exists, skipping
2025-12-21T12:19:25.005Z CREATE TABLE
2025-12-21T12:19:25.007Z COMMENT
2025-12-21T12:19:25.008Z COMMENT
2025-12-21T12:19:25.008Z COMMENT
2025-12-21T12:19:25.010Z COMMENT
2025-12-21T12:19:25.011Z COMMENT
2025-12-21T12:19:25.012Z psql:../database/migrations/027-create-materiales-table.sql:25: NOTICE:  relation "idx_materiales_numero" already exists, skipping
2025-12-21T12:19:25.012Z CREATE INDEX
2025-12-21T12:19:25.013Z psql:../database/migrations/027-create-materiales-table.sql:28: NOTICE:  relation "idx_materiales_estados" already exists, skipping
2025-12-21T12:19:25.013Z CREATE INDEX
2025-12-21T12:19:25.018Z CREATE FUNCTION
2025-12-21T12:19:25.023Z DROP TRIGGER
2025-12-21T12:19:25.024Z CREATE TRIGGER
2025-12-21T12:19:25.025Z psql:../database/migrations/027-create-materiales-table.sql:54: NOTICE:  relation "pedidos_materiales" already exists, skipping
2025-12-21T12:19:25.025Z CREATE TABLE
2025-12-21T12:19:25.027Z COMMENT
2025-12-21T12:19:25.028Z psql:../database/migrations/027-create-materiales-table.sql:60: NOTICE:  relation "idx_pedidos_materiales_pedido" already exists, skipping
2025-12-21T12:19:25.028Z CREATE INDEX
2025-12-21T12:19:25.029Z psql:../database/migrations/027-create-materiales-table.sql:61: NOTICE:  relation "idx_pedidos_materiales_material" already exists, skipping
2025-12-21T12:19:25.029Z CREATE INDEX
2025-12-21T12:19:25.093Z psql:../database/migrations/027-create-materiales-table.sql:111: NOTICE:  Migración de números de compra a materiales completada
2025-12-21T12:19:25.096Z DO
2025-12-21T12:19:25.097Z ✅ Migración 'Crear Sistema de Gestión de Materiales' aplicada exitosamente.
2025-12-21T12:19:25.097Z === SCRIPT DE MIGRACIÓN COMPLETADO ===
2025-12-21T12:19:25.097Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2025-12-21T12:19:25.227Z [dotenv@17.2.2] injecting env (5) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
2025-12-21T12:19:25.679Z 🔄 Intentando conectar a PostgreSQL...
2025-12-21T12:19:25.680Z 👂 Event listeners del pool configurados
2025-12-21T12:19:25.751Z 🔗 Nueva conexión al pool establecida
2025-12-21T12:19:25.751Z ✅ PostgreSQL conectado correctamente
2025-12-21T12:19:25.751Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2025-12-21T12:19:25.752Z - Database: desde DATABASE_URL
2025-12-21T12:19:25.752Z - Max connections: 50
2025-12-21T12:19:25.753Z 🔧 Iniciando creación/verificación de tablas...
2025-12-21T12:19:25.756Z ✅ Extensión uuid-ossp verificada
2025-12-21T12:19:25.757Z ✅ Tabla admin_users verificada
2025-12-21T12:19:25.773Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2025-12-21T12:19:25.780Z ✅ Constraint de rol actualizado
2025-12-21T12:19:25.780Z 🔄 Verificando usuarios existentes...
2025-12-21T12:19:25.783Z ✅ Todos los usuarios ya están actualizados
2025-12-21T12:19:25.783Z ✅ Columnas de admin_users verificadas
2025-12-21T12:19:25.790Z ✅ Tabla user_permissions verificada
2025-12-21T12:19:25.790Z ✅ Tabla pedidos verificada (creada por migración)
2025-12-21T12:19:25.791Z ✅ Tabla users verificada
2025-12-21T12:19:25.791Z ✅ Tabla audit_log verificada
2025-12-21T12:19:25.794Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2025-12-21T12:19:25.795Z ✅ Tabla pedido_comments creada
2025-12-21T12:19:25.796Z ✅ Tabla vendedores creada
2025-12-21T12:19:25.801Z ✅ Índices verificados
2025-12-21T12:19:25.806Z ✅ Triggers configurados
2025-12-21T12:19:25.815Z ✅ Columna vendedor_id verificada/creada
2025-12-21T12:19:25.815Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2025-12-21T12:19:25.816Z 🔄 Health checks periódicos iniciados (cada 10s)
2025-12-21T12:19:25.816Z 🐘 PostgreSQL conectado exitosamente
2025-12-21T12:19:25.816Z ✅ dbClient compartido con middlewares
2025-12-21T12:19:25.821Z 🚀 Servidor iniciado en puerto 8080
2025-12-21T12:19:25.821Z ✅ PostgreSQL conectado - Sistema operativo
2025-12-21T12:19:30.710Z 📨 [1] GET /api/health - User: anonymous - 2025-12-21T12:19:30.710Z