2026-01-29T23:46:07.551Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-29T23:46:07.551Z userRole: 'Administrador'
2026-01-29T23:46:07.551Z }
2026-01-29T23:46:07.551Z - Permisos a verificar (incluyendo aliases): [ 'clientes.create', 'vista.clientes' ]
2026-01-29T23:46:07.551Z - Verificando permiso en BD...
2026-01-29T23:46:07.552Z 🔍 Verificando permiso 'clientes.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:46:07.552Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:46:07.552Z - ✅ Usuario tiene permiso: clientes.create
2026-01-29T23:46:07.553Z - Resultado: ✅ PERMITIDO
2026-01-29T23:46:07.553Z ✅ Permiso concedido - continuando con la request
2026-01-29T23:46:07.553Z 🔍 POST /api/clientes - Datos recibidos: {
2026-01-29T23:46:07.553Z "nombre": "Prueba",
2026-01-29T23:46:07.553Z "razon_social": "",
2026-01-29T23:46:07.553Z "cif": "",
2026-01-29T23:46:07.553Z "direccion": "",
2026-01-29T23:46:07.553Z "poblacion": "",
2026-01-29T23:46:07.553Z "codigo_postal": "",
2026-01-29T23:46:07.553Z "provincia": "",
2026-01-29T23:46:07.553Z "pais": "España",
2026-01-29T23:46:07.553Z "telefono": "",
2026-01-29T23:46:07.553Z "email": "",
2026-01-29T23:46:07.553Z "persona_contacto": "",
2026-01-29T23:46:07.553Z "observaciones": ""
2026-01-29T23:46:07.553Z }
2026-01-29T23:46:07.553Z 🔍 Database initialized: true
2026-01-29T23:46:07.554Z 🔍 createCliente - Datos recibidos: {
2026-01-29T23:46:07.554Z "nombre": "Prueba",
2026-01-29T23:46:07.554Z "razon_social": "",
2026-01-29T23:46:07.554Z "cif": "",
2026-01-29T23:46:07.554Z "direccion": "",
2026-01-29T23:46:07.554Z "poblacion": "",
2026-01-29T23:46:07.554Z "codigo_postal": "",
2026-01-29T23:46:07.554Z "provincia": "",
2026-01-29T23:46:07.554Z "pais": "España",
2026-01-29T23:46:07.554Z "telefono": "",
2026-01-29T23:46:07.554Z "email": "",
2026-01-29T23:46:07.554Z "persona_contacto": "",
2026-01-29T23:46:07.554Z "observaciones": "",
2026-01-29T23:46:07.554Z "_changedBy": "admin",
2026-01-29T23:46:07.554Z "_userRole": "ADMIN"
2026-01-29T23:46:07.554Z }
2026-01-29T23:46:07.555Z 🔍 createCliente - Query:
2026-01-29T23:46:07.555Z INSERT INTO limpio.clientes (nombre, razon_social, cif, telefono, email, direccion_fiscal, codigo_postal, poblacion, provincia, pais, persona_contacto, notas, estado)
2026-01-29T23:46:07.555Z VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
2026-01-29T23:46:07.555Z RETURNING *;
2026-01-29T23:46:07.557Z 🔍 createCliente - Values: [
2026-01-29T23:46:07.557Z 'Prueba', null,
2026-01-29T23:46:07.557Z null,     null,
2026-01-29T23:46:07.557Z null,     null,
2026-01-29T23:46:07.557Z null,     null,
2026-01-29T23:46:07.557Z null,     'España',
2026-01-29T23:46:07.557Z null,     null,
2026-01-29T23:46:07.557Z 'Activo'
2026-01-29T23:46:07.557Z ]
2026-01-29T23:46:07.562Z ❌ Error registrando historial de cliente: relation "clientes_history" does not exist
2026-01-29T23:46:07.562Z ✅ Cliente creado exitosamente: 253743b8-1a1c-46f0-9d6c-86893fa570a5
2026-01-29T23:46:07.562Z ✅ Cliente creado exitosamente: 253743b8-1a1c-46f0-9d6c-86893fa570a5
2026-01-29T23:46:15.278Z 📨 [11] POST /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:46:15.278Z
2026-01-29T23:46:15.285Z 🔐 requirePermission middleware
2026-01-29T23:46:15.285Z - Ruta: POST /api/vendedores
2026-01-29T23:46:15.285Z - Permiso requerido: vendedores.create
2026-01-29T23:46:15.285Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-29T23:46:15.286Z - Headers: {
2026-01-29T23:46:15.287Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-29T23:46:15.287Z userRole: 'Administrador'
2026-01-29T23:46:15.287Z }
2026-01-29T23:46:15.287Z - Permisos a verificar (incluyendo aliases): [ 'vendedores.create' ]
2026-01-29T23:46:15.287Z - Verificando permiso en BD...
2026-01-29T23:46:15.287Z 🔍 Verificando permiso 'vendedores.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:46:15.287Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:46:15.287Z - ✅ Usuario tiene permiso: vendedores.create
2026-01-29T23:46:15.287Z - Resultado: ✅ PERMITIDO
2026-01-29T23:46:15.287Z ✅ Permiso concedido - continuando con la request
2026-01-29T23:46:15.299Z ❌ Error registrando historial de vendedor: relation "vendedores_history" does not exist
2026-01-29T23:46:22.363Z 📨 [12] GET /api/pedidos/exists - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:46:22.362Z
2026-01-29T23:46:22.369Z Error in GET /api/pedidos/exists: error: column "numero_pedido_cliente" does not exist
2026-01-29T23:46:22.370Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T23:46:22.370Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T23:46:22.370Z at async PostgreSQLClient.existsNumeroPedidoCliente (/app/backend/postgres-client.js:1040:28)
2026-01-29T23:46:22.370Z at async /app/backend/index.js:2282:24 {
2026-01-29T23:46:22.370Z length: 121,
2026-01-29T23:46:22.370Z severity: 'ERROR',
2026-01-29T23:46:22.370Z code: '42703',
2026-01-29T23:46:22.370Z detail: undefined,
2026-01-29T23:46:22.370Z hint: undefined,
2026-01-29T23:46:22.370Z position: '86',
2026-01-29T23:46:22.370Z internalPosition: undefined,
2026-01-29T23:46:22.370Z internalQuery: undefined,
2026-01-29T23:46:22.370Z where: undefined,
2026-01-29T23:46:22.370Z schema: undefined,
2026-01-29T23:46:22.370Z table: undefined,
2026-01-29T23:46:22.370Z column: undefined,
2026-01-29T23:46:22.370Z dataType: undefined,
2026-01-29T23:46:22.370Z constraint: undefined,
2026-01-29T23:46:22.370Z file: 'parse_relation.c',
2026-01-29T23:46:22.370Z line: '3665',
2026-01-29T23:46:22.370Z routine: 'errorMissingColumn'
2026-01-29T23:46:22.370Z }