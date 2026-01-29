2026-01-29T23:31:53.166Z ✅ Tabla vendedores creada
2026-01-29T23:31:53.169Z ✅ Índices verificados
2026-01-29T23:31:53.176Z ✅ Triggers configurados
2026-01-29T23:31:53.182Z ✅ Columna vendedor_id verificada/creada
2026-01-29T23:31:53.182Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-29T23:31:53.189Z 🚀 Servidor iniciado en puerto 3001
2026-01-29T23:31:53.189Z ✅ PostgreSQL conectado - Sistema operativo
2026-01-29T23:36:06.453Z 📨 [1] GET /api/audit - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:06.451Z
2026-01-29T23:36:06.459Z 📨 [2] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:06.459Z
2026-01-29T23:36:06.461Z 📨 [3] GET /api/pedidos - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:06.460Z
2026-01-29T23:36:06.476Z 📊 [2026-01-29T23:36:06.476Z] GET /api/pedidos (LEGACY) - Total: 0 pedidos
2026-01-29T23:36:06.485Z 🔗 Nueva conexión al pool establecida
2026-01-29T23:36:06.504Z 🔗 Nueva conexión al pool establecida
2026-01-29T23:36:06.505Z 📨 [4] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:06.503Z
2026-01-29T23:36:06.511Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:36:06.511Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:36:06.512Z 📨 [5] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:06.512Z
2026-01-29T23:36:06.515Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:36:06.517Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:36:06.521Z 📊 [getAllClientesSimple] Total clientes encontrados: 0
2026-01-29T23:36:06.622Z 📨 [6] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:06.621Z
2026-01-29T23:36:10.188Z 📨 [7] GET /api/observaciones/templates - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:10.188Z
2026-01-29T23:36:10.189Z 📨 [8] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:10.189Z
2026-01-29T23:36:10.189Z 📨 [9] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:10.189Z
2026-01-29T23:36:10.194Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:36:10.194Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:36:10.194Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:36:10.194Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:36:10.196Z 📊 [getAllClientesSimple] Total clientes encontrados: 0
2026-01-29T23:36:18.581Z 📨 [10] POST /api/clientes - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T23:36:18.581Z
2026-01-29T23:36:18.584Z 🔐 requirePermission middleware
2026-01-29T23:36:18.585Z - Ruta: POST /api/clientes
2026-01-29T23:36:18.585Z - Permiso requerido: clientes.create
2026-01-29T23:36:18.585Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-29T23:36:18.589Z - Headers: {
2026-01-29T23:36:18.589Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-29T23:36:18.589Z userRole: 'Administrador'
2026-01-29T23:36:18.589Z }
2026-01-29T23:36:18.591Z - Permisos a verificar (incluyendo aliases): [ 'clientes.create', 'vista.clientes' ]
2026-01-29T23:36:18.591Z - Verificando permiso en BD...
2026-01-29T23:36:18.591Z 🔍 Verificando permiso 'clientes.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T23:36:18.591Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T23:36:18.591Z - ✅ Usuario tiene permiso: clientes.create
2026-01-29T23:36:18.591Z - Resultado: ✅ PERMITIDO
2026-01-29T23:36:18.591Z ✅ Permiso concedido - continuando con la request
2026-01-29T23:36:18.591Z 🔍 POST /api/clientes - Datos recibidos: {
2026-01-29T23:36:18.591Z "nombre": "Prueba",
2026-01-29T23:36:18.591Z "razon_social": "",
2026-01-29T23:36:18.591Z "cif": "",
2026-01-29T23:36:18.591Z "direccion": "",
2026-01-29T23:36:18.591Z "poblacion": "",
2026-01-29T23:36:18.591Z "codigo_postal": "",
2026-01-29T23:36:18.591Z "provincia": "",
2026-01-29T23:36:18.591Z "pais": "España",
2026-01-29T23:36:18.591Z "telefono": "",
2026-01-29T23:36:18.591Z "email": "",
2026-01-29T23:36:18.591Z "persona_contacto": "",
2026-01-29T23:36:18.591Z "observaciones": ""
2026-01-29T23:36:18.591Z }
2026-01-29T23:36:18.591Z 🔍 Database initialized: true
2026-01-29T23:36:18.592Z 🔍 createCliente - Datos recibidos: {
2026-01-29T23:36:18.592Z "nombre": "Prueba",
2026-01-29T23:36:18.592Z "razon_social": "",
2026-01-29T23:36:18.592Z "cif": "",
2026-01-29T23:36:18.592Z "direccion": "",
2026-01-29T23:36:18.592Z "poblacion": "",
2026-01-29T23:36:18.592Z "codigo_postal": "",
2026-01-29T23:36:18.592Z "provincia": "",
2026-01-29T23:36:18.592Z "pais": "España",
2026-01-29T23:36:18.592Z "telefono": "",
2026-01-29T23:36:18.592Z "email": "",
2026-01-29T23:36:18.592Z "persona_contacto": "",
2026-01-29T23:36:18.592Z "observaciones": "",
2026-01-29T23:36:18.592Z "_changedBy": "admin",
2026-01-29T23:36:18.592Z "_userRole": "ADMIN"
2026-01-29T23:36:18.592Z }
2026-01-29T23:36:18.592Z 🔍 createCliente - Query:
2026-01-29T23:36:18.592Z INSERT INTO limpio.clientes (nombre, razon_social, cif, telefono, email, direccion_fiscal, codigo_postal, poblacion, provincia, pais, persona_contacto, notas, estado)
2026-01-29T23:36:18.592Z VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
2026-01-29T23:36:18.592Z RETURNING *;
2026-01-29T23:36:18.594Z 🔍 createCliente - Values: [
2026-01-29T23:36:18.594Z 'Prueba', null,
2026-01-29T23:36:18.594Z null,     null,
2026-01-29T23:36:18.594Z null,     null,
2026-01-29T23:36:18.594Z null,     null,
2026-01-29T23:36:18.594Z null,     'España',
2026-01-29T23:36:18.594Z null,     null,
2026-01-29T23:36:18.594Z 'Activo'
2026-01-29T23:36:18.594Z ]
2026-01-29T23:36:18.597Z ❌ Error in POST /api/clientes:
2026-01-29T23:36:18.598Z Error message: column "codigo_postal" of relation "clientes" does not exist
2026-01-29T23:36:18.598Z Error code: 42703
2026-01-29T23:36:18.598Z Error detail: undefined
2026-01-29T23:36:18.599Z Stack trace: error: column "codigo_postal" of relation "clientes" does not exist
2026-01-29T23:36:18.599Z at /app/backend/node_modules/pg/lib/client.js:545:17
2026-01-29T23:36:18.599Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T23:36:18.599Z at async PostgreSQLClient.createCliente (/app/backend/postgres-client.js:1967:28)
2026-01-29T23:36:18.599Z at async /app/backend/index.js:4089:28