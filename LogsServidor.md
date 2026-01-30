2026-01-30T01:35:23.884Z - Permiso requerido: vendedores.create
2026-01-30T01:35:23.884Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-30T01:35:23.884Z - Headers: {
2026-01-30T01:35:23.884Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-30T01:35:23.884Z userRole: 'Administrador'
2026-01-30T01:35:23.884Z }
2026-01-30T01:35:23.884Z - Permisos a verificar (incluyendo aliases): [ 'vendedores.create' ]
2026-01-30T01:35:23.885Z - Verificando permiso en BD...
2026-01-30T01:35:23.885Z 🔍 Verificando permiso 'vendedores.create' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:23.885Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:23.885Z - ✅ Usuario tiene permiso: vendedores.create
2026-01-30T01:35:23.885Z - Resultado: ✅ PERMITIDO
2026-01-30T01:35:23.885Z ✅ Permiso concedido - continuando con la request
2026-01-30T01:35:23.895Z ❌ Error registrando historial de vendedor: insert or update on table "vendedores_history" violates foreign key constraint "vendedores_history_vendedor_id_fkey"
2026-01-30T01:35:26.850Z 📨 [28] POST /api/action-history - User: anonymous - 2026-01-30T01:35:26.849Z
2026-01-30T01:35:26.856Z ✅ Historial guardado: pedido 1769733842532 - UPDATE
2026-01-30T01:35:27.226Z 🔓 Pedido 1769733842532 desbloqueado por Jhony Admin
2026-01-30T01:35:27.232Z 📨 [29] PUT /api/pedidos/1769733842532 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:27.232Z
2026-01-30T01:35:27.233Z 🔐 requirePermission middleware
2026-01-30T01:35:27.233Z - Ruta: PUT /api/pedidos/1769733842532
2026-01-30T01:35:27.233Z - Permiso requerido: pedidos.edit
2026-01-30T01:35:27.233Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-30T01:35:27.233Z - Headers: {
2026-01-30T01:35:27.233Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-30T01:35:27.233Z userRole: 'Administrador'
2026-01-30T01:35:27.233Z }
2026-01-30T01:35:27.233Z - Permisos a verificar (incluyendo aliases): [ 'pedidos.edit', 'vista.pedidos' ]
2026-01-30T01:35:27.233Z - Verificando permiso en BD...
2026-01-30T01:35:27.235Z 🔍 Verificando permiso 'pedidos.edit' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:27.235Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:27.235Z - ✅ Usuario tiene permiso: pedidos.edit
2026-01-30T01:35:27.235Z - Resultado: ✅ PERMITIDO
2026-01-30T01:35:27.235Z ✅ Permiso concedido - continuando con la request
2026-01-30T01:35:27.242Z ⚠️ Vendedor 6823ad42-477a-472d-b187-ab4615c017e2 no encontrado. Estableciendo vendedorId como null.
2026-01-30T01:35:27.255Z 🔄 Actualizando pedido 1769733842532 con columnas disponibles: nueva_fecha_entrega=true, numeros_compra=true, vendedor=true, cliche_info=false, anonimo=true
2026-01-30T01:35:27.823Z 📨 [30] POST /api/audit - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:27.823Z
2026-01-30T01:35:30.412Z 📨 [31] GET /api/vendedores/stats/batch - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:30.412Z
2026-01-30T01:35:30.413Z 🔐 requirePermission middleware
2026-01-30T01:35:30.413Z - Ruta: GET /api/vendedores/stats/batch
2026-01-30T01:35:30.413Z - Permiso requerido: vendedores.view
2026-01-30T01:35:30.413Z - Usuario: b24fa21c-f2b2-4034-b10c-c0e65c09019e (ADMIN)
2026-01-30T01:35:30.413Z - Headers: {
2026-01-30T01:35:30.413Z userId: 'b24fa21c-f2b2-4034-b10c-c0e65c09019e',
2026-01-30T01:35:30.413Z userRole: 'Administrador'
2026-01-30T01:35:30.413Z }
2026-01-30T01:35:30.414Z - Permisos a verificar (incluyendo aliases): [ 'vendedores.view' ]
2026-01-30T01:35:30.414Z - Verificando permiso en BD...
2026-01-30T01:35:30.414Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:30.414Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:30.414Z - ✅ Usuario tiene permiso: vendedores.view
2026-01-30T01:35:30.414Z - Resultado: ✅ PERMITIDO
2026-01-30T01:35:30.417Z ✅ Permiso concedido - continuando con la request
2026-01-30T01:35:30.420Z 📊 Estadísticas batch cargadas para 1 vendedores
2026-01-30T01:35:32.545Z 📨 [32] GET /api/comments/1769733842532 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:32.545Z
2026-01-30T01:35:32.734Z 🔒 Pedido 1769733842532 bloqueado por Jhony Admin (b24fa21c-f2b2-4034-b10c-c0e65c09019e)
2026-01-30T01:35:32.736Z 📨 [33] GET /api/users/active - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:32.736Z
2026-01-30T01:35:32.738Z 📨 [34] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:32.738Z
2026-01-30T01:35:32.742Z 📨 [35] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:32.742Z
2026-01-30T01:35:32.742Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:32.742Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:32.756Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:35:32.758Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:32.758Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:32.763Z 📊 [getAllClientesSimple] Total clientes encontrados: 1
2026-01-30T01:35:36.566Z 🔓 Pedido 1769733842532 desbloqueado por Jhony Admin
2026-01-30T01:35:39.058Z 📨 [36] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:39.057Z
2026-01-30T01:35:39.058Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:39.059Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:44.588Z 📨 [37] GET /api/audit - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:44.586Z
2026-01-30T01:35:44.588Z 📨 [38] GET /api/pedidos - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:44.588Z
2026-01-30T01:35:44.596Z 📨 [39] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:44.595Z
2026-01-30T01:35:44.634Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:35:44.636Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:35:44.643Z 📊 [2026-01-30T01:35:44.642Z] GET /api/pedidos (LEGACY) - Total: 2 pedidos
2026-01-30T01:35:44.778Z 📨 [40] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:44.778Z
2026-01-30T01:35:44.779Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:44.779Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:44.780Z 📨 [41] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:44.780Z
2026-01-30T01:35:44.780Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:44.780Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:44.787Z 📨 [42] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:44.785Z
2026-01-30T01:35:44.795Z 📊 [getAllClientesSimple] Total clientes encontrados: 1
2026-01-30T01:35:45.059Z 📨 [43] GET /api/materiales - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:45.058Z
2026-01-30T01:35:45.062Z ✅ Materiales obtenidos: 0
2026-01-30T01:35:51.613Z 📨 [44] GET /api/observaciones/templates - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:51.611Z
2026-01-30T01:35:51.802Z 📨 [45] GET /api/comments/1769731617434 - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:51.802Z
2026-01-30T01:35:51.811Z 📨 [46] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:51.807Z
2026-01-30T01:35:51.811Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:51.811Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:51.811Z 📨 [47] GET /api/pedidos/1769731617434/materiales - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:51.808Z
2026-01-30T01:35:51.811Z 📨 [48] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:51.809Z
2026-01-30T01:35:51.811Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-30T01:35:51.811Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-30T01:35:51.814Z 🔒 Pedido 1769731617434 bloqueado por Jhony Admin (b24fa21c-f2b2-4034-b10c-c0e65c09019e)
2026-01-30T01:35:51.815Z 📨 [49] GET /api/users/active - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-30T01:35:51.815Z
2026-01-30T01:35:51.819Z 📊 [getAllClientesSimple] Total clientes encontrados: 1
2026-01-30T01:35:51.819Z 📦 GET /api/pedidos/1769731617434/materiales → 0 materiales encontrados
2026-01-30T01:35:51.836Z 🔗 Nueva conexión al pool establecida
2026-01-30T01:35:51.840Z 🔗 Nueva conexión al pool establecida