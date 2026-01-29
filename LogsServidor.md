2026-01-29T22:32:11.039Z [dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
2026-01-29T22:32:11.539Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T22:32:11.539Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T22:32:11.539Z 🔌 Iniciando conexión a DB (Intento 2)...
2026-01-29T22:32:11.540Z 👂 Event listeners del pool configurados
2026-01-29T22:32:11.617Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:32:11.619Z ✅ PostgreSQL conectado correctamente
2026-01-29T22:32:11.619Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-29T22:32:11.620Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-29T22:32:11.620Z 🐘 PostgreSQL conectado exitosamente
2026-01-29T22:32:11.620Z ✅ dbClient compartido con middlewares
2026-01-29T22:32:11.621Z 🚀 Iniciando sistema de migraciones...
2026-01-29T22:32:11.622Z 🔄 Verificando migraciones pendientes...
2026-01-29T22:32:11.627Z ✅ Tabla de migraciones verificada
2026-01-29T22:32:11.633Z ⏭️  Migración 000-initial-schema ya aplicada
2026-01-29T22:32:11.634Z ⏭️  Migración 001-nueva-fecha-entrega ya aplicada
2026-01-29T22:32:11.635Z ⏭️  Migración 002-numeros-compra ya aplicada
2026-01-29T22:32:11.637Z ⏭️  Migración 003-vendedor ya aplicada
2026-01-29T22:32:11.639Z ⏭️  Migración 004-anonimo ya aplicada
2026-01-29T22:32:11.641Z ⏭️  Migración 005-fechas-cliche ya aplicada
2026-01-29T22:32:11.643Z ⏭️  Migración 006-horas-confirmadas ya aplicada
2026-01-29T22:32:11.645Z ⏭️  Migración 007-antivaho-realizado ya aplicada
2026-01-29T22:32:11.647Z ⏭️  Migración 008-menciones-comentarios ya aplicada
2026-01-29T22:32:11.647Z ✅ Base de datos actualizada. No hay migraciones pendientes.
2026-01-29T22:32:11.647Z ✅ Migraciones completadas exitosamente
2026-01-29T22:32:11.647Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-29T22:32:11.648Z 🔧 Iniciando creación/verificación de tablas...
2026-01-29T22:32:11.650Z ✅ Extensión uuid-ossp verificada
2026-01-29T22:32:11.654Z ✅ Tabla admin_users verificada
2026-01-29T22:32:11.675Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-29T22:32:11.679Z ✅ Constraint de rol actualizado
2026-01-29T22:32:11.679Z 🔄 Verificando usuarios existentes...
2026-01-29T22:32:11.682Z ✅ Todos los usuarios ya están actualizados
2026-01-29T22:32:11.682Z ✅ Columnas de admin_users verificadas
2026-01-29T22:32:11.690Z ✅ Tabla user_permissions verificada
2026-01-29T22:32:11.690Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T22:32:11.691Z ✅ Tabla users verificada
2026-01-29T22:32:11.693Z ✅ Tabla audit_log verificada
2026-01-29T22:32:11.698Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T22:32:11.699Z ✅ Tabla pedido_comments creada
2026-01-29T22:32:11.701Z ✅ Tabla vendedores creada
2026-01-29T22:32:11.704Z ✅ Índices verificados
2026-01-29T22:32:11.710Z ✅ Triggers configurados
2026-01-29T22:32:11.715Z ✅ Columna vendedor_id verificada/creada
2026-01-29T22:32:11.715Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-29T22:32:11.721Z 🚀 Servidor iniciado en puerto 3001
2026-01-29T22:32:11.721Z ✅ PostgreSQL conectado - Sistema operativo