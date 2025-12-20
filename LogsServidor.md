2025-12-20T22:14:42.940Z === SCRIPT DE MIGRACIÓN COMPLETADO ===
2025-12-20T22:14:42.940Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2025-12-20T22:14:43.066Z [dotenv@17.2.2] injecting env (5) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
2025-12-20T22:14:43.447Z 🔄 Intentando conectar a PostgreSQL...
2025-12-20T22:14:43.447Z 👂 Event listeners del pool configurados
2025-12-20T22:14:43.513Z 🔗 Nueva conexión al pool establecida
2025-12-20T22:14:43.514Z ✅ PostgreSQL conectado correctamente
2025-12-20T22:14:43.514Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2025-12-20T22:14:43.514Z - Database: desde DATABASE_URL
2025-12-20T22:14:43.514Z - Max connections: 50
2025-12-20T22:14:43.516Z 🔧 Iniciando creación/verificación de tablas...
2025-12-20T22:14:43.518Z ✅ Extensión uuid-ossp verificada
2025-12-20T22:14:43.520Z ✅ Tabla admin_users verificada
2025-12-20T22:14:43.533Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2025-12-20T22:14:43.538Z ✅ Constraint de rol actualizado
2025-12-20T22:14:43.538Z 🔄 Verificando usuarios existentes...
2025-12-20T22:14:43.539Z ✅ Todos los usuarios ya están actualizados
2025-12-20T22:14:43.539Z ✅ Columnas de admin_users verificadas
2025-12-20T22:14:43.544Z ✅ Tabla user_permissions verificada
2025-12-20T22:14:43.544Z ✅ Tabla pedidos verificada (creada por migración)
2025-12-20T22:14:43.544Z ✅ Tabla users verificada
2025-12-20T22:14:43.545Z ✅ Tabla audit_log verificada
2025-12-20T22:14:43.548Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2025-12-20T22:14:43.549Z ✅ Tabla pedido_comments creada
2025-12-20T22:14:43.550Z ✅ Tabla vendedores creada
2025-12-20T22:14:43.554Z ✅ Índices verificados
2025-12-20T22:14:43.559Z ✅ Triggers configurados
2025-12-20T22:14:43.571Z ✅ Columna vendedor_id verificada/creada
2025-12-20T22:14:43.571Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2025-12-20T22:14:43.571Z 🔄 Health checks periódicos iniciados (cada 10s)
2025-12-20T22:14:43.571Z 🐘 PostgreSQL conectado exitosamente
2025-12-20T22:14:43.572Z ✅ dbClient compartido con middlewares
2025-12-20T22:14:43.577Z 🚀 Servidor iniciado en puerto 8080
2025-12-20T22:14:43.577Z ✅ PostgreSQL conectado - Sistema operativo
2025-12-20T22:14:47.050Z 📨 [1] GET /api/health - User: anonymous - 2025-12-20T22:14:47.049Z
2025-12-20T22:14:53.589Z 🔄 Cliente removido del pool de conexiones
2025-12-20T22:14:53.610Z 🔗 Nueva conexión al pool establecida
2025-12-20T22:15:33.347Z 📨 [2] POST /api/auth/login - User: anonymous - 2025-12-20T22:15:33.346Z
2025-12-20T22:15:33.871Z ✅ Login BD exitoso: admin (ADMIN)
2025-12-20T22:15:43.611Z 📨 [3] POST /api/auth/login - User: anonymous - 2025-12-20T22:15:43.609Z
2025-12-20T22:15:44.052Z ✅ Login BD exitoso: admin (ADMIN)
2025-12-20T22:16:03.247Z 📨 [4] POST /api/auth/login - User: anonymous - 2025-12-20T22:16:03.247Z
2025-12-20T22:16:03.744Z ✅ Login BD exitoso: admin (ADMIN)
2025-12-20T22:48:20.181Z 📨 [5] GET /api/pedidos - User: 02b857f4-ce88-4dc0-9579-54d8688dbcaa - 2025-12-20T22:48:20.180Z
2025-12-20T22:48:20.187Z - ❌ Error validando usuario: relation "admin_users" does not exist
2025-12-20T22:48:20.244Z 📨 [6] GET /api/audit - User: 02b857f4-ce88-4dc0-9579-54d8688dbcaa - 2025-12-20T22:48:20.242Z
2025-12-20T22:48:20.257Z - ❌ Error validando usuario: relation "admin_users" does not exist
2025-12-20T22:48:20.314Z 🔗 Nueva conexión al pool establecida
2025-12-20T22:48:30.269Z 🔄 Cliente removido del pool de conexiones
2025-12-20T22:48:38.944Z 📨 [8] POST /api/auth/login - User: anonymous - 2025-12-20T22:48:38.944Z
2025-12-20T22:48:38.951Z 💥 Error en login: error: relation "admin_users" does not exist
2025-12-20T22:48:38.951Z at /app/backend/node_modules/pg/lib/client.js:545:17
2025-12-20T22:48:38.951Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2025-12-20T22:48:38.951Z at async PostgreSQLClient.getAdminUserByUsername (/app/backend/postgres-client.js:105:28)
2025-12-20T22:48:38.951Z at async /app/backend/index.js:727:24 {
2025-12-20T22:48:38.951Z length: 110,
2025-12-20T22:48:38.951Z severity: 'ERROR',
2025-12-20T22:48:38.951Z code: '42P01',
2025-12-20T22:48:38.951Z detail: undefined,
2025-12-20T22:48:38.951Z hint: undefined,
2025-12-20T22:48:38.951Z position: '15',
2025-12-20T22:48:38.951Z internalPosition: undefined,
2025-12-20T22:48:38.951Z internalQuery: undefined,
2025-12-20T22:48:38.951Z where: undefined,
2025-12-20T22:48:38.951Z schema: undefined,
2025-12-20T22:48:38.951Z table: undefined,
2025-12-20T22:48:38.951Z column: undefined,
2025-12-20T22:48:38.951Z dataType: undefined,
2025-12-20T22:48:38.951Z constraint: undefined,
2025-12-20T22:48:38.951Z file: 'parse_relation.c',
2025-12-20T22:48:38.951Z line: '1392',
2025-12-20T22:48:38.951Z routine: 'parserOpenTable'
2025-12-20T22:48:38.951Z }
2025-12-20T22:48:50.144Z 📨 [9] POST /api/auth/register - User: anonymous - 2025-12-20T22:48:50.143Z
2025-12-20T22:48:50.154Z Error en registro: error: relation "admin_users" does not exist
2025-12-20T22:48:50.154Z at /app/backend/node_modules/pg/lib/client.js:545:17
2025-12-20T22:48:50.154Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2025-12-20T22:48:50.154Z at async PostgreSQLClient.getAdminUserByUsername (/app/backend/postgres-client.js:105:28)
2025-12-20T22:48:50.154Z at async /app/backend/index.js:887:31 {
2025-12-20T22:48:50.154Z length: 110,
2025-12-20T22:48:50.154Z severity: 'ERROR',
2025-12-20T22:48:50.154Z code: '42P01',
2025-12-20T22:48:50.154Z detail: undefined,
2025-12-20T22:48:50.154Z hint: undefined,
2025-12-20T22:48:50.154Z position: '15',
2025-12-20T22:48:50.154Z internalPosition: undefined,
2025-12-20T22:48:50.154Z internalQuery: undefined,
2025-12-20T22:48:50.154Z where: undefined,
2025-12-20T22:48:50.154Z schema: undefined,
2025-12-20T22:48:50.154Z table: undefined,
2025-12-20T22:48:50.154Z column: undefined,
2025-12-20T22:48:50.154Z dataType: undefined,
2025-12-20T22:48:50.154Z constraint: undefined,
2025-12-20T22:48:50.154Z file: 'parse_relation.c',
2025-12-20T22:48:50.154Z line: '1392',
2025-12-20T22:48:50.154Z routine: 'parserOpenTable'
2025-12-20T22:48:50.154Z }