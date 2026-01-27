2026-01-27T11:27:41.788Z psql:/app/database/migrations/001-add-clientes-system.sql:59: NOTICE:  relation "idx_clientes_estado" already exists, skipping
2026-01-27T11:27:41.788Z CREATE INDEX
2026-01-27T11:27:41.788Z CREATE INDEX
2026-01-27T11:27:41.788Z psql:/app/database/migrations/001-add-clientes-system.sql:60: NOTICE:  relation "idx_clientes_created_at" already exists, skipping
2026-01-27T11:27:41.790Z DROP TRIGGER
2026-01-27T11:27:41.792Z CREATE TRIGGER
2026-01-27T11:27:41.793Z COMMENT
2026-01-27T11:27:41.810Z DO
2026-01-27T11:27:41.825Z psql:/app/database/migrations/001-add-clientes-system.sql:137: NOTICE:  Se han migrado 0 nuevos clientes desde la tabla de pedidos.
2026-01-27T11:27:41.827Z DO
2026-01-27T11:27:41.827Z psql:/app/database/migrations/001-add-clientes-system.sql:137: NOTICE:  Se han actualizado las referencias de cliente_id en la tabla de pedidos.
2026-01-27T11:27:41.829Z CREATE FUNCTION
2026-01-27T11:27:41.830Z COMMENT
2026-01-27T11:27:41.832Z psql:/app/database/migrations/001-add-clientes-system.sql:177: NOTICE:  Permisos otorgados al rol pigmea_user.
2026-01-27T11:27:41.833Z DO
2026-01-27T11:27:41.838Z ✅ Migración 'Crear Tabla de Clientes' aplicada.
2026-01-27T11:27:41.838Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2026-01-27T11:27:41.956Z [dotenv@17.2.2] injecting env (5) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
2026-01-27T11:27:42.402Z 🔄 Intentando conectar a PostgreSQL...
2026-01-27T11:27:42.403Z 👂 Event listeners del pool configurados
2026-01-27T11:27:42.470Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:27:42.471Z ✅ PostgreSQL conectado correctamente
2026-01-27T11:27:42.471Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-27T11:27:42.472Z - Database: desde DATABASE_URL
2026-01-27T11:27:42.472Z - Max connections: 50
2026-01-27T11:27:42.475Z 🔧 Iniciando creación/verificación de tablas...
2026-01-27T11:27:42.478Z ✅ Extensión uuid-ossp verificada
2026-01-27T11:27:42.479Z ✅ Tabla admin_users verificada
2026-01-27T11:27:42.503Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2026-01-27T11:27:42.511Z ✅ Constraint de rol actualizado
2026-01-27T11:27:42.511Z 🔄 Verificando usuarios existentes...
2026-01-27T11:27:42.513Z ✅ Todos los usuarios ya están actualizados
2026-01-27T11:27:42.513Z ✅ Columnas de admin_users verificadas
2026-01-27T11:27:42.519Z ✅ Tabla user_permissions verificada
2026-01-27T11:27:42.519Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-27T11:27:42.521Z ✅ Tabla users verificada
2026-01-27T11:27:42.523Z ✅ Tabla audit_log verificada
2026-01-27T11:27:42.525Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-27T11:27:42.526Z ✅ Tabla pedido_comments creada
2026-01-27T11:27:42.527Z ✅ Tabla vendedores creada
2026-01-27T11:27:42.532Z ✅ Índices verificados
2026-01-27T11:27:42.538Z ✅ Triggers configurados
2026-01-27T11:27:42.551Z ✅ Columna vendedor_id verificada/creada
2026-01-27T11:27:42.551Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-27T11:27:42.551Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-27T11:27:42.551Z 🐘 PostgreSQL conectado exitosamente
2026-01-27T11:27:42.551Z ✅ dbClient compartido con middlewares
2026-01-27T11:27:42.551Z 🔄 Verificando y aplicando migraciones pendientes...
2026-01-27T11:27:42.556Z ✅ Migración 032 ya aplicada previamente
2026-01-27T11:27:42.561Z ✅ Migración 033 ya aplicada previamente
2026-01-27T11:27:42.573Z 🚀 Servidor iniciado en puerto 8080
2026-01-27T11:27:42.573Z ✅ PostgreSQL conectado - Sistema operativo
2026-01-27T11:28:33.342Z 📨 [1] GET /api/audit - User: 4 - 2026-01-27T11:28:33.340Z
2026-01-27T11:28:33.344Z 📨 [2] GET /api/pedidos - User: 4 - 2026-01-27T11:28:33.343Z
2026-01-27T11:28:33.364Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:28:33.438Z 📊 [2026-01-27T11:28:33.438Z] GET /api/pedidos (LEGACY) - Total: 715 pedidos
2026-01-27T11:28:33.605Z 📨 [3] GET /api/vendedores - User: 4 - 2026-01-27T11:28:33.605Z
2026-01-27T11:28:33.611Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 4
2026-01-27T11:28:33.611Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-27T11:28:33.615Z 📨 [4] GET /api/clientes/simple - User: 4 - 2026-01-27T11:28:33.615Z
2026-01-27T11:28:33.618Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 4
2026-01-27T11:28:33.618Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-27T11:28:33.622Z 📨 [5] GET /api/notifications - User: 4 - 2026-01-27T11:28:33.622Z
2026-01-27T11:28:33.644Z 📊 [getAllClientesSimple] Total clientes encontrados: 117
2026-01-27T11:28:33.672Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:28:34.347Z 📨 [7] GET /api/materiales - User: 4 - 2026-01-27T11:28:34.346Z
2026-01-27T11:28:34.376Z ✅ Materiales obtenidos: 257
2026-01-27T11:28:39.418Z 📨 [8] GET /api/pedidos - User: 4 - 2026-01-27T11:28:39.417Z
2026-01-27T11:28:39.425Z 📨 [9] GET /api/audit - User: 4 - 2026-01-27T11:28:39.423Z
2026-01-27T11:28:39.550Z 📊 [2026-01-27T11:28:39.549Z] GET /api/pedidos (LEGACY) - Total: 715 pedidos
2026-01-27T11:28:39.631Z 📨 [11] GET /api/vendedores - User: 4 - 2026-01-27T11:28:39.631Z
2026-01-27T11:28:39.632Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 4
2026-01-27T11:28:39.632Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-27T11:28:39.644Z 📨 [12] GET /api/clientes/simple - User: 4 - 2026-01-27T11:28:39.643Z
2026-01-27T11:28:39.644Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 4
2026-01-27T11:28:39.644Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-27T11:28:39.647Z 📨 [13] GET /api/notifications - User: 4 - 2026-01-27T11:28:39.645Z
2026-01-27T11:28:39.669Z 📊 [getAllClientesSimple] Total clientes encontrados: 117
2026-01-27T11:28:40.653Z 📨 [14] GET /api/materiales - User: 4 - 2026-01-27T11:28:40.652Z
2026-01-27T11:28:40.662Z ✅ Materiales obtenidos: 257
2026-01-27T11:28:44.418Z 📨 [15] GET /api/analysis/instructions - User: anonymous - 2026-01-27T11:28:44.418Z
2026-01-27T11:28:45.748Z 📨 [16] GET /api/analytics/summary - User: 4 - 2026-01-27T11:28:45.748Z
2026-01-27T11:28:45.751Z ⚠️ Pool de conexiones bajo presión
2026-01-27T11:28:45.751Z - Total: 3/50 (6.0% uso)
2026-01-27T11:28:45.751Z - Idle: 2 (66.7%)
2026-01-27T11:28:45.751Z - Waiting: 5
2026-01-27T11:28:45.751Z ⚠️ Pool de conexiones bajo presión
2026-01-27T11:28:45.751Z - Total: 3/50 (6.0% uso)
2026-01-27T11:28:45.751Z - Idle: 1 (33.3%)
2026-01-27T11:28:45.751Z - Waiting: 4
2026-01-27T11:28:45.752Z ⚠️ Pool de conexiones bajo presión
2026-01-27T11:28:45.752Z - Total: 3/50 (6.0% uso)
2026-01-27T11:28:45.752Z - Idle: 0 (0.0%)
2026-01-27T11:28:45.752Z - Waiting: 3
2026-01-27T11:28:45.786Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:28:45.797Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:28:45.801Z 🔗 Nueva conexión al pool establecida