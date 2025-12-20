2025-12-20T23:42:17.390Z at async /app/backend/index.js:2900:28 {
2025-12-20T23:42:17.390Z length: 120,
2025-12-20T23:42:17.390Z severity: 'ERROR',
2025-12-20T23:42:17.390Z code: '42804',
2025-12-20T23:42:17.390Z detail: undefined,
2025-12-20T23:42:17.390Z hint: undefined,
2025-12-20T23:42:17.390Z position: '67',
2025-12-20T23:42:17.390Z internalPosition: undefined,
2025-12-20T23:42:17.390Z internalQuery: undefined,
2025-12-20T23:42:17.390Z where: undefined,
2025-12-20T23:42:17.390Z schema: undefined,
2025-12-20T23:42:17.390Z table: undefined,
2025-12-20T23:42:17.390Z column: undefined,
2025-12-20T23:42:17.390Z dataType: undefined,
2025-12-20T23:42:17.390Z constraint: undefined,
2025-12-20T23:42:17.390Z file: 'parse_coerce.c',
2025-12-20T23:42:17.390Z line: '1416',
2025-12-20T23:42:17.390Z routine: 'select_common_type'
2025-12-20T23:42:17.390Z }
2025-12-20T23:42:34.718Z 📨 [11] GET /api/pedidos - User: 4 - 2025-12-20T23:42:34.717Z
2025-12-20T23:42:34.756Z 📊 [2025-12-20T23:42:34.756Z] GET /api/pedidos (LEGACY) - Total: 213 pedidos
2025-12-20T23:42:34.783Z 📨 [12] GET /api/audit - User: 4 - 2025-12-20T23:42:34.782Z
2025-12-20T23:42:35.217Z 📨 [14] GET /api/materiales - User: 4 - 2025-12-20T23:42:35.217Z
2025-12-20T23:42:35.231Z ✅ Materiales obtenidos: 175
2025-12-20T23:42:43.538Z 📨 [15] GET /api/clientes/simple - User: 4 - 2025-12-20T23:42:43.538Z
2025-12-20T23:42:43.540Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 4
2025-12-20T23:42:43.540Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2025-12-20T23:42:43.542Z 📊 [getAllClientesSimple] Clientes activos encontrados: 55
2025-12-20T23:42:43.729Z 📨 [16] GET /api/clientes/stats/batch - User: 4 - 2025-12-20T23:42:43.729Z
2025-12-20T23:42:43.730Z 🔐 requirePermission middleware
2025-12-20T23:42:43.730Z - Ruta: GET /api/clientes/stats/batch
2025-12-20T23:42:43.730Z - Permiso requerido: clientes.view
2025-12-20T23:42:43.730Z - Usuario: 4 (ADMIN)
2025-12-20T23:42:43.731Z - Headers: { userId: '4', userRole: 'Administrador' }
2025-12-20T23:42:43.731Z - Verificando permiso en BD...
2025-12-20T23:42:43.731Z 🔍 Verificando permiso 'clientes.view' para usuario ID: 4
2025-12-20T23:42:43.731Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2025-12-20T23:42:43.731Z - Resultado: ✅ PERMITIDO
2025-12-20T23:42:43.731Z ✅ Permiso concedido - continuando con la request
2025-12-20T23:42:43.736Z Error in GET /api/clientes/stats/batch: error: COALESCE types uuid and text cannot be matched
2025-12-20T23:42:43.736Z at /app/backend/node_modules/pg/lib/client.js:545:17
2025-12-20T23:42:43.736Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2025-12-20T23:42:43.736Z at async PostgreSQLClient.getClientesEstadisticasBatch (/app/backend/postgres-client.js:2221:28)
2025-12-20T23:42:43.736Z at async /app/backend/index.js:2900:28 {
2025-12-20T23:42:43.736Z length: 120,
2025-12-20T23:42:43.736Z severity: 'ERROR',
2025-12-20T23:42:43.736Z code: '42804',
2025-12-20T23:42:43.736Z detail: undefined,
2025-12-20T23:42:43.736Z hint: undefined,
2025-12-20T23:42:43.736Z position: '67',
2025-12-20T23:42:43.736Z internalPosition: undefined,
2025-12-20T23:42:43.736Z internalQuery: undefined,
2025-12-20T23:42:43.736Z where: undefined,
2025-12-20T23:42:43.736Z schema: undefined,
2025-12-20T23:42:43.736Z table: undefined,
2025-12-20T23:42:43.736Z column: undefined,
2025-12-20T23:42:43.736Z dataType: undefined,
2025-12-20T23:42:43.736Z constraint: undefined,
2025-12-20T23:42:43.736Z file: 'parse_coerce.c',
2025-12-20T23:42:43.736Z line: '1416',
2025-12-20T23:42:43.736Z routine: 'select_common_type'
2025-12-20T23:42:43.736Z }
2025-12-20T23:43:01.514Z 📨 [17] GET /api/vendedores - User: 4 - 2025-12-20T23:43:01.514Z
2025-12-20T23:43:01.516Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 4
2025-12-20T23:43:01.516Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2025-12-20T23:43:01.602Z 📨 [18] GET /api/vendedores/stats/batch - User: 4 - 2025-12-20T23:43:01.602Z
2025-12-20T23:43:01.603Z 🔐 requirePermission middleware
2025-12-20T23:43:01.604Z - Ruta: GET /api/vendedores/stats/batch
2025-12-20T23:43:01.604Z - Permiso requerido: vendedores.view
2025-12-20T23:43:01.604Z - Usuario: 4 (ADMIN)
2025-12-20T23:43:01.604Z - Headers: { userId: '4', userRole: 'Administrador' }
2025-12-20T23:43:01.604Z - Verificando permiso en BD...
2025-12-20T23:43:01.604Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: 4
2025-12-20T23:43:01.604Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2025-12-20T23:43:01.604Z - Resultado: ✅ PERMITIDO
2025-12-20T23:43:01.604Z ✅ Permiso concedido - continuando con la request
2025-12-20T23:43:01.609Z Error in GET /api/vendedores/stats/batch: error: COALESCE types uuid and text cannot be matched
2025-12-20T23:43:01.609Z at /app/backend/node_modules/pg/lib/client.js:545:17
2025-12-20T23:43:01.609Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2025-12-20T23:43:01.609Z at async PostgreSQLClient.getVendedoresEstadisticasBatch (/app/backend/postgres-client.js:2632:28)
2025-12-20T23:43:01.609Z at async /app/backend/index.js:3293:28 {
2025-12-20T23:43:01.609Z length: 120,
2025-12-20T23:43:01.609Z severity: 'ERROR',
2025-12-20T23:43:01.609Z code: '42804',
2025-12-20T23:43:01.609Z detail: undefined,
2025-12-20T23:43:01.609Z hint: undefined,
2025-12-20T23:43:01.609Z position: '68',
2025-12-20T23:43:01.609Z internalPosition: undefined,
2025-12-20T23:43:01.609Z internalQuery: undefined,
2025-12-20T23:43:01.609Z where: undefined,
2025-12-20T23:43:01.609Z schema: undefined,
2025-12-20T23:43:01.609Z table: undefined,
2025-12-20T23:43:01.609Z column: undefined,
2025-12-20T23:43:01.609Z dataType: undefined,
2025-12-20T23:43:01.609Z constraint: undefined,
2025-12-20T23:43:01.609Z file: 'parse_coerce.c',
2025-12-20T23:43:01.609Z line: '1416',
2025-12-20T23:43:01.609Z routine: 'select_common_type'
2025-12-20T23:43:01.609Z }