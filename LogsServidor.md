2025-12-20T23:09:13.292Z CREATE TABLE
2025-12-20T23:09:13.292Z psql:../database/migrations/027-create-materiales-table.sql:15: NOTICE:  relation "materiales" already exists, skipping
2025-12-20T23:09:13.294Z COMMENT
2025-12-20T23:09:13.295Z COMMENT
2025-12-20T23:09:13.296Z COMMENT
2025-12-20T23:09:13.298Z COMMENT
2025-12-20T23:09:13.302Z psql:../database/migrations/027-create-materiales-table.sql:25: NOTICE:  relation "idx_materiales_numero" already exists, skipping
2025-12-20T23:09:13.302Z COMMENT
2025-12-20T23:09:13.302Z CREATE INDEX
2025-12-20T23:09:13.303Z CREATE INDEX
2025-12-20T23:09:13.303Z psql:../database/migrations/027-create-materiales-table.sql:28: NOTICE:  relation "idx_materiales_estados" already exists, skipping
2025-12-20T23:09:13.306Z CREATE FUNCTION
2025-12-20T23:09:13.307Z DROP TRIGGER
2025-12-20T23:09:13.309Z CREATE TRIGGER
2025-12-20T23:09:13.309Z psql:../database/migrations/027-create-materiales-table.sql:54: NOTICE:  relation "pedidos_materiales" already exists, skipping
2025-12-20T23:09:13.309Z CREATE TABLE
2025-12-20T23:09:13.310Z COMMENT
2025-12-20T23:09:13.310Z psql:../database/migrations/027-create-materiales-table.sql:60: NOTICE:  relation "idx_pedidos_materiales_pedido" already exists, skipping
2025-12-20T23:09:13.311Z psql:../database/migrations/027-create-materiales-table.sql:61: NOTICE:  relation "idx_pedidos_materiales_material" already exists, skipping
2025-12-20T23:09:13.311Z CREATE INDEX
2025-12-20T23:09:13.311Z CREATE INDEX
2025-12-20T23:09:13.375Z psql:../database/migrations/027-create-materiales-table.sql:111: NOTICE:  Migración de números de compra a materiales completada
2025-12-20T23:09:13.377Z DO
2025-12-20T23:09:13.379Z ✅ Migración 'Crear Sistema de Gestión de Materiales' aplicada exitosamente.
2025-12-20T23:09:13.379Z === SCRIPT DE MIGRACIÓN COMPLETADO ===
2025-12-20T23:09:13.379Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2025-12-20T23:09:13.515Z [dotenv@17.2.2] injecting env (5) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
2025-12-20T23:09:13.992Z 🔄 Intentando conectar a PostgreSQL...
2025-12-20T23:09:13.993Z 👂 Event listeners del pool configurados
2025-12-20T23:09:14.060Z 🔗 Nueva conexión al pool establecida
2025-12-20T23:09:14.061Z ✅ PostgreSQL conectado correctamente
2025-12-20T23:09:14.061Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2025-12-20T23:09:14.061Z - Database: desde DATABASE_URL
2025-12-20T23:09:14.061Z - Max connections: 50
2025-12-20T23:09:14.063Z 🔧 Iniciando creación/verificación de tablas...
2025-12-20T23:09:14.065Z ✅ Extensión uuid-ossp verificada
2025-12-20T23:09:14.067Z ✅ Tabla admin_users verificada
2025-12-20T23:09:14.079Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2025-12-20T23:09:14.085Z ✅ Constraint de rol actualizado
2025-12-20T23:09:14.086Z 🔄 Verificando usuarios existentes...
2025-12-20T23:09:14.089Z ✅ Todos los usuarios ya están actualizados
2025-12-20T23:09:14.089Z ✅ Columnas de admin_users verificadas
2025-12-20T23:09:14.094Z ✅ Tabla user_permissions verificada
2025-12-20T23:09:14.094Z ✅ Tabla pedidos verificada (creada por migración)
2025-12-20T23:09:14.095Z ✅ Tabla users verificada
2025-12-20T23:09:14.096Z ✅ Tabla audit_log verificada
2025-12-20T23:09:14.099Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2025-12-20T23:09:14.100Z ✅ Tabla pedido_comments creada
2025-12-20T23:09:14.101Z ✅ Tabla vendedores creada
2025-12-20T23:09:14.107Z ✅ Índices verificados
2025-12-20T23:09:14.116Z ✅ Triggers configurados
2025-12-20T23:09:14.123Z ✅ Columna vendedor_id verificada/creada
2025-12-20T23:09:14.124Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2025-12-20T23:09:14.124Z 🔄 Health checks periódicos iniciados (cada 10s)
2025-12-20T23:09:14.125Z 🐘 PostgreSQL conectado exitosamente
2025-12-20T23:09:14.125Z ✅ dbClient compartido con middlewares
2025-12-20T23:09:14.136Z 🚀 Servidor iniciado en puerto 8080
2025-12-20T23:09:14.136Z ✅ PostgreSQL conectado - Sistema operativo
2025-12-20T23:09:24.135Z 🔄 Cliente removido del pool de conexiones
2025-12-20T23:09:24.156Z 🔗 Nueva conexión al pool establecida
2025-12-20T23:10:05.646Z 📨 [1] GET /api/pedidos - User: 4 - 2025-12-20T23:10:05.645Z
2025-12-20T23:10:05.695Z 📊 [2025-12-20T23:10:05.695Z] GET /api/pedidos (LEGACY) - Total: 213 pedidos
2025-12-20T23:10:05.734Z 📨 [2] GET /api/audit - User: 4 - 2025-12-20T23:10:05.734Z
2025-12-20T23:10:06.116Z 📨 [4] GET /api/materiales - User: 4 - 2025-12-20T23:10:06.115Z
2025-12-20T23:10:06.139Z ✅ Materiales obtenidos: 175
2025-12-20T23:10:15.910Z 📨 [5] GET /api/comments/1763028177275 - User: 4 - 2025-12-20T23:10:15.910Z
2025-12-20T23:10:15.930Z 📨 [6] GET /api/pedidos/1763028177275/materiales - User: 4 - 2025-12-20T23:10:15.930Z
2025-12-20T23:10:15.933Z 📨 [7] GET /api/vendedores - User: 4 - 2025-12-20T23:10:15.932Z
2025-12-20T23:10:15.934Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 4
2025-12-20T23:10:15.934Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2025-12-20T23:10:15.946Z 📦 Materiales para pedido 1763028177275: [
2025-12-20T23:10:15.946Z {
2025-12-20T23:10:15.946Z id: 369,
2025-12-20T23:10:15.946Z numero: '20 BIO PLV. EKP-33836',
2025-12-20T23:10:15.946Z pendienteRecibir: true,
2025-12-20T23:10:15.947Z pendienteGestion: true
2025-12-20T23:10:15.947Z },
2025-12-20T23:10:15.947Z {
2025-12-20T23:10:15.947Z id: 370,
2025-12-20T23:10:15.947Z numero: '20 MET PLV. EKP-33836',
2025-12-20T23:10:15.947Z pendienteRecibir: true,
2025-12-20T23:10:15.947Z pendienteGestion: true
2025-12-20T23:10:15.947Z }
2025-12-20T23:10:15.947Z ]
2025-12-20T23:10:15.948Z 📦 GET /api/pedidos/1763028177275/materiales → 2 materiales encontrados
2025-12-20T23:10:15.980Z 🔗 Nueva conexión al pool establecida
2025-12-20T23:10:16.379Z 🔒 Pedido 1763028177275 bloqueado por admin (4)
2025-12-20T23:10:22.843Z 🔓 Pedido 1763028177275 desbloqueado por admin
2025-12-20T23:10:25.955Z 🔄 Cliente removido del pool de conexiones
2025-12-20T23:16:40.369Z 📨 [8] GET /api/vendedores - User: 4 - 2025-12-20T23:16:40.368Z
2025-12-20T23:16:40.376Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 4
2025-12-20T23:16:40.376Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2025-12-20T23:16:48.668Z 📨 [9] GET /api/produccion/operaciones-activas - User: 4 - 2025-12-20T23:16:48.668Z
2025-12-20T23:16:48.757Z 📨 [10] GET /api/produccion/estadisticas/4 - User: 4 - 2025-12-20T23:16:48.757Z
2025-12-20T23:16:48.764Z 📨 [11] GET /api/produccion/pedidos-disponibles - User: 4 - 2025-12-20T23:16:48.761Z
2025-12-20T23:16:48.792Z 🔗 Nueva conexión al pool establecida
2025-12-20T23:16:58.780Z 🔄 Cliente removido del pool de conexiones