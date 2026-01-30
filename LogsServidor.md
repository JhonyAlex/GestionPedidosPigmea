2026-01-29T23:57:42.777Z "persona_contacto": "",
2026-01-29T23:57:42.777Z "observaciones": ""
2026-01-29T23:57:42.777Z }
2026-01-29T23:57:42.777Z 🔍 Database initialized: true
2026-01-29T23:57:42.777Z 🔍 createCliente - Datos recibidos: {
2026-01-29T23:57:42.777Z "nombre": "Prueba",
2026-01-29T23:57:42.777Z "razon_social": "",
2026-01-29T23:57:42.777Z "cif": "",
2026-01-29T23:57:42.777Z "direccion": "",
2026-01-29T23:57:42.777Z "poblacion": "",
2026-01-29T23:57:42.777Z "codigo_postal": "",
2026-01-29T23:57:42.777Z "provincia": "",
2026-01-29T23:57:42.777Z "pais": "España",
2026-01-29T23:57:42.777Z "telefono": "",
2026-01-29T23:57:42.777Z "email": "",
2026-01-29T23:57:42.777Z "persona_contacto": "",
2026-01-29T23:57:42.777Z "observaciones": "",
2026-01-29T23:57:42.777Z "_changedBy": "admin",
2026-01-29T23:57:42.777Z "_userRole": "ADMIN"
2026-01-29T23:57:42.777Z }
2026-01-29T23:57:42.778Z 🔍 createCliente - Query:
2026-01-29T23:57:42.778Z INSERT INTO limpio.clientes (nombre, razon_social, cif, telefono, email, direccion_fiscal, codigo_postal, poblacion, provincia, pais, persona_contacto, notas, estado)
2026-01-29T23:57:42.778Z VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
2026-01-29T23:57:42.778Z RETURNING *;
2026-01-29T23:57:42.779Z 🔍 createCliente - Values: [
2026-01-29T23:57:42.779Z 'Prueba', null,
2026-01-29T23:57:42.779Z null,     null,
2026-01-29T23:57:42.779Z null,     null,
2026-01-29T23:57:42.779Z null,     null,
2026-01-29T23:57:42.779Z null,     'España',
2026-01-29T23:57:42.779Z null,     null,
2026-01-29T23:57:42.779Z 'Activo'
2026-01-29T23:57:42.779Z ]
2026-01-29T23:57:42.784Z ✅ Cliente creado exitosamente: 2e582ec5-c65c-46ce-978e-3ab0511ae6ce
2026-01-29T23:57:42.784Z ✅ Cliente creado exitosamente: 2e582ec5-c65c-46ce-978e-3ab0511ae6ce
2026-01-29T23:57:42.785Z ❌ Error registrando historial de cliente: relation "clientes_history" does not exist
2026-01-29T23:57:49.763Z 📨 [12] POST /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:57:49.763Z
2026-01-29T23:57:49.766Z 🔐 requirePermission middleware
2026-01-29T23:57:49.766Z - Ruta: POST /api/vendedores
2026-01-29T23:57:49.766Z - Permiso requerido: vendedores.create
2026-01-29T23:57:49.766Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-29T23:57:49.766Z - Headers: {
2026-01-29T23:57:49.766Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-29T23:57:49.766Z userRole: 'Administrador'
2026-01-29T23:57:49.766Z }
2026-01-29T23:57:49.766Z - Permisos a verificar (incluyendo aliases): [ 'vendedores.create' ]
2026-01-29T23:57:49.766Z - Verificando permiso en BD...
2026-01-29T23:57:49.766Z 🔍 Verificando permiso 'vendedores.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:57:49.766Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:57:49.766Z - ✅ Usuario tiene permiso: vendedores.create
2026-01-29T23:57:49.767Z - Resultado: ✅ PERMITIDO
2026-01-29T23:57:49.767Z ✅ Permiso concedido - continuando con la request
2026-01-29T23:57:49.775Z ❌ Error registrando historial de vendedor: relation "vendedores_history" does not exist
2026-01-29T23:57:55.143Z 📨 [13] GET /api/pedidos/exists - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:57:55.142Z
2026-01-29T23:58:54.410Z 📨 [14] POST /api/pedidos - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:58:54.408Z
2026-01-29T23:58:54.412Z 🔐 requirePermission middleware
2026-01-29T23:58:54.412Z - Ruta: POST /api/pedidos
2026-01-29T23:58:54.412Z - Permiso requerido: pedidos.create
2026-01-29T23:58:54.412Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-29T23:58:54.413Z - Headers: {
2026-01-29T23:58:54.413Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-29T23:58:54.413Z userRole: 'Administrador'
2026-01-29T23:58:54.413Z }
2026-01-29T23:58:54.413Z - Permisos a verificar (incluyendo aliases): [ 'pedidos.create', 'vista.pedidos' ]
2026-01-29T23:58:54.413Z - Verificando permiso en BD...
2026-01-29T23:58:54.413Z 🔍 Verificando permiso 'pedidos.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:58:54.413Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:58:54.413Z - ✅ Usuario tiene permiso: pedidos.create
2026-01-29T23:58:54.413Z - Resultado: ✅ PERMITIDO
2026-01-29T23:58:54.413Z ✅ Permiso concedido - continuando con la request
2026-01-29T23:58:54.413Z 📦 Creando nuevo pedido:
2026-01-29T23:58:54.413Z - Cliente: Prueba
2026-01-29T23:58:54.413Z - ClienteId: 2e582ec5-c65c-46ce-978e-3ab0511ae6ce
2026-01-29T23:58:54.413Z - ID Pedido: 1769731136032
2026-01-29T23:58:54.416Z ⚠️ Vendedor 503cf10a-7bce-4c93-9c16-641eff7d621f no encontrado. Estableciendo vendedorId como null.
2026-01-29T23:58:54.436Z Error creating pedido: error: bind message supplies 23 parameters, but prepared statement "" requires 17
2026-01-29T23:58:54.436Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T23:58:54.436Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T23:58:54.436Z at async PostgreSQLClient.create (/app/backend/postgres-client.js:1201:13)
2026-01-29T23:58:54.436Z at async /app/backend/index.js:2798:9 {
2026-01-29T23:58:54.436Z length: 139,
2026-01-29T23:58:54.436Z severity: 'ERROR',
2026-01-29T23:58:54.436Z code: '08P01',
2026-01-29T23:58:54.436Z detail: undefined,
2026-01-29T23:58:54.436Z hint: undefined,
2026-01-29T23:58:54.436Z position: undefined,
2026-01-29T23:58:54.436Z internalPosition: undefined,
2026-01-29T23:58:54.436Z internalQuery: undefined,
2026-01-29T23:58:54.436Z where: undefined,
2026-01-29T23:58:54.436Z schema: undefined,
2026-01-29T23:58:54.436Z table: undefined,
2026-01-29T23:58:54.436Z column: undefined,
2026-01-29T23:58:54.436Z dataType: undefined,
2026-01-29T23:58:54.436Z constraint: undefined,
2026-01-29T23:58:54.436Z file: 'postgres.c',
2026-01-29T23:58:54.436Z line: '1674',
2026-01-29T23:58:54.436Z routine: 'exec_bind_message'
2026-01-29T23:58:54.436Z }