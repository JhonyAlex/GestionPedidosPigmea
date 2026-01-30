2026-01-30T07:56:28.929Z Error in GET /api/vendedores/7fc51c0d-1e09-46c0-ba37-6142cb35de48/estadisticas: error: column "fecha_pedido" does not exist
2026-01-30T07:56:28.929Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:56:28.929Z at async PostgreSQLClient.getVendedorEstadisticas (/app/backend/postgres-client.js:2803:28)
2026-01-30T07:56:28.929Z at async /app/backend/index.js:4419:30 {
2026-01-30T07:56:28.993Z Error in GET /api/vendedores/7fc51c0d-1e09-46c0-ba37-6142cb35de48/pedidos: error: column "fecha_pedido" does not exist
2026-01-30T07:56:28.993Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:56:28.993Z at async PostgreSQLClient.getVendedorPedidos (/app/backend/postgres-client.js:2759:28)
2026-01-30T07:56:28.993Z at async /app/backend/index.js:4408:25 {
2026-01-30T07:56:29.056Z Error in GET /api/vendedores/7fc51c0d-1e09-46c0-ba37-6142cb35de48/pedidos: error: column "fecha_pedido" does not exist
2026-01-30T07:56:29.056Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:56:29.056Z at async PostgreSQLClient.getVendedorPedidos (/app/backend/postgres-client.js:2759:28)
2026-01-30T07:56:29.056Z at async /app/backend/index.js:4408:25 {
2026-01-30T07:56:29.118Z Error in GET /api/vendedores/7fc51c0d-1e09-46c0-ba37-6142cb35de48/pedidos: error: column "fecha_pedido" does not exist
2026-01-30T07:56:29.118Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:56:29.118Z at async PostgreSQLClient.getVendedorPedidos (/app/backend/postgres-client.js:2759:28)
2026-01-30T07:56:29.118Z at async /app/backend/index.js:4408:25 {
2026-01-30T07:56:29.181Z Error in GET /api/vendedores/7fc51c0d-1e09-46c0-ba37-6142cb35de48/pedidos: error: column "fecha_pedido" does not exist
2026-01-30T07:56:29.181Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:56:29.181Z at async PostgreSQLClient.getVendedorPedidos (/app/backend/postgres-client.js:2759:28)
2026-01-30T07:56:29.181Z at async /app/backend/index.js:4408:25 {
2026-01-30T07:56:39.981Z ❌ Error en updateVendedor: error: relation "pedidos" does not exist
2026-01-30T07:56:39.981Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:56:39.981Z at async PostgreSQLClient.updateVendedor (/app/backend/postgres-client.js:1831:37)
2026-01-30T07:56:39.981Z at async /app/backend/index.js:4319:37 {
2026-01-30T07:56:39.981Z Error in PUT /api/vendedores/b8141fc8-6fbc-4470-9794-cf6745a4f804: error: relation "pedidos" does not exist
2026-01-30T07:56:39.981Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:56:39.981Z at async PostgreSQLClient.updateVendedor (/app/backend/postgres-client.js:1831:37)
2026-01-30T07:56:39.981Z at async /app/backend/index.js:4319:37 {
2026-01-30T07:57:59.543Z Error in GET /api/clientes/4df7235e-aa85-4d08-8fc1-95bc7f972497/estadisticas: error: column "fecha_pedido" does not exist
2026-01-30T07:57:59.543Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:57:59.543Z at async PostgreSQLClient.getClienteEstadisticas (/app/backend/postgres-client.js:2498:28)
2026-01-30T07:57:59.543Z at async /app/backend/index.js:4068:30 {
2026-01-30T07:58:05.141Z Error al eliminar cliente permanentemente: error: relation "pedidos" does not exist
2026-01-30T07:58:05.141Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:58:05.141Z at async PostgreSQLClient.deleteClientePermanently (/app/backend/postgres-client.js:2597:17)
2026-01-30T07:58:05.141Z at async /app/backend/index.js:4162:24 {
2026-01-30T07:58:05.141Z Error in DELETE permanent /api/clientes/4df7235e-aa85-4d08-8fc1-95bc7f972497: error: relation "pedidos" does not exist
2026-01-30T07:58:05.141Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T07:58:05.141Z at async PostgreSQLClient.deleteClientePermanently (/app/backend/postgres-client.js:2597:17)
2026-01-30T07:58:05.141Z at async /app/backend/index.js:4162:24 {