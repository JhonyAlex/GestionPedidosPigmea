2026-01-29T22:40:39.104Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T22:40:39.104Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T22:40:39.104Z at async PostgreSQLClient.getNotifications (/app/backend/postgres-client.js:3526:28)
2026-01-29T22:40:39.104Z at async /app/backend/index.js:3345:31 {
2026-01-29T22:40:39.104Z length: 112,
2026-01-29T22:40:39.104Z severity: 'ERROR',
2026-01-29T22:40:39.104Z code: '42P01',
2026-01-29T22:40:39.104Z detail: undefined,
2026-01-29T22:40:39.104Z hint: undefined,
2026-01-29T22:40:39.104Z position: '36',
2026-01-29T22:40:39.104Z internalPosition: undefined,
2026-01-29T22:40:39.104Z internalQuery: undefined,
2026-01-29T22:40:39.104Z where: undefined,
2026-01-29T22:40:39.104Z schema: undefined,
2026-01-29T22:40:39.104Z table: undefined,
2026-01-29T22:40:39.104Z column: undefined,
2026-01-29T22:40:39.104Z dataType: undefined,
2026-01-29T22:40:39.104Z constraint: undefined,
2026-01-29T22:40:39.104Z file: 'parse_relation.c',
2026-01-29T22:40:39.104Z line: '1392',
2026-01-29T22:40:39.104Z routine: 'parserOpenTable'
2026-01-29T22:40:39.104Z }
2026-01-29T22:40:39.105Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:40:39.123Z 📨 [11] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:40:39.123Z
2026-01-29T22:40:39.126Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T22:40:39.127Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T22:40:39.127Z 📨 [12] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:40:39.125Z
2026-01-29T22:40:39.127Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T22:40:39.127Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T22:40:39.127Z Error in GET /api/clientes/simple: error: relation "limpio.clientes" does not exist
2026-01-29T22:40:39.128Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T22:40:39.128Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T22:40:39.128Z at async PostgreSQLClient.getAllClientesSimple (/app/backend/postgres-client.js:2309:28)
2026-01-29T22:40:39.128Z at async /app/backend/index.js:3982:26 {
2026-01-29T22:40:39.128Z length: 115,
2026-01-29T22:40:39.128Z severity: 'ERROR',
2026-01-29T22:40:39.128Z code: '42P01',
2026-01-29T22:40:39.128Z detail: undefined,
2026-01-29T22:40:39.128Z hint: undefined,
2026-01-29T22:40:39.128Z position: '611',
2026-01-29T22:40:39.128Z internalPosition: undefined,
2026-01-29T22:40:39.128Z internalQuery: undefined,
2026-01-29T22:40:39.128Z where: undefined,
2026-01-29T22:40:39.128Z schema: undefined,
2026-01-29T22:40:39.128Z table: undefined,
2026-01-29T22:40:39.128Z column: undefined,
2026-01-29T22:40:39.128Z dataType: undefined,
2026-01-29T22:40:39.128Z constraint: undefined,
2026-01-29T22:40:39.128Z file: 'parse_relation.c',
2026-01-29T22:40:39.128Z line: '1371',
2026-01-29T22:40:39.128Z routine: 'parserOpenTable'
2026-01-29T22:40:39.128Z }
2026-01-29T22:40:39.183Z 📨 [13] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:40:39.182Z
2026-01-29T22:40:39.186Z ❌ Error al obtener notificaciones: error: relation "notifications" does not exist
2026-01-29T22:40:39.186Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T22:40:39.186Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T22:40:39.186Z at async PostgreSQLClient.getNotifications (/app/backend/postgres-client.js:3526:28)
2026-01-29T22:40:39.186Z at async /app/backend/index.js:3345:31 {
2026-01-29T22:40:39.186Z length: 112,
2026-01-29T22:40:39.186Z severity: 'ERROR',
2026-01-29T22:40:39.186Z code: '42P01',
2026-01-29T22:40:39.186Z detail: undefined,
2026-01-29T22:40:39.186Z hint: undefined,
2026-01-29T22:40:39.186Z position: '36',
2026-01-29T22:40:39.186Z internalPosition: undefined,
2026-01-29T22:40:39.186Z internalQuery: undefined,
2026-01-29T22:40:39.186Z where: undefined,
2026-01-29T22:40:39.186Z schema: undefined,
2026-01-29T22:40:39.186Z table: undefined,
2026-01-29T22:40:39.186Z column: undefined,
2026-01-29T22:40:39.186Z dataType: undefined,
2026-01-29T22:40:39.186Z constraint: undefined,
2026-01-29T22:40:39.186Z file: 'parse_relation.c',
2026-01-29T22:40:39.186Z line: '1392',
2026-01-29T22:40:39.186Z routine: 'parserOpenTable'
2026-01-29T22:40:39.187Z }
2026-01-29T22:40:39.187Z Error obteniendo notificaciones: error: relation "notifications" does not exist
2026-01-29T22:40:39.187Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T22:40:39.187Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T22:40:39.187Z at async PostgreSQLClient.getNotifications (/app/backend/postgres-client.js:3526:28)
2026-01-29T22:40:39.187Z at async /app/backend/index.js:3345:31 {
2026-01-29T22:40:39.187Z length: 112,
2026-01-29T22:40:39.187Z severity: 'ERROR',
2026-01-29T22:40:39.187Z code: '42P01',
2026-01-29T22:40:39.187Z detail: undefined,
2026-01-29T22:40:39.187Z hint: undefined,
2026-01-29T22:40:39.187Z position: '36',
2026-01-29T22:40:39.187Z internalPosition: undefined,
2026-01-29T22:40:39.187Z internalQuery: undefined,
2026-01-29T22:40:39.187Z where: undefined,
2026-01-29T22:40:39.187Z schema: undefined,
2026-01-29T22:40:39.187Z table: undefined,
2026-01-29T22:40:39.187Z column: undefined,
2026-01-29T22:40:39.187Z dataType: undefined,
2026-01-29T22:40:39.187Z constraint: undefined,
2026-01-29T22:40:39.187Z file: 'parse_relation.c',
2026-01-29T22:40:39.187Z line: '1392',
2026-01-29T22:40:39.187Z routine: 'parserOpenTable'
2026-01-29T22:40:39.187Z }