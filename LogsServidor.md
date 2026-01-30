2026-01-30T00:10:06.215Z where: undefined,
2026-01-30T00:10:06.215Z schema: undefined,
2026-01-30T00:10:06.215Z table: undefined,
2026-01-30T00:10:06.215Z column: undefined,
2026-01-30T00:10:06.215Z dataType: undefined,
2026-01-30T00:10:06.215Z constraint: undefined,
2026-01-30T00:10:06.215Z file: 'analyze.c',
2026-01-30T00:10:06.215Z line: '2515',
2026-01-30T00:10:06.215Z routine: 'transformUpdateTargetList'
2026-01-30T00:10:06.215Z }
2026-01-30T00:10:07.280Z 🔒 Pedido 1769731617434 bloqueado por Jhony Admin (b24fa21c-f2b2-4034-b10c-c0e65c09019e)
2026-01-30T00:10:07.283Z 📨 [16] GET /api/comments/1769731617434 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:07.283Z
2026-01-30T00:10:07.288Z 📨 [17] GET /api/users/active - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:07.288Z
2026-01-30T00:10:07.291Z 📨 [18] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:07.289Z
2026-01-30T00:10:07.291Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:10:07.291Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:10:07.293Z 📨 [19] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:07.291Z
2026-01-30T00:10:07.293Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:10:07.293Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:10:07.336Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:10:07.344Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:10:07.345Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:10:07.351Z 📊 [getAllClientesSimple] Total clientes encontrados: 0
2026-01-30T00:10:12.983Z 🔓 Pedido 1769731617434 desbloqueado por Jhony Admin
2026-01-30T00:10:13.784Z 🔒 Pedido 1769731617434 bloqueado por Jhony Admin (b24fa21c-f2b2-4034-b10c-c0e65c09019e)
2026-01-30T00:10:13.790Z 📨 [20] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:13.790Z
2026-01-30T00:10:13.792Z 📨 [21] GET /api/comments/1769731617434 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:13.792Z
2026-01-30T00:10:13.793Z 📨 [22] GET /api/users/active - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:13.793Z
2026-01-30T00:10:13.794Z 📨 [23] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:10:13.794Z
2026-01-30T00:10:13.796Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:10:13.796Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:10:13.800Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:10:13.800Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:10:13.800Z 📊 [getAllClientesSimple] Total clientes encontrados: 0
2026-01-30T00:11:11.092Z 📨 [24] POST /api/action-history - User: anonymous - 2026-01-30T00:11:11.091Z
2026-01-30T00:11:11.097Z Error al guardar historial: error: relation "action_history" does not exist
2026-01-30T00:11:11.098Z at /app/backend/node_modules/pg-pool/index.js:45:11
2026-01-30T00:11:11.098Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:11:11.098Z at async /app/backend/index.js:3873:24 {
2026-01-30T00:11:11.098Z length: 113,
2026-01-30T00:11:11.098Z severity: 'ERROR',
2026-01-30T00:11:11.098Z code: '42P01',
2026-01-30T00:11:11.098Z detail: undefined,
2026-01-30T00:11:11.098Z hint: undefined,
2026-01-30T00:11:11.098Z position: '26',
2026-01-30T00:11:11.098Z internalPosition: undefined,
2026-01-30T00:11:11.098Z internalQuery: undefined,
2026-01-30T00:11:11.098Z where: undefined,
2026-01-30T00:11:11.098Z schema: undefined,
2026-01-30T00:11:11.098Z table: undefined,
2026-01-30T00:11:11.098Z column: undefined,
2026-01-30T00:11:11.098Z dataType: undefined,
2026-01-30T00:11:11.098Z constraint: undefined,
2026-01-30T00:11:11.098Z file: 'parse_relation.c',
2026-01-30T00:11:11.098Z line: '1392',
2026-01-30T00:11:11.098Z routine: 'parserOpenTable'
2026-01-30T00:11:11.098Z }
2026-01-30T00:11:11.170Z 🔓 Pedido 1769731617434 desbloqueado por Jhony Admin
2026-01-30T00:11:11.173Z 📨 [25] PUT /api/pedidos/1769731617434 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:11:11.172Z
2026-01-30T00:11:11.197Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:11:11.202Z 🔐 requirePermission middleware
2026-01-30T00:11:11.203Z - Ruta: PUT /api/pedidos/1769731617434
2026-01-30T00:11:11.203Z - Permiso requerido: pedidos.edit
2026-01-30T00:11:11.204Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-30T00:11:11.204Z - Headers: {
2026-01-30T00:11:11.204Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-30T00:11:11.204Z userRole: 'Administrador'
2026-01-30T00:11:11.204Z }
2026-01-30T00:11:11.204Z - Permisos a verificar (incluyendo aliases): [ 'pedidos.edit', 'vista.pedidos' ]
2026-01-30T00:11:11.207Z - Verificando permiso en BD...
2026-01-30T00:11:11.207Z 🔍 Verificando permiso 'pedidos.edit' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:11:11.207Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:11:11.207Z - ✅ Usuario tiene permiso: pedidos.edit
2026-01-30T00:11:11.207Z - Resultado: ✅ PERMITIDO
2026-01-30T00:11:11.207Z ✅ Permiso concedido - continuando con la request
2026-01-30T00:11:11.234Z 🔄 Actualizando pedido 1769731617434 con columnas disponibles: nueva_fecha_entrega=true, numeros_compra=true, vendedor=true, cliche_info=false, anonimo=true
2026-01-30T00:11:11.237Z Error updating pedido 1769731617434: error: column "fecha_pedido" of relation "pedidos" does not exist
2026-01-30T00:11:11.237Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-30T00:11:11.237Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:11:11.237Z at async PostgreSQLClient.update (/app/backend/postgres-client.js:1424:28)
2026-01-30T00:11:11.237Z at async /app/backend/index.js:2883:9 {
2026-01-30T00:11:11.237Z length: 135,
2026-01-30T00:11:11.237Z severity: 'ERROR',
2026-01-30T00:11:11.237Z code: '42703',
2026-01-30T00:11:11.237Z detail: undefined,
2026-01-30T00:11:11.237Z hint: undefined,
2026-01-30T00:11:11.237Z position: '107',
2026-01-30T00:11:11.238Z internalPosition: undefined,
2026-01-30T00:11:11.238Z internalQuery: undefined,
2026-01-30T00:11:11.238Z where: undefined,
2026-01-30T00:11:11.238Z schema: undefined,
2026-01-30T00:11:11.238Z table: undefined,
2026-01-30T00:11:11.238Z column: undefined,
2026-01-30T00:11:11.238Z dataType: undefined,
2026-01-30T00:11:11.238Z constraint: undefined,
2026-01-30T00:11:11.238Z file: 'analyze.c',
2026-01-30T00:11:11.238Z line: '2515',
2026-01-30T00:11:11.238Z routine: 'transformUpdateTargetList'
2026-01-30T00:11:11.238Z }