2026-01-12T21:27:54.315Z COMMENT
2026-01-12T21:27:54.316Z COMMENT
2026-01-12T21:27:54.316Z COMMENT
2026-01-12T21:27:54.317Z COMMENT
2026-01-12T21:27:54.318Z COMMENT
2026-01-12T21:27:54.319Z COMMENT
2026-01-12T21:27:54.319Z COMMENT
2026-01-12T21:27:54.320Z psql:/app/database/migrations/001-add-clientes-system.sql:58: NOTICE:  relation "idx_clientes_nombre" already exists, skipping
2026-01-12T21:27:54.320Z CREATE INDEX
2026-01-12T21:27:54.320Z CREATE INDEX
2026-01-12T21:27:54.321Z psql:/app/database/migrations/001-add-clientes-system.sql:59: NOTICE:  relation "idx_clientes_estado" already exists, skipping
2026-01-12T21:27:54.321Z psql:/app/database/migrations/001-add-clientes-system.sql:60: NOTICE:  relation "idx_clientes_created_at" already exists, skipping
2026-01-12T21:27:54.321Z CREATE INDEX
2026-01-12T21:27:54.323Z DROP TRIGGER
2026-01-12T21:27:54.324Z CREATE TRIGGER
2026-01-12T21:27:54.326Z COMMENT
2026-01-12T21:27:54.337Z DO
2026-01-12T21:27:54.343Z psql:/app/database/migrations/001-add-clientes-system.sql:137: NOTICE:  Se han migrado 0 nuevos clientes desde la tabla de pedidos.
2026-01-12T21:27:54.344Z psql:/app/database/migrations/001-add-clientes-system.sql:137: NOTICE:  Se han actualizado las referencias de cliente_id en la tabla de pedidos.
2026-01-12T21:27:54.344Z DO
2026-01-12T21:27:54.345Z CREATE FUNCTION
2026-01-12T21:27:54.346Z COMMENT
2026-01-12T21:27:54.347Z psql:/app/database/migrations/001-add-clientes-system.sql:177: NOTICE:  Permisos otorgados al rol pigmea_user.
2026-01-12T21:27:54.349Z DO
2026-01-12T21:27:54.350Z ✅ Migración 'Crear Tabla de Clientes' aplicada.
2026-01-12T21:27:54.352Z 🚀 Migraciones completadas. Iniciando servidor Node.js...
2026-01-12T21:27:54.444Z [dotenv@17.2.2] injecting env (5) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
2026-01-12T21:27:54.813Z 🔄 Intentando conectar a PostgreSQL...
2026-01-12T21:27:54.813Z 👂 Event listeners del pool configurados
2026-01-12T21:27:54.879Z 🔗 Nueva conexión al pool establecida
2026-01-12T21:27:54.880Z ✅ PostgreSQL conectado correctamente
2026-01-12T21:27:54.880Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-12T21:27:54.880Z - Database: desde DATABASE_URL
2026-01-12T21:27:54.880Z - Max connections: 50
2026-01-12T21:27:54.881Z 🔧 Iniciando creación/verificación de tablas...
2026-01-12T21:27:54.884Z ✅ Extensión uuid-ossp verificada
2026-01-12T21:27:54.886Z ✅ Tabla admin_users verificada
2026-01-12T21:27:54.904Z 📋 Columnas existentes en admin_users: id, username, password_hash, role, is_active, created_at, updated_at, last_login_at, email, first_name, last_name, permissions, last_login, last_activity, ip_address, user_agent
2026-01-12T21:27:54.914Z ✅ Constraint de rol actualizado
2026-01-12T21:27:54.915Z 🔄 Verificando usuarios existentes...
2026-01-12T21:27:54.917Z ✅ Todos los usuarios ya están actualizados
2026-01-12T21:27:54.917Z ✅ Columnas de admin_users verificadas
2026-01-12T21:27:54.923Z ✅ Tabla user_permissions verificada
2026-01-12T21:27:54.923Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-12T21:27:54.924Z ✅ Tabla users verificada
2026-01-12T21:27:54.925Z ✅ Tabla audit_log verificada
2026-01-12T21:27:54.927Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-12T21:27:54.928Z ✅ Tabla pedido_comments creada
2026-01-12T21:27:54.929Z ✅ Tabla vendedores creada
2026-01-12T21:27:54.934Z ✅ Índices verificados
2026-01-12T21:27:54.939Z ✅ Triggers configurados
2026-01-12T21:27:54.950Z ✅ Columna vendedor_id verificada/creada
2026-01-12T21:27:54.950Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-12T21:27:54.950Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-12T21:27:54.950Z 🐘 PostgreSQL conectado exitosamente
2026-01-12T21:27:54.950Z ✅ dbClient compartido con middlewares
2026-01-12T21:27:54.953Z 🚀 Servidor iniciado en puerto 8080
2026-01-12T21:27:54.953Z ✅ PostgreSQL conectado - Sistema operativo
2026-01-12T21:28:04.986Z 🔗 Nueva conexión al pool establecida
2026-01-12T21:30:52.070Z 📨 [1] GET /api/pedidos - User: 16 - 2026-01-12T21:30:52.067Z
2026-01-12T21:30:52.078Z 📨 [2] GET /api/audit - User: 16 - 2026-01-12T21:30:52.078Z
2026-01-12T21:30:52.109Z 🔗 Nueva conexión al pool establecida
2026-01-12T21:30:52.187Z 📊 [2026-01-12T21:30:52.186Z] GET /api/pedidos (LEGACY) - Total: 468 pedidos
2026-01-12T21:30:52.630Z 📨 [3] GET /api/vendedores - User: 16 - 2026-01-12T21:30:52.629Z
2026-01-12T21:30:52.638Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 16
2026-01-12T21:30:52.638Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-12T21:30:52.640Z 📨 [4] GET /api/clientes/simple - User: 16 - 2026-01-12T21:30:52.640Z
2026-01-12T21:30:52.642Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 16
2026-01-12T21:30:52.642Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-12T21:30:52.653Z 📊 [getAllClientesSimple] Total clientes encontrados: 95
2026-01-12T21:30:52.935Z 📨 [6] GET /api/materiales - User: 16 - 2026-01-12T21:30:52.935Z
2026-01-12T21:30:52.956Z ✅ Materiales obtenidos: 257
2026-01-12T21:30:56.273Z 📨 [7] GET /api/observaciones/templates - User: 16 - 2026-01-12T21:30:56.273Z
2026-01-12T21:30:56.277Z 📨 [8] GET /api/users/active - User: 16 - 2026-01-12T21:30:56.275Z
2026-01-12T21:30:56.278Z 📨 [9] GET /api/comments/1765811048017 - User: 16 - 2026-01-12T21:30:56.276Z
2026-01-12T21:30:56.289Z 🔒 Pedido 1765811048017 bloqueado por Jhony (16)
2026-01-12T21:30:56.296Z 📨 [10] GET /api/vendedores - User: 16 - 2026-01-12T21:30:56.296Z
2026-01-12T21:30:56.296Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 16
2026-01-12T21:30:56.297Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-12T21:30:56.298Z 📨 [11] GET /api/clientes/simple - User: 16 - 2026-01-12T21:30:56.297Z
2026-01-12T21:30:56.298Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 16
2026-01-12T21:30:56.298Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-12T21:30:56.298Z 📨 [12] GET /api/pedidos/1765811048017/materiales - User: 16 - 2026-01-12T21:30:56.298Z
2026-01-12T21:30:56.316Z 📊 [getAllClientesSimple] Total clientes encontrados: 95
2026-01-12T21:30:56.326Z 🔗 Nueva conexión al pool establecida
2026-01-12T21:30:56.331Z 🔗 Nueva conexión al pool establecida
2026-01-12T21:30:56.340Z 📦 Materiales para pedido 1765811048017: [
2026-01-12T21:30:56.340Z {
2026-01-12T21:30:56.340Z id: 237,
2026-01-12T21:30:56.340Z numero: '20 BIO. PLV. EKP-34595',
2026-01-12T21:30:56.340Z pendienteRecibir: true,
2026-01-12T21:30:56.340Z pendienteGestion: true
2026-01-12T21:30:56.340Z }
2026-01-12T21:30:56.340Z ]
2026-01-12T21:30:56.341Z 📦 GET /api/pedidos/1765811048017/materiales → 1 materiales encontrados
2026-01-12T21:31:06.631Z 📨 [14] POST /api/comments - User: 16 - 2026-01-12T21:31:06.631Z
2026-01-12T21:31:06.634Z 🔄 Convirtiendo user_id "16" a UUID: c15b38c9-9a3e-543c-a703-dd742f25b4d5