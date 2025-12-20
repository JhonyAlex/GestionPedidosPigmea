2025-12-20T17:50:20.722Z psql:../database/migrations/026-create-produccion-tracking.sql:92: NOTICE:  relation "observaciones_produccion" already exists, skipping
2025-12-20T17:50:20.722Z CREATE TABLE
2025-12-20T17:50:20.723Z CREATE INDEX
2025-12-20T17:50:20.723Z psql:../database/migrations/026-create-produccion-tracking.sql:94: NOTICE:  relation "idx_observaciones_operacion_id" already exists, skipping
2025-12-20T17:50:20.723Z psql:../database/migrations/026-create-produccion-tracking.sql:95: NOTICE:  relation "idx_observaciones_pedido_id" already exists, skipping
2025-12-20T17:50:20.723Z CREATE INDEX
2025-12-20T17:50:20.724Z psql:../database/migrations/026-create-produccion-tracking.sql:96: NOTICE:  relation "idx_observaciones_fecha" already exists, skipping
2025-12-20T17:50:20.724Z CREATE INDEX
2025-12-20T17:50:20.725Z psql:../database/migrations/026-create-produccion-tracking.sql:97: NOTICE:  relation "idx_observaciones_tipo" already exists, skipping
2025-12-20T17:50:20.725Z CREATE INDEX
2025-12-20T17:50:20.758Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  🔄 Verificando columna metros_restantes...
2025-12-20T17:50:20.758Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  ⚠️ Error al eliminar metros_restantes: cannot drop column metros_restantes of table pedidos because other objects depend on it - Continuando...
2025-12-20T17:50:20.761Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  🔄 Verificando columna porcentaje_completado...
2025-12-20T17:50:20.762Z psql:../database/migrations/026-create-produccion-tracking.sql:154: NOTICE:  ⚠️ Error al eliminar porcentaje_completado: cannot drop column porcentaje_completado of table pedidos because other objects depend on it - Continuando...
2025-12-20T17:50:20.778Z DO
2025-12-20T17:50:20.779Z psql:../database/migrations/026-create-produccion-tracking.sql:156: NOTICE:  relation "idx_pedidos_operador_actual" already exists, skipping
2025-12-20T17:50:20.779Z CREATE INDEX
2025-12-20T17:50:20.779Z psql:../database/migrations/026-create-produccion-tracking.sql:157: NOTICE:  relation "idx_pedidos_operacion_curso" already exists, skipping
2025-12-20T17:50:20.779Z CREATE INDEX
2025-12-20T17:50:20.780Z CREATE INDEX
2025-12-20T17:50:20.781Z psql:../database/migrations/026-create-produccion-tracking.sql:158: NOTICE:  relation "idx_pedidos_metros_producidos" already exists, skipping
2025-12-20T17:50:20.781Z CREATE FUNCTION
2025-12-20T17:50:20.783Z DROP TRIGGER
2025-12-20T17:50:20.784Z CREATE TRIGGER
2025-12-20T17:50:20.786Z CREATE FUNCTION
2025-12-20T17:50:20.786Z DROP TRIGGER
2025-12-20T17:50:20.787Z CREATE TRIGGER
2025-12-20T17:50:20.792Z CREATE VIEW
2025-12-20T17:50:20.795Z CREATE VIEW
2025-12-20T17:50:20.799Z CREATE VIEW
2025-12-20T17:50:20.802Z ✅ Migración 'Crear Sistema de Tracking de Producción' aplicada exitosamente.
2025-12-20T17:50:20.803Z 🔄 Aplicando migración: Crear Sistema de Gestión de Materiales...
2025-12-20T17:50:20.842Z CREATE TABLE
2025-12-20T17:50:20.842Z psql:../database/migrations/027-create-materiales-table.sql:15: NOTICE:  relation "materiales" already exists, skipping
2025-12-20T17:50:20.845Z COMMENT
2025-12-20T17:50:20.846Z COMMENT
2025-12-20T17:50:20.847Z COMMENT
2025-12-20T17:50:20.847Z COMMENT
2025-12-20T17:50:20.849Z COMMENT
2025-12-20T17:50:20.849Z psql:../database/migrations/027-create-materiales-table.sql:25: NOTICE:  relation "idx_materiales_numero" already exists, skipping
2025-12-20T17:50:20.850Z CREATE INDEX
2025-12-20T17:50:20.850Z psql:../database/migrations/027-create-materiales-table.sql:28: NOTICE:  relation "idx_materiales_estados" already exists, skipping
2025-12-20T17:50:20.850Z CREATE INDEX
2025-12-20T17:50:20.853Z CREATE FUNCTION
2025-12-20T17:50:20.854Z DROP TRIGGER
2025-12-20T17:50:20.856Z CREATE TRIGGER
2025-12-20T17:50:20.856Z CREATE TABLE
2025-12-20T17:50:20.856Z psql:../database/migrations/027-create-materiales-table.sql:54: NOTICE:  relation "pedidos_materiales" already exists, skipping
2025-12-20T17:50:20.857Z COMMENT
2025-12-20T17:50:20.857Z psql:../database/migrations/027-create-materiales-table.sql:60: NOTICE:  relation "idx_pedidos_materiales_pedido" already exists, skipping
2025-12-20T17:50:20.858Z CREATE INDEX
2025-12-20T17:50:20.858Z CREATE INDEX
2025-12-20T17:50:20.858Z psql:../database/migrations/027-create-materiales-table.sql:61: NOTICE:  relation "idx_pedidos_materiales_material" already exists, skipping
2025-12-20T17:50:20.870Z psql:../database/migrations/027-create-materiales-table.sql:111: NOTICE:  Migración de números de compra a materiales completada
2025-12-20T17:50:20.870Z DO
2025-12-20T17:50:20.872Z ✅ Migración 'Crear Sistema de Gestión de Materiales' aplicada exitosamente.
2025-12-20T17:50:20.874Z === SCRIPT DE MIGRACIÓN COMPLETADO ===
2025-12-20T17:50:20.874Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2025-12-20T17:50:20.987Z [dotenv@17.2.2] injecting env (5) from .env -- tip: ⚙️  override existing env vars with { override: true }
2025-12-20T17:50:21.674Z 🔄 Intentando conectar a PostgreSQL...
2025-12-20T17:50:21.675Z 👂 Event listeners del pool configurados
2025-12-20T17:50:21.753Z 🔗 Nueva conexión al pool establecida
2025-12-20T17:50:21.754Z ✅ PostgreSQL conectado correctamente
2025-12-20T17:50:21.755Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2025-12-20T17:50:21.756Z - Database: desde DATABASE_URL
2025-12-20T17:50:21.758Z - Max connections: 50
2025-12-20T17:50:21.760Z 🔧 Iniciando creación/verificación de tablas...
2025-12-20T17:50:21.765Z ✅ Extensión uuid-ossp verificada
2025-12-20T17:50:21.768Z ✅ Tabla admin_users verificada
2025-12-20T17:50:21.796Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2025-12-20T17:50:21.804Z ✅ Constraint de rol actualizado
2025-12-20T17:50:21.805Z 🔄 Verificando usuarios existentes...
2025-12-20T17:50:21.807Z ✅ Todos los usuarios ya están actualizados
2025-12-20T17:50:21.807Z ✅ Columnas de admin_users verificadas
2025-12-20T17:50:21.816Z ✅ Tabla user_permissions verificada
2025-12-20T17:50:21.816Z ✅ Tabla pedidos verificada (creada por migración)
2025-12-20T17:50:21.817Z ✅ Tabla users verificada
2025-12-20T17:50:21.818Z ✅ Tabla audit_log verificada
2025-12-20T17:50:21.822Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2025-12-20T17:50:21.823Z ✅ Tabla pedido_comments creada
2025-12-20T17:50:21.825Z ✅ Tabla vendedores creada
2025-12-20T17:50:21.829Z ✅ Índices verificados
2025-12-20T17:50:21.838Z ✅ Triggers configurados
2025-12-20T17:50:21.860Z ✅ Columna vendedor_id verificada/creada
2025-12-20T17:50:21.861Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2025-12-20T17:50:21.861Z 🔄 Health checks periódicos iniciados (cada 10s)
2025-12-20T17:50:21.861Z 🐘 PostgreSQL conectado exitosamente
2025-12-20T17:50:21.861Z ✅ dbClient compartido con middlewares
2025-12-20T17:50:21.866Z 🚀 Servidor iniciado en puerto 8080
2025-12-20T17:50:21.866Z ✅ PostgreSQL conectado - Sistema operativo
2025-12-20T17:50:31.874Z 🔄 Cliente removido del pool de conexiones
2025-12-20T17:50:31.895Z 🔗 Nueva conexión al pool establecida
2025-12-20T17:50:33.661Z 📨 [1] GET /api/pedidos - User: 4 - 2025-12-20T17:50:33.660Z
2025-12-20T17:50:33.707Z 📊 [2025-12-20T17:50:33.707Z] GET /api/pedidos (LEGACY) - Total: 213 pedidos
2025-12-20T17:50:33.774Z 📨 [2] GET /api/audit - User: 4 - 2025-12-20T17:50:33.773Z
2025-12-20T17:50:34.297Z 📨 [4] GET /api/materiales - User: 4 - 2025-12-20T17:50:34.295Z
2025-12-20T17:50:34.306Z ✅ Materiales obtenidos: 4