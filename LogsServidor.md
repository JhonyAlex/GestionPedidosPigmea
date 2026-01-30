2026-01-30T01:50:32.864Z ✅ Base de datos actualizada. No hay migraciones pendientes.
2026-01-30T01:50:32.865Z ✅ Migraciones completadas exitosamente
2026-01-30T01:50:32.866Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-30T01:50:32.867Z 🔧 Iniciando creación/verificación de tablas...
2026-01-30T01:50:32.868Z ✅ Extensión uuid-ossp verificada
2026-01-30T01:50:32.878Z ✅ Tabla admin_users verificada
2026-01-30T01:50:32.897Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-30T01:50:32.902Z ✅ Constraint de rol actualizado
2026-01-30T01:50:32.902Z 🔄 Verificando usuarios existentes...
2026-01-30T01:50:32.904Z ✅ Todos los usuarios ya están actualizados
2026-01-30T01:50:32.904Z ✅ Columnas de admin_users verificadas
2026-01-30T01:50:32.912Z ✅ Tabla user_permissions verificada
2026-01-30T01:50:32.912Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-30T01:50:32.913Z ✅ Tabla users verificada
2026-01-30T01:50:32.914Z ✅ Tabla audit_log verificada
2026-01-30T01:50:32.921Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-30T01:50:32.922Z ✅ Tabla pedido_comments creada
2026-01-30T01:50:32.923Z ✅ Tabla vendedores creada
2026-01-30T01:50:32.927Z ✅ Índices verificados
2026-01-30T01:50:32.935Z ✅ Triggers configurados
2026-01-30T01:50:32.942Z ✅ Columna vendedor_id verificada/creada
2026-01-30T01:50:32.942Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-30T01:50:32.947Z 🚀 Servidor iniciado en puerto 3001
2026-01-30T01:50:32.947Z ✅ PostgreSQL conectado - Sistema operativo
2026-01-30T01:53:23.664Z 📨 [1] GET /api/pedidos - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:23.664Z
2026-01-30T01:53:23.681Z 📊 [2026-01-30T01:53:23.681Z] GET /api/pedidos (LEGACY) - Total: 2 pedidos
2026-01-30T01:53:23.838Z 📨 [2] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:23.838Z
2026-01-30T01:53:23.845Z 📨 [3] GET /api/audit - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:23.843Z
2026-01-30T01:53:23.859Z 📨 [4] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:23.858Z
2026-01-30T01:53:23.863Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:53:23.865Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:53:23.865Z 📨 [5] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:23.863Z
2026-01-30T01:53:23.865Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:53:23.865Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:53:23.866Z 📨 [6] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:23.866Z
2026-01-30T01:53:23.907Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:53:23.908Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:53:23.915Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:53:23.916Z 📊 [getAllClientesSimple] Total clientes encontrados: 1
2026-01-30T01:53:24.390Z 📨 [7] GET /api/materiales - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:24.390Z
2026-01-30T01:53:24.397Z ✅ Materiales obtenidos: 0
2026-01-30T01:53:25.781Z 📨 [8] GET /api/observaciones/templates - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:25.780Z
2026-01-30T01:53:25.839Z 🔒 Pedido 1769733842532 bloqueado por Jhony Admin (b24fa21c-f2b2-4034-b10c-c0e65c09019e)
2026-01-30T01:53:25.977Z 📨 [9] GET /api/comments/1769733842532 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:25.977Z
2026-01-30T01:53:25.983Z 📨 [10] GET /api/users/active - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:25.983Z
2026-01-30T01:53:25.984Z 📨 [11] GET /api/pedidos/1769733842532/materiales - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:25.984Z
2026-01-30T01:53:25.986Z 📨 [12] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:25.985Z
2026-01-30T01:53:25.987Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:53:25.987Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:53:25.990Z 📨 [13] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:25.987Z
2026-01-30T01:53:25.990Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:53:25.990Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:53:26.000Z 📦 GET /api/pedidos/1769733842532/materiales → 0 materiales encontrados
2026-01-30T01:53:26.012Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:53:26.018Z 📊 [getAllClientesSimple] Total clientes encontrados: 1
2026-01-30T01:53:30.287Z 🔓 Pedido 1769733842532 desbloqueado por Jhony Admin
2026-01-30T01:53:32.901Z 📨 [14] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:32.901Z
2026-01-30T01:53:32.903Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:53:32.903Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:53:38.716Z 📨 [15] POST /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:53:38.715Z
2026-01-30T01:53:38.720Z 🔐 requirePermission middleware
2026-01-30T01:53:38.721Z - Ruta: POST /api/vendedores
2026-01-30T01:53:38.721Z - Permiso requerido: vendedores.create
2026-01-30T01:53:38.721Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-30T01:53:38.729Z - Headers: {
2026-01-30T01:53:38.729Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-30T01:53:38.729Z userRole: 'Administrador'
2026-01-30T01:53:38.729Z }
2026-01-30T01:53:38.729Z - Permisos a verificar (incluyendo aliases): [ 'vendedores.create' ]
2026-01-30T01:53:38.729Z - Verificando permiso en BD...
2026-01-30T01:53:38.730Z 🔍 Verificando permiso 'vendedores.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:53:38.730Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:53:38.730Z - ✅ Usuario tiene permiso: vendedores.create
2026-01-30T01:53:38.730Z - Resultado: ✅ PERMITIDO
2026-01-30T01:53:38.730Z ✅ Permiso concedido - continuando con la request
2026-01-30T01:53:38.745Z Error in POST /api/vendedores: error: insert or update on table "vendedores_history" violates foreign key constraint "vendedores_history_vendedor_id_fkey"
2026-01-30T01:53:38.745Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-30T01:53:38.745Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T01:53:38.745Z at async PostgreSQLClient.logVendedorHistory (/app/backend/postgres-client.js:962:9)
2026-01-30T01:53:38.746Z at async PostgreSQLClient.createVendedor (/app/backend/postgres-client.js:2753:13)
2026-01-30T01:53:38.746Z at async /app/backend/index.js:4276:31 {
2026-01-30T01:53:38.746Z length: 346,
2026-01-30T01:53:38.746Z severity: 'ERROR',
2026-01-30T01:53:38.746Z code: '23503',
2026-01-30T01:53:38.746Z detail: 'Key (vendedor_id)=(a0fb5c19-e2c1-4764-9204-f29a9913052f) is not present in table "vendedores".',
2026-01-30T01:53:38.746Z hint: undefined,
2026-01-30T01:53:38.746Z position: undefined,
2026-01-30T01:53:38.746Z internalPosition: undefined,
2026-01-30T01:53:38.746Z internalQuery: undefined,
2026-01-30T01:53:38.746Z where: undefined,
2026-01-30T01:53:38.746Z schema: 'limpio',
2026-01-30T01:53:38.746Z table: 'vendedores_history',
2026-01-30T01:53:38.746Z column: undefined,
2026-01-30T01:53:38.746Z dataType: undefined,
2026-01-30T01:53:38.746Z constraint: 'vendedores_history_vendedor_id_fkey',
2026-01-30T01:53:38.746Z file: 'ri_triggers.c',
2026-01-30T01:53:38.746Z line: '2596',
2026-01-30T01:53:38.746Z routine: 'ri_ReportViolation'
2026-01-30T01:53:38.746Z }