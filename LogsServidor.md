2025-12-20T17:43:30.597Z psql:../database/migrations/026-create-produccion-tracking.sql:94: NOTICE:  relation "idx_observaciones_operacion_id" already exists, skipping
2025-12-20T17:43:30.598Z CREATE INDEX
2025-12-20T17:43:30.598Z psql:../database/migrations/026-create-produccion-tracking.sql:95: NOTICE:  relation "idx_observaciones_pedido_id" already exists, skipping
2025-12-20T17:43:30.598Z psql:../database/migrations/026-create-produccion-tracking.sql:96: NOTICE:  relation "idx_observaciones_fecha" already exists, skipping
2025-12-20T17:43:30.598Z CREATE INDEX
2025-12-20T17:43:30.599Z CREATE INDEX
2025-12-20T17:43:30.599Z psql:../database/migrations/026-create-produccion-tracking.sql:97: NOTICE:  relation "idx_observaciones_tipo" already exists, skipping
2025-12-20T17:43:30.629Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  🔄 Verificando columna metros_restantes...
2025-12-20T17:43:30.631Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  ⚠️ Error al eliminar metros_restantes: cannot drop column metros_restantes of table pedidos because other objects depend on it - Continuando...
2025-12-20T17:43:30.636Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  🔄 Verificando columna porcentaje_completado...
2025-12-20T17:43:30.637Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  ⚠️ Error al eliminar porcentaje_completado: cannot drop column porcentaje_completado of table pedidos because other objects depend on it - Continuando...
2025-12-20T17:43:30.648Z DO
2025-12-20T17:43:30.649Z CREATE INDEX
2025-12-20T17:43:30.649Z psql:../database/migrations/026-create-produccion-tracking.sql:156: NOTICE:  relation "idx_pedidos_operador_actual" already exists, skipping
2025-12-20T17:43:30.649Z psql:../database/migrations/026-create-produccion-tracking.sql:157: NOTICE:  relation "idx_pedidos_operacion_curso" already exists, skipping
2025-12-20T17:43:30.650Z CREATE INDEX
2025-12-20T17:43:30.651Z CREATE INDEX
2025-12-20T17:43:30.651Z psql:../database/migrations/026-create-produccion-tracking.sql:158: NOTICE:  relation "idx_pedidos_metros_producidos" already exists, skipping
2025-12-20T17:43:30.654Z CREATE FUNCTION
2025-12-20T17:43:30.656Z DROP TRIGGER
2025-12-20T17:43:30.658Z CREATE TRIGGER
2025-12-20T17:43:30.661Z CREATE FUNCTION
2025-12-20T17:43:30.662Z DROP TRIGGER
2025-12-20T17:43:30.664Z CREATE TRIGGER
2025-12-20T17:43:30.674Z CREATE VIEW
2025-12-20T17:43:30.678Z CREATE VIEW
2025-12-20T17:43:30.683Z CREATE VIEW
2025-12-20T17:43:30.688Z ✅ Migración 'Crear Sistema de Tracking de Producción' aplicada exitosamente.
2025-12-20T17:43:30.689Z 🔄 Aplicando migración: Crear Sistema de Gestión de Materiales...
2025-12-20T17:43:30.724Z psql:../database/migrations/027-create-materiales-table.sql:15: NOTICE:  relation "materiales" already exists, skipping
2025-12-20T17:43:30.724Z CREATE TABLE
2025-12-20T17:43:30.726Z COMMENT
2025-12-20T17:43:30.727Z COMMENT
2025-12-20T17:43:30.728Z COMMENT
2025-12-20T17:43:30.729Z COMMENT
2025-12-20T17:43:30.730Z COMMENT
2025-12-20T17:43:30.731Z psql:../database/migrations/027-create-materiales-table.sql:25: NOTICE:  relation "idx_materiales_numero" already exists, skipping
2025-12-20T17:43:30.731Z CREATE INDEX
2025-12-20T17:43:30.731Z psql:../database/migrations/027-create-materiales-table.sql:28: NOTICE:  relation "idx_materiales_estados" already exists, skipping
2025-12-20T17:43:30.731Z CREATE INDEX
2025-12-20T17:43:30.734Z CREATE FUNCTION
2025-12-20T17:43:30.735Z DROP TRIGGER
2025-12-20T17:43:30.736Z CREATE TRIGGER
2025-12-20T17:43:30.736Z psql:../database/migrations/027-create-materiales-table.sql:54: NOTICE:  relation "pedidos_materiales" already exists, skipping
2025-12-20T17:43:30.737Z CREATE TABLE
2025-12-20T17:43:30.738Z COMMENT
2025-12-20T17:43:30.738Z CREATE INDEX
2025-12-20T17:43:30.738Z psql:../database/migrations/027-create-materiales-table.sql:60: NOTICE:  relation "idx_pedidos_materiales_pedido" already exists, skipping
2025-12-20T17:43:30.738Z psql:../database/migrations/027-create-materiales-table.sql:61: NOTICE:  relation "idx_pedidos_materiales_material" already exists, skipping
2025-12-20T17:43:30.739Z CREATE INDEX
2025-12-20T17:43:30.748Z psql:../database/migrations/027-create-materiales-table.sql:111: NOTICE:  Migración de números de compra a materiales completada
2025-12-20T17:43:30.749Z DO
2025-12-20T17:43:30.751Z ✅ Migración 'Crear Sistema de Gestión de Materiales' aplicada exitosamente.
2025-12-20T17:43:30.751Z === SCRIPT DE MIGRACIÓN COMPLETADO ===
2025-12-20T17:43:30.752Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2025-12-20T17:43:30.853Z [dotenv@17.2.2] injecting env (5) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
2025-12-20T17:43:31.535Z 🔄 Intentando conectar a PostgreSQL...
2025-12-20T17:43:31.536Z 👂 Event listeners del pool configurados
2025-12-20T17:43:31.609Z 🔗 Nueva conexión al pool establecida
2025-12-20T17:43:31.610Z ✅ PostgreSQL conectado correctamente
2025-12-20T17:43:31.610Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2025-12-20T17:43:31.610Z - Database: desde DATABASE_URL
2025-12-20T17:43:31.610Z - Max connections: 50
2025-12-20T17:43:31.612Z 🔧 Iniciando creación/verificación de tablas...
2025-12-20T17:43:31.615Z ✅ Extensión uuid-ossp verificada
2025-12-20T17:43:31.616Z ✅ Tabla admin_users verificada
2025-12-20T17:43:31.631Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2025-12-20T17:43:31.637Z ✅ Constraint de rol actualizado
2025-12-20T17:43:31.637Z 🔄 Verificando usuarios existentes...
2025-12-20T17:43:31.640Z ✅ Todos los usuarios ya están actualizados
2025-12-20T17:43:31.640Z ✅ Columnas de admin_users verificadas
2025-12-20T17:43:31.651Z ✅ Tabla user_permissions verificada
2025-12-20T17:43:31.651Z ✅ Tabla pedidos verificada (creada por migración)
2025-12-20T17:43:31.652Z ✅ Tabla users verificada
2025-12-20T17:43:31.654Z ✅ Tabla audit_log verificada
2025-12-20T17:43:31.657Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2025-12-20T17:43:31.658Z ✅ Tabla pedido_comments creada
2025-12-20T17:43:31.659Z ✅ Tabla vendedores creada
2025-12-20T17:43:31.666Z ✅ Índices verificados
2025-12-20T17:43:31.673Z ✅ Triggers configurados
2025-12-20T17:43:31.680Z ✅ Columna vendedor_id verificada/creada
2025-12-20T17:43:31.680Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2025-12-20T17:43:31.681Z 🔄 Health checks periódicos iniciados (cada 10s)
2025-12-20T17:43:31.681Z 🐘 PostgreSQL conectado exitosamente
2025-12-20T17:43:31.681Z ✅ dbClient compartido con middlewares
2025-12-20T17:43:31.690Z 🚀 Servidor iniciado en puerto 8080
2025-12-20T17:43:31.690Z ✅ PostgreSQL conectado - Sistema operativo
2025-12-20T17:43:41.695Z 🔄 Cliente removido del pool de conexiones
2025-12-20T17:43:41.718Z 🔗 Nueva conexión al pool establecida
2025-12-20T17:44:26.589Z 📨 [1] GET /api/pedidos - User: 4 - 2025-12-20T17:44:26.588Z
2025-12-20T17:44:26.638Z 📊 [2025-12-20T17:44:26.638Z] GET /api/pedidos (LEGACY) - Total: 213 pedidos
2025-12-20T17:44:26.715Z 📨 [3] GET /api/audit - User: 4 - 2025-12-20T17:44:26.715Z
2025-12-20T17:44:26.768Z 🔗 Nueva conexión al pool establecida
2025-12-20T17:44:27.031Z 📨 [4] GET /api/materiales - User: 4 - 2025-12-20T17:44:27.030Z
2025-12-20T17:44:27.040Z ✅ Materiales obtenidos: 4
2025-12-20T17:44:27.041Z ✅ Materiales obtenidos: 4
2025-12-20T17:44:36.745Z 🔄 Cliente removido del pool de conexiones