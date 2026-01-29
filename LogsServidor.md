2026-01-29T17:14:54.412Z position: '39',
2026-01-29T17:14:54.412Z internalPosition: undefined,
2026-01-29T17:14:54.412Z internalQuery: undefined,
2026-01-29T17:14:54.412Z where: undefined,
2026-01-29T17:14:54.412Z schema: undefined,
2026-01-29T17:14:54.412Z table: undefined,
2026-01-29T17:14:54.412Z column: undefined,
2026-01-29T17:14:54.412Z dataType: undefined,
2026-01-29T17:14:54.412Z constraint: undefined,
2026-01-29T17:14:54.412Z file: 'scan.l',
2026-01-29T17:14:54.412Z line: '1188',
2026-01-29T17:14:54.412Z routine: 'scanner_yyerror'
2026-01-29T17:14:54.412Z }
2026-01-29T17:14:55.380Z 📨 [33] POST /api/pedidos - User: 8a3b546c-9e62-4eb0-89c2-eb694f38be9b - 2026-01-29T17:14:55.379Z
2026-01-29T17:14:55.380Z 🔐 requirePermission middleware
2026-01-29T17:14:55.381Z - Ruta: POST /api/pedidos
2026-01-29T17:14:55.381Z - Permiso requerido: pedidos.create
2026-01-29T17:14:55.381Z - Usuario: 8a3b546c-9e62-4eb0-89c2-eb694f38be9b (ADMIN)
2026-01-29T17:14:55.381Z - Headers: {
2026-01-29T17:14:55.381Z userId: '8a3b546c-9e62-4eb0-89c2-eb694f38be9b',
2026-01-29T17:14:55.381Z userRole: 'Administrador'
2026-01-29T17:14:55.381Z }
2026-01-29T17:14:55.381Z - Permisos a verificar (incluyendo aliases): [ 'pedidos.create', 'vista.pedidos' ]
2026-01-29T17:14:55.381Z - Verificando permiso en BD...
2026-01-29T17:14:55.381Z 🔍 Verificando permiso 'pedidos.create' para usuario ID: 8a3b546c-9e62-4eb0-89c2-eb694f38be9b
2026-01-29T17:14:55.381Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T17:14:55.381Z - ✅ Usuario tiene permiso: pedidos.create
2026-01-29T17:14:55.382Z - Resultado: ✅ PERMITIDO
2026-01-29T17:14:55.382Z ✅ Permiso concedido - continuando con la request
2026-01-29T17:14:55.382Z 📦 Creando nuevo pedido:
2026-01-29T17:14:55.382Z - Cliente: VEGAPAS
2026-01-29T17:14:55.382Z - ClienteId: 253a032c-8e4b-44b8-9fef-9e71c3753651
2026-01-29T17:14:55.382Z - ID Pedido: 1769706895347
2026-01-29T17:14:55.396Z Error creating pedido: error: syntax error at or near ")"
2026-01-29T17:14:55.396Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T17:14:55.396Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T17:14:55.396Z at async PostgreSQLClient.create (/app/backend/postgres-client.js:1185:13)
2026-01-29T17:14:55.397Z at async /app/backend/index.js:2762:9 {
2026-01-29T17:14:55.397Z length: 90,
2026-01-29T17:14:55.397Z severity: 'ERROR',
2026-01-29T17:14:55.397Z code: '42601',
2026-01-29T17:14:55.397Z detail: undefined,
2026-01-29T17:14:55.397Z hint: undefined,
2026-01-29T17:14:55.397Z position: '39',
2026-01-29T17:14:55.397Z internalPosition: undefined,
2026-01-29T17:14:55.397Z internalQuery: undefined,
2026-01-29T17:14:55.397Z where: undefined,
2026-01-29T17:14:55.397Z schema: undefined,
2026-01-29T17:14:55.397Z table: undefined,
2026-01-29T17:14:55.397Z column: undefined,
2026-01-29T17:14:55.397Z dataType: undefined,
2026-01-29T17:14:55.397Z constraint: undefined,
2026-01-29T17:14:55.397Z file: 'scan.l',
2026-01-29T17:14:55.397Z line: '1188',
2026-01-29T17:14:55.397Z routine: 'scanner_yyerror'
2026-01-29T17:14:55.397Z }
2026-01-29T17:14:55.539Z 📨 [34] POST /api/pedidos - User: 8a3b546c-9e62-4eb0-89c2-eb694f38be9b - 2026-01-29T17:14:55.538Z
2026-01-29T17:14:55.539Z 🔐 requirePermission middleware
2026-01-29T17:14:55.539Z - Ruta: POST /api/pedidos
2026-01-29T17:14:55.539Z - Permiso requerido: pedidos.create
2026-01-29T17:14:55.540Z - Usuario: 8a3b546c-9e62-4eb0-89c2-eb694f38be9b (ADMIN)
2026-01-29T17:14:55.541Z - Headers: {
2026-01-29T17:14:55.541Z userId: '8a3b546c-9e62-4eb0-89c2-eb694f38be9b',
2026-01-29T17:14:55.541Z userRole: 'Administrador'
2026-01-29T17:14:55.541Z }
2026-01-29T17:14:55.541Z - Permisos a verificar (incluyendo aliases): [ 'pedidos.create', 'vista.pedidos' ]
2026-01-29T17:14:55.541Z - Verificando permiso en BD...
2026-01-29T17:14:55.541Z 🔍 Verificando permiso 'pedidos.create' para usuario ID: 8a3b546c-9e62-4eb0-89c2-eb694f38be9b
2026-01-29T17:14:55.541Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T17:14:55.541Z - ✅ Usuario tiene permiso: pedidos.create
2026-01-29T17:14:55.541Z - Resultado: ✅ PERMITIDO
2026-01-29T17:14:55.541Z ✅ Permiso concedido - continuando con la request
2026-01-29T17:14:55.542Z 📦 Creando nuevo pedido:
2026-01-29T17:14:55.542Z - Cliente: VEGAPAS
2026-01-29T17:14:55.542Z - ClienteId: 253a032c-8e4b-44b8-9fef-9e71c3753651
2026-01-29T17:14:55.542Z - ID Pedido: 1769706895507
2026-01-29T17:14:55.553Z Error creating pedido: error: syntax error at or near ")"
2026-01-29T17:14:55.553Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T17:14:55.553Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T17:14:55.553Z at async PostgreSQLClient.create (/app/backend/postgres-client.js:1185:13)
2026-01-29T17:14:55.553Z at async /app/backend/index.js:2762:9 {
2026-01-29T17:14:55.553Z length: 90,
2026-01-29T17:14:55.553Z severity: 'ERROR',
2026-01-29T17:14:55.553Z code: '42601',
2026-01-29T17:14:55.553Z detail: undefined,
2026-01-29T17:14:55.553Z hint: undefined,
2026-01-29T17:14:55.553Z position: '39',
2026-01-29T17:14:55.553Z internalPosition: undefined,
2026-01-29T17:14:55.553Z internalQuery: undefined,
2026-01-29T17:14:55.553Z where: undefined,
2026-01-29T17:14:55.553Z schema: undefined,
2026-01-29T17:14:55.553Z table: undefined,
2026-01-29T17:14:55.553Z column: undefined,
2026-01-29T17:14:55.553Z dataType: undefined,
2026-01-29T17:14:55.553Z constraint: undefined,
2026-01-29T17:14:55.553Z file: 'scan.l',
2026-01-29T17:14:55.553Z line: '1188',
2026-01-29T17:14:55.553Z routine: 'scanner_yyerror'
2026-01-29T17:14:55.553Z }