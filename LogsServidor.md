2026-01-30T00:42:47.098Z "nombre": "Prueba",
2026-01-30T00:42:47.098Z "razon_social": "",
2026-01-30T00:42:47.099Z "cif": "",
2026-01-30T00:42:47.099Z "direccion": "",
2026-01-30T00:42:47.099Z "poblacion": "",
2026-01-30T00:42:47.099Z "codigo_postal": "",
2026-01-30T00:42:47.099Z "provincia": "",
2026-01-30T00:42:47.099Z "pais": "España",
2026-01-30T00:42:47.099Z "telefono": "",
2026-01-30T00:42:47.099Z "email": "",
2026-01-30T00:42:47.099Z "persona_contacto": "",
2026-01-30T00:42:47.100Z "observaciones": "",
2026-01-30T00:42:47.100Z "_changedBy": "admin",
2026-01-30T00:42:47.100Z "_userRole": "ADMIN"
2026-01-30T00:42:47.100Z }
2026-01-30T00:42:47.100Z 🔍 createCliente - Query:
2026-01-30T00:42:47.100Z INSERT INTO limpio.clientes (nombre, razon_social, cif, telefono, email, direccion_fiscal, codigo_postal, poblacion, provincia, pais, persona_contacto, notas, estado)
2026-01-30T00:42:47.100Z VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
2026-01-30T00:42:47.100Z RETURNING *;
2026-01-30T00:42:47.101Z 🔍 createCliente - Values: [
2026-01-30T00:42:47.101Z 'Prueba', null,
2026-01-30T00:42:47.101Z null,     null,
2026-01-30T00:42:47.101Z null,     null,
2026-01-30T00:42:47.101Z null,     null,
2026-01-30T00:42:47.101Z null,     'España',
2026-01-30T00:42:47.101Z null,     null,
2026-01-30T00:42:47.101Z 'Activo'
2026-01-30T00:42:47.101Z ]
2026-01-30T00:42:47.108Z ✅ Cliente creado exitosamente: 4df7235e-aa85-4d08-8fc1-95bc7f972497
2026-01-30T00:42:47.108Z ✅ Cliente creado exitosamente: 4df7235e-aa85-4d08-8fc1-95bc7f972497
2026-01-30T00:42:55.490Z 📨 [12] POST /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:42:55.489Z
2026-01-30T00:42:55.493Z 🔐 requirePermission middleware
2026-01-30T00:42:55.493Z - Ruta: POST /api/vendedores
2026-01-30T00:42:55.494Z - Permiso requerido: vendedores.create
2026-01-30T00:42:55.494Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-30T00:42:55.496Z - Headers: {
2026-01-30T00:42:55.496Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-30T00:42:55.496Z userRole: 'Administrador'
2026-01-30T00:42:55.496Z }
2026-01-30T00:42:55.496Z - Permisos a verificar (incluyendo aliases): [ 'vendedores.create' ]
2026-01-30T00:42:55.496Z - Verificando permiso en BD...
2026-01-30T00:42:55.496Z 🔍 Verificando permiso 'vendedores.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:42:55.496Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:42:55.496Z - ✅ Usuario tiene permiso: vendedores.create
2026-01-30T00:42:55.496Z - Resultado: ✅ PERMITIDO
2026-01-30T00:42:55.496Z ✅ Permiso concedido - continuando con la request
2026-01-30T00:42:55.509Z ❌ Error registrando historial de vendedor: insert or update on table "vendedores_history" violates foreign key constraint "vendedores_history_vendedor_id_fkey"
2026-01-30T00:43:02.991Z 📨 [13] GET /api/pedidos/exists - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:43:02.990Z
2026-01-30T00:43:07.502Z 📨 [14] GET /api/pedidos/exists - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:43:07.501Z
2026-01-30T00:43:13.644Z 📨 [15] GET /api/pedidos/exists - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:43:13.644Z
2026-01-30T00:44:01.017Z 📨 [16] POST /api/pedidos - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:44:01.017Z
2026-01-30T00:44:01.020Z 🔐 requirePermission middleware
2026-01-30T00:44:01.021Z - Ruta: POST /api/pedidos
2026-01-30T00:44:01.021Z - Permiso requerido: pedidos.create
2026-01-30T00:44:01.021Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-30T00:44:01.021Z - Headers: {
2026-01-30T00:44:01.021Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-30T00:44:01.021Z userRole: 'Administrador'
2026-01-30T00:44:01.021Z }
2026-01-30T00:44:01.021Z - Permisos a verificar (incluyendo aliases): [ 'pedidos.create', 'vista.pedidos' ]
2026-01-30T00:44:01.021Z - Verificando permiso en BD...
2026-01-30T00:44:01.021Z 🔍 Verificando permiso 'pedidos.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T00:44:01.021Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T00:44:01.021Z - ✅ Usuario tiene permiso: pedidos.create
2026-01-30T00:44:01.021Z - Resultado: ✅ PERMITIDO
2026-01-30T00:44:01.021Z ✅ Permiso concedido - continuando con la request
2026-01-30T00:44:01.021Z 📦 Creando nuevo pedido:
2026-01-30T00:44:01.021Z - Cliente: Prueba
2026-01-30T00:44:01.021Z - ClienteId: 4df7235e-aa85-4d08-8fc1-95bc7f972497
2026-01-30T00:44:01.021Z - ID Pedido: 1769733842532
2026-01-30T00:44:01.026Z ⚠️ Vendedor 22481409-c15a-45e1-a821-af8a36422faa no encontrado. Estableciendo vendedorId como null.
2026-01-30T00:44:01.051Z 🧹 Notificaciones antiguas limpiadas para usuario: GLOBAL
2026-01-30T00:44:01.052Z ✅ Notificación guardada en BD: notif-1769733841044-5itdgojfh
2026-01-30T00:44:01.469Z 📨 [17] POST /api/audit - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T00:44:01.468Z
2026-01-30T00:44:01.475Z 📨 [18] POST /api/action-history - User: anonymous - 2026-01-30T00:44:01.475Z
2026-01-30T00:44:01.501Z 🔗 Nueva conexión al pool establecida
2026-01-30T00:44:01.507Z Error al guardar historial: error: column "context_id" of relation "action_history" does not exist
2026-01-30T00:44:01.507Z at /app/backend/node_modules/pg-pool/index.js:45:11
2026-01-30T00:44:01.507Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-30T00:44:01.507Z at async /app/backend/index.js:3873:24 {
2026-01-30T00:44:01.507Z length: 137,
2026-01-30T00:44:01.507Z severity: 'ERROR',
2026-01-30T00:44:01.507Z code: '42703',
2026-01-30T00:44:01.507Z detail: undefined,
2026-01-30T00:44:01.507Z hint: undefined,
2026-01-30T00:44:01.507Z position: '63',
2026-01-30T00:44:01.507Z internalPosition: undefined,
2026-01-30T00:44:01.507Z internalQuery: undefined,
2026-01-30T00:44:01.507Z where: undefined,
2026-01-30T00:44:01.507Z schema: undefined,
2026-01-30T00:44:01.507Z table: undefined,
2026-01-30T00:44:01.507Z column: undefined,
2026-01-30T00:44:01.507Z dataType: undefined,
2026-01-30T00:44:01.507Z constraint: undefined,
2026-01-30T00:44:01.507Z file: 'parse_target.c',
2026-01-30T00:44:01.507Z line: '1075',
2026-01-30T00:44:01.508Z routine: 'checkInsertTargets'
2026-01-30T00:44:01.508Z }