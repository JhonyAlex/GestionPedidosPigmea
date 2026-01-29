2026-01-29T22:46:32.385Z [dotenv@17.2.2] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
2026-01-29T22:46:32.858Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T22:46:32.858Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T22:46:32.858Z 🔌 Iniciando conexión a DB (Intento 2)...
2026-01-29T22:46:32.858Z 👂 Event listeners del pool configurados
2026-01-29T22:46:32.920Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:46:32.921Z ✅ PostgreSQL conectado correctamente
2026-01-29T22:46:32.921Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-29T22:46:32.923Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-29T22:46:32.923Z 🐘 PostgreSQL conectado exitosamente
2026-01-29T22:46:32.923Z ✅ dbClient compartido con middlewares
2026-01-29T22:46:32.923Z 🚀 Iniciando sistema de migraciones...
2026-01-29T22:46:32.923Z 🔄 Verificando migraciones pendientes...
2026-01-29T22:46:32.926Z ✅ Tabla de migraciones verificada
2026-01-29T22:46:32.933Z ⏭️  Migración 000-initial-schema ya aplicada
2026-01-29T22:46:32.935Z ⏭️  Migración 001-nueva-fecha-entrega ya aplicada
2026-01-29T22:46:32.936Z ⏭️  Migración 002-numeros-compra ya aplicada
2026-01-29T22:46:32.938Z ⏭️  Migración 003-vendedor ya aplicada
2026-01-29T22:46:32.939Z ⏭️  Migración 004-anonimo ya aplicada
2026-01-29T22:46:32.941Z ⏭️  Migración 005-fechas-cliche ya aplicada
2026-01-29T22:46:32.942Z ⏭️  Migración 006-horas-confirmadas ya aplicada
2026-01-29T22:46:32.944Z ⏭️  Migración 007-antivaho-realizado ya aplicada
2026-01-29T22:46:32.945Z ⏭️  Migración 008-menciones-comentarios ya aplicada
2026-01-29T22:46:32.946Z 🔄 Aplicando migración: Crear tablas clientes, notificaciones y corregir pedidos...
2026-01-29T22:46:32.992Z ✅ Migración 009-tablas-faltantes-v2 aplicada exitosamente
2026-01-29T22:46:32.992Z ✅ Proceso de migraciones completado. 1 migraciones procesadas.
2026-01-29T22:46:32.992Z ✅ Migraciones completadas exitosamente
2026-01-29T22:46:32.992Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-29T22:46:32.993Z 🔧 Iniciando creación/verificación de tablas...
2026-01-29T22:46:32.994Z ✅ Extensión uuid-ossp verificada
2026-01-29T22:46:32.997Z ✅ Tabla admin_users verificada
2026-01-29T22:46:33.006Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-29T22:46:33.010Z ✅ Constraint de rol actualizado
2026-01-29T22:46:33.011Z 🔄 Verificando usuarios existentes...
2026-01-29T22:46:33.012Z ✅ Todos los usuarios ya están actualizados
2026-01-29T22:46:33.012Z ✅ Columnas de admin_users verificadas
2026-01-29T22:46:33.016Z ✅ Tabla user_permissions verificada
2026-01-29T22:46:33.016Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T22:46:33.017Z ✅ Tabla users verificada
2026-01-29T22:46:33.017Z ✅ Tabla audit_log verificada
2026-01-29T22:46:33.022Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T22:46:33.023Z ✅ Tabla pedido_comments creada
2026-01-29T22:46:33.024Z ✅ Tabla vendedores creada
2026-01-29T22:46:33.028Z ✅ Índices verificados
2026-01-29T22:46:33.035Z ✅ Triggers configurados
2026-01-29T22:46:33.045Z ✅ Columna vendedor_id verificada/creada
2026-01-29T22:46:33.046Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-29T22:46:33.056Z 🚀 Servidor iniciado en puerto 3001
2026-01-29T22:46:33.056Z ✅ PostgreSQL conectado - Sistema operativo
2026-01-29T22:47:46.806Z 📨 [1] GET /api/pedidos - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:47:46.804Z
2026-01-29T22:47:46.815Z 📨 [2] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:47:46.815Z
2026-01-29T22:47:46.818Z 📨 [3] GET /api/audit - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:47:46.818Z
2026-01-29T22:47:46.859Z 📨 [4] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:47:46.858Z
2026-01-29T22:47:46.865Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T22:47:46.865Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T22:47:46.867Z 📨 [5] GET /api/clientes/simple - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:47:46.866Z
2026-01-29T22:47:46.869Z 🔍 Verificando permiso 'clientes.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T22:47:46.869Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T22:47:46.879Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:47:46.880Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:47:46.888Z 📊 [2026-01-29T22:47:46.887Z] GET /api/pedidos (LEGACY) - Total: 0 pedidos
2026-01-29T22:47:46.892Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:47:46.896Z 📊 [getAllClientesSimple] Total clientes encontrados: 0
2026-01-29T22:47:46.974Z 📨 [6] GET /api/notifications - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:47:46.974Z
2026-01-29T22:48:03.293Z 📨 [7] GET /api/vendedores - User: b24fa21c-f2b2-4034-b10c-c0e65c09019e - 2026-01-29T22:48:03.293Z
2026-01-29T22:48:03.295Z 🔍 Verificando permiso 'vendedores.view' para usuario ID: b24fa21c-f2b2-4034-b10c-c0e65c09019e
2026-01-29T22:48:03.297Z 👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
2026-01-29T22:48:03.297Z 📨 [8] GET /api/analysis/instructions - User: anonymous - 2026-01-29T22:48:03.295Z
2026-01-29T22:48:03.315Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:48:03.322Z Error al obtener instrucciones personalizadas: error: relation "analysis_instructions" does not exist
2026-01-29T22:48:03.322Z at /app/backend/node_modules/pg-pool/index.js:45:11
2026-01-29T22:48:03.322Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-01-29T22:48:03.322Z at async /app/backend/index.js:386:24 {
2026-01-29T22:48:03.322Z length: 120,
2026-01-29T22:48:03.322Z severity: 'ERROR',
2026-01-29T22:48:03.322Z code: '42P01',
2026-01-29T22:48:03.322Z detail: undefined,
2026-01-29T22:48:03.322Z hint: undefined,
2026-01-29T22:48:03.322Z position: '75',
2026-01-29T22:48:03.322Z internalPosition: undefined,
2026-01-29T22:48:03.322Z internalQuery: undefined,
2026-01-29T22:48:03.322Z where: undefined,
2026-01-29T22:48:03.322Z schema: undefined,
2026-01-29T22:48:03.322Z table: undefined,
2026-01-29T22:48:03.322Z column: undefined,
2026-01-29T22:48:03.322Z dataType: undefined,
2026-01-29T22:48:03.322Z constraint: undefined,
2026-01-29T22:48:03.322Z file: 'parse_relation.c',
2026-01-29T22:48:03.322Z line: '1392',
2026-01-29T22:48:03.322Z routine: 'parserOpenTable'
2026-01-29T22:48:03.322Z }