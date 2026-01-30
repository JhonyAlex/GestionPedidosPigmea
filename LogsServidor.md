2026-01-30T00:15:12.549Z ⏭️  Migración 004-anonimo ya aplicada
2026-01-30T00:15:12.550Z ⏭️  Migración 005-fechas-cliche ya aplicada
2026-01-30T00:15:12.552Z ⏭️  Migración 006-horas-confirmadas ya aplicada
2026-01-30T00:15:12.553Z ⏭️  Migración 007-antivaho-realizado ya aplicada
2026-01-30T00:15:12.554Z ⏭️  Migración 008-menciones-comentarios ya aplicada
2026-01-30T00:15:12.555Z ⏭️  Migración 009-tablas-faltantes-v2 ya aplicada
2026-01-30T00:15:12.557Z ⏭️  Migración 010-tabla-instrucciones-analisis ya aplicada
2026-01-30T00:15:12.557Z ⏭️  Migración 011-tabla-observaciones-templates ya aplicada
2026-01-30T00:15:12.558Z ⏭️  Migración 012-columnas-direccion-clientes ya aplicada
2026-01-30T00:15:12.559Z ⏭️  Migración 013-columna-numero-pedido-cliente ya aplicada
2026-01-30T00:15:12.560Z ⏭️  Migración 014-tablas-materiales ya aplicada
2026-01-30T00:15:12.560Z 🔄 Aplicando migración: Crear tabla action_history...
2026-01-30T00:15:12.574Z ✅ Migración 015-tabla-action-history aplicada exitosamente
2026-01-30T00:15:12.575Z ✅ Proceso de migraciones completado. 1 migraciones procesadas.
2026-01-30T00:15:12.575Z ✅ Migraciones completadas exitosamente
2026-01-30T00:15:12.575Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-30T00:15:12.575Z 🔧 Iniciando creación/verificación de tablas...
2026-01-30T00:15:12.576Z ✅ Extensión uuid-ossp verificada
2026-01-30T00:15:12.581Z ✅ Tabla admin_users verificada
2026-01-30T00:15:12.594Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-30T00:15:12.597Z ✅ Constraint de rol actualizado
2026-01-30T00:15:12.598Z 🔄 Verificando usuarios existentes...
2026-01-30T00:15:12.598Z ✅ Todos los usuarios ya están actualizados
2026-01-30T00:15:12.599Z ✅ Columnas de admin_users verificadas
2026-01-30T00:15:12.603Z ✅ Tabla user_permissions verificada
2026-01-30T00:15:12.603Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-30T00:15:12.604Z ✅ Tabla users verificada
2026-01-30T00:15:12.604Z ✅ Tabla audit_log verificada
2026-01-30T00:15:12.609Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-30T00:15:12.610Z ✅ Tabla pedido_comments creada
2026-01-30T00:15:12.611Z ✅ Tabla vendedores creada
2026-01-30T00:15:12.616Z ✅ Índices verificados
2026-01-30T00:15:12.625Z ✅ Triggers configurados
2026-01-30T00:15:12.636Z ✅ Columna vendedor_id verificada/creada
2026-01-30T00:15:12.636Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-30T00:15:12.641Z 🚀 Servidor iniciado en puerto 3001
2026-01-30T00:15:12.641Z ✅ PostgreSQL conectado - Sistema operativo
2026-01-30T00:17:32.513Z 📨 [1] GET /api/audit - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:17:32.511Z
2026-01-30T00:17:32.519Z 📨 [2] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:17:32.519Z
2026-01-30T00:17:32.521Z 📨 [3] GET /api/pedidos - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:17:32.520Z
2026-01-30T00:17:32.538Z 📊 [2026-01-30T00:17:32.538Z] GET /api/pedidos (LEGACY) - Total: 1 pedidos
2026-01-30T00:17:32.554Z 📨 [4] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:17:32.553Z
2026-01-30T00:17:32.561Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:17:32.563Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:17:32.565Z 📨 [5] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:17:32.563Z
2026-01-30T00:17:32.569Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:17:32.569Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:17:32.579Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:17:32.588Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:17:32.604Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:17:32.610Z 📊 [getAllClientesSimple] Total clientes encontrados: 0
2026-01-30T00:17:32.666Z 📨 [6] GET /api/materiales - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:17:32.666Z
2026-01-30T00:17:32.684Z ❌ Error al obtener materiales: error: relation "materiales" does not exist
2026-01-30T00:17:32.684Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-30T00:17:32.684Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:17:32.684Z at async PostgreSQLClient.getAllMateriales (/app/backend/postgres-client.js:3753:28)
2026-01-30T00:17:32.684Z at async /app/backend/index.js:4471:28 {
2026-01-30T00:17:32.684Z length: 110,
2026-01-30T00:17:32.684Z severity: 'ERROR',
2026-01-30T00:17:32.684Z code: '42P01',
2026-01-30T00:17:32.684Z detail: undefined,
2026-01-30T00:17:32.684Z hint: undefined,
2026-01-30T00:17:32.684Z position: '347',
2026-01-30T00:17:32.684Z internalPosition: undefined,
2026-01-30T00:17:32.684Z internalQuery: undefined,
2026-01-30T00:17:32.684Z where: undefined,
2026-01-30T00:17:32.684Z schema: undefined,
2026-01-30T00:17:32.684Z table: undefined,
2026-01-30T00:17:32.685Z column: undefined,
2026-01-30T00:17:32.685Z dataType: undefined,
2026-01-30T00:17:32.685Z constraint: undefined,
2026-01-30T00:17:32.685Z file: 'parse_relation.c',
2026-01-30T00:17:32.685Z line: '1392',
2026-01-30T00:17:32.685Z routine: 'parserOpenTable'
2026-01-30T00:17:32.685Z }
2026-01-30T00:17:32.685Z Error in GET /api/materiales: error: relation "materiales" does not exist
2026-01-30T00:17:32.685Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-30T00:17:32.685Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:17:32.685Z at async PostgreSQLClient.getAllMateriales (/app/backend/postgres-client.js:3753:28)
2026-01-30T00:17:32.685Z at async /app/backend/index.js:4471:28 {
2026-01-30T00:17:32.686Z length: 110,
2026-01-30T00:17:32.686Z severity: 'ERROR',
2026-01-30T00:17:32.686Z code: '42P01',
2026-01-30T00:17:32.686Z detail: undefined,
2026-01-30T00:17:32.686Z hint: undefined,
2026-01-30T00:17:32.686Z position: '347',
2026-01-30T00:17:32.686Z internalPosition: undefined,
2026-01-30T00:17:32.686Z internalQuery: undefined,
2026-01-30T00:17:32.686Z where: undefined,
2026-01-30T00:17:32.686Z schema: undefined,
2026-01-30T00:17:32.686Z table: undefined,
2026-01-30T00:17:32.686Z column: undefined,
2026-01-30T00:17:32.686Z dataType: undefined,
2026-01-30T00:17:32.686Z constraint: undefined,
2026-01-30T00:17:32.686Z file: 'parse_relation.c',
2026-01-30T00:17:32.686Z line: '1392',
2026-01-30T00:17:32.686Z routine: 'parserOpenTable'
2026-01-30T00:17:32.686Z }
2026-01-30T00:17:32.688Z 📨 [7] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:17:32.687Z