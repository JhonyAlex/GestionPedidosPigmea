2026-01-29T16:02:51.105Z 📋 Columnas existentes en admin_users:
2026-01-29T16:02:51.105Z ➕ Agregando columna faltante: email
2026-01-29T16:02:51.107Z ⚠️ No se pudo agregar columna email: column "email" of relation "admin_users" already exists
2026-01-29T16:02:51.107Z ➕ Agregando columna faltante: first_name
2026-01-29T16:02:51.108Z ⚠️ No se pudo agregar columna first_name: column "first_name" of relation "admin_users" already exists
2026-01-29T16:02:51.108Z ➕ Agregando columna faltante: last_name
2026-01-29T16:02:51.108Z ⚠️ No se pudo agregar columna last_name: column "last_name" of relation "admin_users" already exists
2026-01-29T16:02:51.109Z ➕ Agregando columna faltante: password_hash
2026-01-29T16:02:51.109Z ⚠️ No se pudo agregar columna password_hash: column "password_hash" of relation "admin_users" already exists
2026-01-29T16:02:51.109Z ➕ Agregando columna faltante: permissions
2026-01-29T16:02:51.110Z ⚠️ No se pudo agregar columna permissions: column "permissions" of relation "admin_users" already exists
2026-01-29T16:02:51.110Z ➕ Agregando columna faltante: is_active
2026-01-29T16:02:51.111Z ⚠️ No se pudo agregar columna is_active: column "is_active" of relation "admin_users" already exists
2026-01-29T16:02:51.111Z ➕ Agregando columna faltante: last_login
2026-01-29T16:02:51.112Z ⚠️ No se pudo agregar columna last_login: column "last_login" of relation "admin_users" already exists
2026-01-29T16:02:51.112Z ➕ Agregando columna faltante: last_activity
2026-01-29T16:02:51.113Z ⚠️ No se pudo agregar columna last_activity: column "last_activity" of relation "admin_users" already exists
2026-01-29T16:02:51.113Z ➕ Agregando columna faltante: ip_address
2026-01-29T16:02:51.114Z ⚠️ No se pudo agregar columna ip_address: column "ip_address" of relation "admin_users" already exists
2026-01-29T16:02:51.114Z ➕ Agregando columna faltante: user_agent
2026-01-29T16:02:51.114Z ⚠️ No se pudo agregar columna user_agent: column "user_agent" of relation "admin_users" already exists
2026-01-29T16:02:51.114Z ➕ Agregando columna faltante: updated_at
2026-01-29T16:02:51.115Z ⚠️ No se pudo agregar columna updated_at: column "updated_at" of relation "admin_users" already exists
2026-01-29T16:02:51.118Z ✅ Constraint de rol actualizado
2026-01-29T16:02:51.118Z 🔄 Verificando usuarios existentes...
2026-01-29T16:02:51.119Z ✅ Todos los usuarios ya están actualizados
2026-01-29T16:02:51.119Z ✅ Columnas de admin_users verificadas
2026-01-29T16:02:51.122Z ✅ Tabla user_permissions verificada
2026-01-29T16:02:51.123Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T16:02:51.123Z ✅ Tabla users verificada
2026-01-29T16:02:51.123Z ✅ Tabla audit_log verificada
2026-01-29T16:02:51.126Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T16:02:51.127Z ✅ Tabla pedido_comments creada
2026-01-29T16:02:51.127Z ✅ Tabla vendedores creada
2026-01-29T16:02:51.129Z ✅ Índices verificados
2026-01-29T16:02:51.133Z ✅ Triggers configurados
2026-01-29T16:02:51.137Z ✅ Columna vendedor_id verificada/creada
2026-01-29T16:02:51.137Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-29T16:02:51.137Z ✅ Tablas recreadas exitosamente
2026-01-29T16:02:51.137Z 📨 [1] GET /api/pedidos - User: 596c57dc-28d8-48fc-85f0-7398abd3adac - 2026-01-29T16:02:51.137Z
2026-01-29T16:02:51.155Z 📊 [2026-01-29T16:02:51.155Z] GET /api/pedidos (LEGACY) - Total: 74 pedidos
2026-01-29T16:02:51.292Z 📨 [2] GET /api/audit - User: 596c57dc-28d8-48fc-85f0-7398abd3adac - 2026-01-29T16:02:51.291Z
2026-01-29T16:02:51.298Z 📨 [3] GET /api/notifications - User: 596c57dc-28d8-48fc-85f0-7398abd3adac - 2026-01-29T16:02:51.298Z
2026-01-29T16:02:51.312Z 📨 [4] GET /api/vendedores - User: 596c57dc-28d8-48fc-85f0-7398abd3adac - 2026-01-29T16:02:51.312Z
2026-01-29T16:02:51.317Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 596c57dc-28d8-48fc-85f0-7398abd3adac
2026-01-29T16:02:51.317Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T16:02:51.320Z 📨 [5] GET /api/clientes/simple - User: 596c57dc-28d8-48fc-85f0-7398abd3adac - 2026-01-29T16:02:51.317Z
2026-01-29T16:02:51.320Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 596c57dc-28d8-48fc-85f0-7398abd3adac
2026-01-29T16:02:51.320Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T16:02:51.323Z 📨 [6] GET /api/notifications - User: 596c57dc-28d8-48fc-85f0-7398abd3adac - 2026-01-29T16:02:51.321Z
2026-01-29T16:02:51.333Z Error in GET /api/vendedores: error: operator does not exist: uuid = integer
2026-01-29T16:02:51.333Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T16:02:51.333Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T16:02:51.333Z at async PostgreSQLClient.getAllVendedores (/app/backend/postgres-client.js:2655:28)
2026-01-29T16:02:51.333Z at async /app/backend/index.js:4200:28 {
2026-01-29T16:02:51.333Z length: 200,
2026-01-29T16:02:51.333Z severity: 'ERROR',
2026-01-29T16:02:51.333Z code: '42883',
2026-01-29T16:02:51.333Z detail: undefined,
2026-01-29T16:02:51.333Z hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
2026-01-29T16:02:51.333Z position: '924',
2026-01-29T16:02:51.333Z internalPosition: undefined,
2026-01-29T16:02:51.333Z internalQuery: undefined,
2026-01-29T16:02:51.333Z where: undefined,
2026-01-29T16:02:51.333Z schema: undefined,
2026-01-29T16:02:51.333Z table: undefined,
2026-01-29T16:02:51.333Z column: undefined,
2026-01-29T16:02:51.333Z dataType: undefined,
2026-01-29T16:02:51.333Z constraint: undefined,
2026-01-29T16:02:51.333Z file: 'parse_oper.c',
2026-01-29T16:02:51.333Z line: '647',
2026-01-29T16:02:51.333Z routine: 'op_error'
2026-01-29T16:02:51.333Z }
2026-01-29T16:02:51.366Z 🔗 Nueva conexión al pool establecida
2026-01-29T16:02:51.367Z 🔗 Nueva conexión al pool establecida
2026-01-29T16:02:51.369Z Error in GET /api/clientes/simple: error: operator does not exist: uuid = character varying
2026-01-29T16:02:51.369Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T16:02:51.369Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T16:02:51.369Z at async PostgreSQLClient.getAllClientesSimple (/app/backend/postgres-client.js:2292:28)
2026-01-29T16:02:51.369Z at async /app/backend/index.js:3950:26 {
2026-01-29T16:02:51.369Z length: 210,
2026-01-29T16:02:51.369Z severity: 'ERROR',
2026-01-29T16:02:51.369Z code: '42883',
2026-01-29T16:02:51.369Z detail: undefined,
2026-01-29T16:02:51.369Z hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',
2026-01-29T16:02:51.369Z position: '680',
2026-01-29T16:02:51.369Z internalPosition: undefined,
2026-01-29T16:02:51.372Z internalQuery: undefined,
2026-01-29T16:02:51.372Z where: undefined,
2026-01-29T16:02:51.372Z schema: undefined,
2026-01-29T16:02:51.372Z table: undefined,
2026-01-29T16:02:51.372Z column: undefined,
2026-01-29T16:02:51.372Z dataType: undefined,
2026-01-29T16:02:51.372Z constraint: undefined,
2026-01-29T16:02:51.372Z file: 'parse_oper.c',
2026-01-29T16:02:51.372Z line: '647',
2026-01-29T16:02:51.372Z routine: 'op_error'
2026-01-29T16:02:51.372Z }
2026-01-29T16:02:51.378Z 🔗 Nueva conexión al pool establecida