2026-01-27T11:33:57.532Z COMMENT
2026-01-27T11:33:57.533Z COMMENT
2026-01-27T11:33:57.534Z COMMENT
2026-01-27T11:33:57.535Z COMMENT
2026-01-27T11:33:57.537Z COMMENT
2026-01-27T11:33:57.538Z COMMENT
2026-01-27T11:33:57.539Z COMMENT
2026-01-27T11:33:57.540Z COMMENT
2026-01-27T11:33:57.541Z COMMENT
2026-01-27T11:33:57.542Z COMMENT
2026-01-27T11:33:57.543Z COMMENT
2026-01-27T11:33:57.544Z psql:/app/database/migrations/001-add-clientes-system.sql:58: NOTICE:  relation "idx_clientes_nombre" already exists, skipping
2026-01-27T11:33:57.544Z CREATE INDEX
2026-01-27T11:33:57.545Z CREATE INDEX
2026-01-27T11:33:57.545Z psql:/app/database/migrations/001-add-clientes-system.sql:59: NOTICE:  relation "idx_clientes_estado" already exists, skipping
2026-01-27T11:33:57.546Z CREATE INDEX
2026-01-27T11:33:57.546Z psql:/app/database/migrations/001-add-clientes-system.sql:60: NOTICE:  relation "idx_clientes_created_at" already exists, skipping
2026-01-27T11:33:57.548Z DROP TRIGGER
2026-01-27T11:33:57.550Z CREATE TRIGGER
2026-01-27T11:33:57.551Z COMMENT
2026-01-27T11:33:57.569Z DO
2026-01-27T11:33:57.582Z psql:/app/database/migrations/001-add-clientes-system.sql:137: NOTICE:  Se han migrado 0 nuevos clientes desde la tabla de pedidos.
2026-01-27T11:33:57.583Z psql:/app/database/migrations/001-add-clientes-system.sql:137: NOTICE:  Se han actualizado las referencias de cliente_id en la tabla de pedidos.
2026-01-27T11:33:57.583Z DO
2026-01-27T11:33:57.585Z CREATE FUNCTION
2026-01-27T11:33:57.586Z COMMENT
2026-01-27T11:33:57.589Z psql:/app/database/migrations/001-add-clientes-system.sql:177: NOTICE:  Permisos otorgados al rol pigmea_user.
2026-01-27T11:33:57.592Z DO
2026-01-27T11:33:57.592Z ✅ Migración 'Crear Tabla de Clientes' aplicada.
2026-01-27T11:33:57.593Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2026-01-27T11:33:57.798Z [dotenv@17.2.2] injecting env (5) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
2026-01-27T11:33:58.321Z 🔄 Intentando conectar a PostgreSQL...
2026-01-27T11:33:58.321Z 👂 Event listeners del pool configurados
2026-01-27T11:33:58.402Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:33:58.404Z ✅ PostgreSQL conectado correctamente
2026-01-27T11:33:58.405Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-27T11:33:58.405Z - Database: desde DATABASE_URL
2026-01-27T11:33:58.405Z - Max connections: 50
2026-01-27T11:33:58.407Z 🔧 Iniciando creación/verificación de tablas...
2026-01-27T11:33:58.412Z ✅ Extensión uuid-ossp verificada
2026-01-27T11:33:58.416Z ✅ Tabla admin_users verificada
2026-01-27T11:33:58.441Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2026-01-27T11:33:58.448Z ✅ Constraint de rol actualizado
2026-01-27T11:33:58.450Z 🔄 Verificando usuarios existentes...
2026-01-27T11:33:58.454Z ✅ Todos los usuarios ya están actualizados
2026-01-27T11:33:58.454Z ✅ Columnas de admin_users verificadas
2026-01-27T11:33:58.465Z ✅ Tabla user_permissions verificada
2026-01-27T11:33:58.466Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-27T11:33:58.467Z ✅ Tabla users verificada
2026-01-27T11:33:58.468Z ✅ Tabla audit_log verificada
2026-01-27T11:33:58.473Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-27T11:33:58.474Z ✅ Tabla pedido_comments creada
2026-01-27T11:33:58.475Z ✅ Tabla vendedores creada
2026-01-27T11:33:58.478Z ✅ Índices verificados
2026-01-27T11:33:58.489Z ✅ Triggers configurados
2026-01-27T11:33:58.506Z ✅ Columna vendedor_id verificada/creada
2026-01-27T11:33:58.506Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-27T11:33:58.508Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-27T11:33:58.508Z 🐘 PostgreSQL conectado exitosamente
2026-01-27T11:33:58.509Z ✅ dbClient compartido con middlewares
2026-01-27T11:33:58.509Z 🔄 Verificando y aplicando migraciones pendientes...
2026-01-27T11:33:58.518Z ✅ Migración 032 ya aplicada previamente
2026-01-27T11:33:58.524Z ✅ Migración 033 ya aplicada previamente
2026-01-27T11:33:58.532Z 🚀 Servidor iniciado en puerto 8080
2026-01-27T11:33:58.532Z ✅ PostgreSQL conectado - Sistema operativo
2026-01-27T11:35:24.791Z 📨 [2] GET /api/audit - User: 4 - 2026-01-27T11:35:24.790Z
2026-01-27T11:35:24.798Z 📨 [3] GET /api/pedidos - User: 4 - 2026-01-27T11:35:24.797Z
2026-01-27T11:35:24.894Z 📊 [2026-01-27T11:35:24.894Z] GET /api/pedidos (LEGACY) - Total: 715 pedidos
2026-01-27T11:35:24.991Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:35:24.996Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:35:25.055Z 📨 [4] GET /api/vendedores - User: 4 - 2026-01-27T11:35:25.054Z
2026-01-27T11:35:25.060Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 4
2026-01-27T11:35:25.060Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-27T11:35:25.063Z 📨 [5] GET /api/notifications - User: 4 - 2026-01-27T11:35:25.063Z
2026-01-27T11:35:25.069Z 📨 [6] GET /api/clientes/simple - User: 4 - 2026-01-27T11:35:25.067Z
2026-01-27T11:35:25.070Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 4
2026-01-27T11:35:25.070Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-27T11:35:25.104Z 📊 [getAllClientesSimple] Total clientes encontrados: 117
2026-01-27T11:35:26.139Z 📨 [7] GET /api/materiales - User: 4 - 2026-01-27T11:35:26.138Z
2026-01-27T11:35:26.157Z ✅ Materiales obtenidos: 257
2026-01-27T11:35:31.668Z 📨 [8] GET /api/analysis/instructions - User: anonymous - 2026-01-27T11:35:31.667Z
2026-01-27T11:35:32.910Z 📨 [9] GET /api/analytics/summary - User: 4 - 2026-01-27T11:35:32.909Z
2026-01-27T11:35:32.913Z ⚠️ Pool de conexiones bajo presión
2026-01-27T11:35:32.913Z - Total: 3/50 (6.0% uso)
2026-01-27T11:35:32.913Z - Idle: 2 (66.7%)
2026-01-27T11:35:32.913Z - Waiting: 5
2026-01-27T11:35:32.914Z ⚠️ Pool de conexiones bajo presión
2026-01-27T11:35:32.915Z - Total: 3/50 (6.0% uso)
2026-01-27T11:35:32.916Z - Idle: 1 (33.3%)
2026-01-27T11:35:32.916Z - Waiting: 4
2026-01-27T11:35:32.917Z ⚠️ Pool de conexiones bajo presión
2026-01-27T11:35:32.917Z - Total: 3/50 (6.0% uso)
2026-01-27T11:35:32.917Z - Idle: 0 (0.0%)
2026-01-27T11:35:32.917Z - Waiting: 3
2026-01-27T11:35:32.962Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:35:32.969Z 🔗 Nueva conexión al pool establecida
2026-01-27T11:35:32.973Z 🔗 Nueva conexión al pool establecida