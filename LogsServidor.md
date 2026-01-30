2026-01-30T00:07:07.166Z severity: 'ERROR',
2026-01-30T00:07:07.166Z code: '42P01',
2026-01-30T00:07:07.166Z detail: undefined,
2026-01-30T00:07:07.166Z hint: undefined,
2026-01-30T00:07:07.166Z position: '409',
2026-01-30T00:07:07.166Z internalPosition: undefined,
2026-01-30T00:07:07.166Z internalQuery: undefined,
2026-01-30T00:07:07.166Z where: undefined,
2026-01-30T00:07:07.166Z schema: undefined,
2026-01-30T00:07:07.166Z table: undefined,
2026-01-30T00:07:07.166Z column: undefined,
2026-01-30T00:07:07.166Z dataType: undefined,
2026-01-30T00:07:07.166Z constraint: undefined,
2026-01-30T00:07:07.166Z file: 'parse_relation.c',
2026-01-30T00:07:07.166Z line: '1392',
2026-01-30T00:07:07.166Z routine: 'parserOpenTable'
2026-01-30T00:07:07.166Z }
2026-01-30T00:07:07.166Z Error in GET /api/pedidos/1769731617434/materiales: error: relation "materiales" does not exist
2026-01-30T00:07:07.166Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-30T00:07:07.166Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:07:07.166Z at async PostgreSQLClient.getMaterialesByPedidoId (/app/backend/postgres-client.js:3989:28)
2026-01-30T00:07:07.166Z at async /app/backend/index.js:4592:28 {
2026-01-30T00:07:07.166Z length: 110,
2026-01-30T00:07:07.166Z severity: 'ERROR',
2026-01-30T00:07:07.166Z code: '42P01',
2026-01-30T00:07:07.166Z detail: undefined,
2026-01-30T00:07:07.166Z hint: undefined,
2026-01-30T00:07:07.166Z position: '409',
2026-01-30T00:07:07.166Z internalPosition: undefined,
2026-01-30T00:07:07.166Z internalQuery: undefined,
2026-01-30T00:07:07.166Z where: undefined,
2026-01-30T00:07:07.166Z schema: undefined,
2026-01-30T00:07:07.166Z table: undefined,
2026-01-30T00:07:07.166Z column: undefined,
2026-01-30T00:07:07.166Z dataType: undefined,
2026-01-30T00:07:07.166Z constraint: undefined,
2026-01-30T00:07:07.166Z file: 'parse_relation.c',
2026-01-30T00:07:07.166Z line: '1392',
2026-01-30T00:07:07.166Z routine: 'parserOpenTable'
2026-01-30T00:07:07.166Z }
2026-01-30T00:07:10.016Z 🔓 Pedido 1769731617434 desbloqueado por Jhony Admin
2026-01-30T00:07:10.900Z 📨 [18] GET /api/comments/1769731617434 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:07:10.900Z
2026-01-30T00:07:10.903Z 📨 [19] GET /api/users/active - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:07:10.902Z
2026-01-30T00:07:10.912Z 🔒 Pedido 1769731617434 bloqueado por Jhony Admin (b24fa21c-f2b2-4034-b10c-c0e65c09019e)
2026-01-30T00:07:10.915Z 📨 [20] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:07:10.912Z
2026-01-30T00:07:10.916Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:07:10.916Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:07:10.919Z 📨 [21] GET /api/pedidos/1769731617434/materiales - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:07:10.916Z
2026-01-30T00:07:10.919Z 📨 [22] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:07:10.917Z
2026-01-30T00:07:10.919Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:07:10.919Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:07:10.925Z ❌ Error al obtener materiales del pedido 1769731617434: error: relation "materiales" does not exist
2026-01-30T00:07:10.926Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-30T00:07:10.926Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:07:10.926Z at async PostgreSQLClient.getMaterialesByPedidoId (/app/backend/postgres-client.js:3989:28)
2026-01-30T00:07:10.926Z at async /app/backend/index.js:4592:28 {
2026-01-30T00:07:10.926Z length: 110,
2026-01-30T00:07:10.926Z severity: 'ERROR',
2026-01-30T00:07:10.926Z code: '42P01',
2026-01-30T00:07:10.926Z detail: undefined,
2026-01-30T00:07:10.926Z hint: undefined,
2026-01-30T00:07:10.926Z position: '409',
2026-01-30T00:07:10.926Z internalPosition: undefined,
2026-01-30T00:07:10.926Z internalQuery: undefined,
2026-01-30T00:07:10.926Z where: undefined,
2026-01-30T00:07:10.926Z schema: undefined,
2026-01-30T00:07:10.926Z table: undefined,
2026-01-30T00:07:10.926Z column: undefined,
2026-01-30T00:07:10.926Z dataType: undefined,
2026-01-30T00:07:10.926Z constraint: undefined,
2026-01-30T00:07:10.926Z file: 'parse_relation.c',
2026-01-30T00:07:10.926Z line: '1392',
2026-01-30T00:07:10.926Z routine: 'parserOpenTable'
2026-01-30T00:07:10.926Z }
2026-01-30T00:07:10.926Z Error in GET /api/pedidos/1769731617434/materiales: error: relation "materiales" does not exist
2026-01-30T00:07:10.926Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-30T00:07:10.926Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:07:10.926Z at async PostgreSQLClient.getMaterialesByPedidoId (/app/backend/postgres-client.js:3989:28)
2026-01-30T00:07:10.926Z at async /app/backend/index.js:4592:28 {
2026-01-30T00:07:10.926Z length: 110,
2026-01-30T00:07:10.926Z severity: 'ERROR',
2026-01-30T00:07:10.926Z code: '42P01',
2026-01-30T00:07:10.926Z detail: undefined,
2026-01-30T00:07:10.926Z hint: undefined,
2026-01-30T00:07:10.926Z position: '409',
2026-01-30T00:07:10.926Z internalPosition: undefined,
2026-01-30T00:07:10.926Z internalQuery: undefined,
2026-01-30T00:07:10.926Z where: undefined,
2026-01-30T00:07:10.926Z schema: undefined,
2026-01-30T00:07:10.926Z table: undefined,
2026-01-30T00:07:10.926Z column: undefined,
2026-01-30T00:07:10.926Z dataType: undefined,
2026-01-30T00:07:10.926Z constraint: undefined,
2026-01-30T00:07:10.926Z file: 'parse_relation.c',
2026-01-30T00:07:10.926Z line: '1392',
2026-01-30T00:07:10.926Z routine: 'parserOpenTable'
2026-01-30T00:07:10.926Z }
2026-01-30T00:07:10.943Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:07:10.951Z 📊 [getAllClientesSimple] Total clientes encontrados: 0