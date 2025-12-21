2025-12-21T12:05:01.020Z CREATE TABLE
2025-12-21T12:05:01.021Z CREATE INDEX
2025-12-21T12:05:01.021Z psql:../database/migrations/026-create-produccion-tracking.sql:94: NOTICE:  relation "idx_observaciones_operacion_id" already exists, skipping
2025-12-21T12:05:01.021Z psql:../database/migrations/026-create-produccion-tracking.sql:95: NOTICE:  relation "idx_observaciones_pedido_id" already exists, skipping
2025-12-21T12:05:01.021Z psql:../database/migrations/026-create-produccion-tracking.sql:96: NOTICE:  relation "idx_observaciones_fecha" already exists, skipping
2025-12-21T12:05:01.021Z CREATE INDEX
2025-12-21T12:05:01.021Z CREATE INDEX
2025-12-21T12:05:01.022Z psql:../database/migrations/026-create-produccion-tracking.sql:97: NOTICE:  relation "idx_observaciones_tipo" already exists, skipping
2025-12-21T12:05:01.022Z CREATE INDEX
2025-12-21T12:05:01.066Z psql:../database/migrations/026-create-produccion-tracking.sql:143: NOTICE:  ℹ️ Columna metros_restantes ya existe, se mantiene
2025-12-21T12:05:01.070Z psql:../database/migrations/026-create-produccion-tracking.sql:143: NOTICE:  ℹ️ Columna porcentaje_completado ya existe, se mantiene
2025-12-21T12:05:01.075Z DO
2025-12-21T12:05:01.077Z CREATE INDEX
2025-12-21T12:05:01.077Z CREATE INDEX
2025-12-21T12:05:01.077Z psql:../database/migrations/026-create-produccion-tracking.sql:145: NOTICE:  relation "idx_pedidos_operador_actual" already exists, skipping
2025-12-21T12:05:01.077Z psql:../database/migrations/026-create-produccion-tracking.sql:146: NOTICE:  relation "idx_pedidos_operacion_curso" already exists, skipping
2025-12-21T12:05:01.078Z CREATE INDEX
2025-12-21T12:05:01.078Z psql:../database/migrations/026-create-produccion-tracking.sql:147: NOTICE:  relation "idx_pedidos_metros_producidos" already exists, skipping
2025-12-21T12:05:01.080Z CREATE FUNCTION
2025-12-21T12:05:01.082Z DROP TRIGGER
2025-12-21T12:05:01.088Z CREATE TRIGGER
2025-12-21T12:05:01.090Z CREATE FUNCTION
2025-12-21T12:05:01.090Z DROP TRIGGER
2025-12-21T12:05:01.092Z CREATE TRIGGER
2025-12-21T12:05:01.098Z id | pedido_id | operador_id | operador_nombre | maquina | etapa | estado | fecha_inicio | fecha_fin | tiempo_total_segundos | tiempo_pausado_segundos | metros_producidos | metros_objetivo | observaciones | motivo_pausa | metadata | created_at | updated_at | numero_pedido_cliente | cliente | metros_totales_pedido | producto | colores | prioridad | fecha_entrega | observaciones_pedido | segundos_desde_inicio
2025-12-21T12:05:01.098Z ----+-----------+-------------+-----------------+---------+-------+--------+--------------+-----------+-----------------------+-------------------------+-------------------+-----------------+---------------+--------------+----------+------------+------------+-----------------------+---------+-----------------------+----------+---------+-----------+---------------+----------------------+-----------------------
2025-12-21T12:05:01.098Z (0 rows)
2025-12-21T12:05:01.102Z CREATE VIEW
2025-12-21T12:05:01.107Z CREATE VIEW
2025-12-21T12:05:01.108Z ✅ Migración 'Crear Sistema de Tracking de Producción' aplicada exitosamente.
2025-12-21T12:05:01.108Z 🔄 Aplicando migración: Crear Sistema de Gestión de Materiales...
2025-12-21T12:05:01.136Z psql:../database/migrations/027-create-materiales-table.sql:15: NOTICE:  relation "materiales" already exists, skipping
2025-12-21T12:05:01.137Z CREATE TABLE
2025-12-21T12:05:01.138Z COMMENT
2025-12-21T12:05:01.139Z COMMENT
2025-12-21T12:05:01.140Z COMMENT
2025-12-21T12:05:01.141Z COMMENT
2025-12-21T12:05:01.142Z COMMENT
2025-12-21T12:05:01.143Z psql:../database/migrations/027-create-materiales-table.sql:25: NOTICE:  relation "idx_materiales_numero" already exists, skipping
2025-12-21T12:05:01.143Z CREATE INDEX
2025-12-21T12:05:01.143Z CREATE INDEX
2025-12-21T12:05:01.143Z psql:../database/migrations/027-create-materiales-table.sql:28: NOTICE:  relation "idx_materiales_estados" already exists, skipping
2025-12-21T12:05:01.148Z CREATE FUNCTION
2025-12-21T12:05:01.150Z DROP TRIGGER
2025-12-21T12:05:01.152Z CREATE TRIGGER
2025-12-21T12:05:01.152Z psql:../database/migrations/027-create-materiales-table.sql:54: NOTICE:  relation "pedidos_materiales" already exists, skipping
2025-12-21T12:05:01.152Z CREATE TABLE
2025-12-21T12:05:01.153Z COMMENT
2025-12-21T12:05:01.154Z CREATE INDEX
2025-12-21T12:05:01.154Z psql:../database/migrations/027-create-materiales-table.sql:60: NOTICE:  relation "idx_pedidos_materiales_pedido" already exists, skipping
2025-12-21T12:05:01.154Z psql:../database/migrations/027-create-materiales-table.sql:61: NOTICE:  relation "idx_pedidos_materiales_material" already exists, skipping
2025-12-21T12:05:01.154Z CREATE INDEX
2025-12-21T12:05:01.213Z psql:../database/migrations/027-create-materiales-table.sql:111: NOTICE:  Migración de números de compra a materiales completada
2025-12-21T12:05:01.215Z DO
2025-12-21T12:05:01.219Z ✅ Migración 'Crear Sistema de Gestión de Materiales' aplicada exitosamente.
2025-12-21T12:05:01.219Z === SCRIPT DE MIGRACIÓN COMPLETADO ===
2025-12-21T12:05:01.219Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2025-12-21T12:05:01.372Z [dotenv@17.2.2] injecting env (5) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
2025-12-21T12:05:01.920Z 🔄 Intentando conectar a PostgreSQL...
2025-12-21T12:05:01.921Z 👂 Event listeners del pool configurados
2025-12-21T12:05:01.997Z 🔗 Nueva conexión al pool establecida
2025-12-21T12:05:01.998Z ✅ PostgreSQL conectado correctamente
2025-12-21T12:05:01.998Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2025-12-21T12:05:01.999Z - Database: desde DATABASE_URL
2025-12-21T12:05:01.999Z - Max connections: 50
2025-12-21T12:05:02.000Z 🔧 Iniciando creación/verificación de tablas...
2025-12-21T12:05:02.004Z ✅ Extensión uuid-ossp verificada
2025-12-21T12:05:02.005Z ✅ Tabla admin_users verificada
2025-12-21T12:05:02.023Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2025-12-21T12:05:02.031Z ✅ Constraint de rol actualizado
2025-12-21T12:05:02.032Z 🔄 Verificando usuarios existentes...
2025-12-21T12:05:02.035Z ✅ Todos los usuarios ya están actualizados
2025-12-21T12:05:02.035Z ✅ Columnas de admin_users verificadas
2025-12-21T12:05:02.041Z ✅ Tabla user_permissions verificada
2025-12-21T12:05:02.041Z ✅ Tabla pedidos verificada (creada por migración)
2025-12-21T12:05:02.042Z ✅ Tabla users verificada
2025-12-21T12:05:02.043Z ✅ Tabla audit_log verificada
2025-12-21T12:05:02.046Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2025-12-21T12:05:02.047Z ✅ Tabla pedido_comments creada
2025-12-21T12:05:02.048Z ✅ Tabla vendedores creada
2025-12-21T12:05:02.051Z ✅ Índices verificados
2025-12-21T12:05:02.057Z ✅ Triggers configurados
2025-12-21T12:05:02.064Z ✅ Columna vendedor_id verificada/creada
2025-12-21T12:05:02.066Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2025-12-21T12:05:02.067Z 🔄 Health checks periódicos iniciados (cada 10s)
2025-12-21T12:05:02.067Z 🐘 PostgreSQL conectado exitosamente
2025-12-21T12:05:02.067Z ✅ dbClient compartido con middlewares
2025-12-21T12:05:02.073Z 🚀 Servidor iniciado en puerto 8080
2025-12-21T12:05:02.073Z ✅ PostgreSQL conectado - Sistema operativo
2025-12-21T12:05:12.075Z 🔄 Cliente removido del pool de conexiones
2025-12-21T12:05:12.090Z 🔗 Nueva conexión al pool establecida
2025-12-21T12:09:18.109Z 📨 [1] GET /api/pedidos - User: 4 - 2025-12-21T12:09:18.108Z
2025-12-21T12:09:18.138Z 📊 [2025-12-21T12:09:18.138Z] GET /api/pedidos (LEGACY) - Total: 213 pedidos
2025-12-21T12:09:18.165Z 📨 [2] GET /api/audit - User: 4 - 2025-12-21T12:09:18.164Z
2025-12-21T12:09:18.622Z 📨 [4] GET /api/materiales - User: 4 - 2025-12-21T12:09:18.621Z
2025-12-21T12:09:18.640Z ✅ Materiales obtenidos: 175