2026-01-29T22:07:59.637Z [dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
2026-01-29T22:08:00.065Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T22:08:00.065Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T22:08:00.065Z 🔌 Iniciando conexión a DB (Intento 2)...
2026-01-29T22:08:00.066Z 👂 Event listeners del pool configurados
2026-01-29T22:08:00.141Z 🔗 Nueva conexión al pool establecida
2026-01-29T22:08:00.142Z ✅ PostgreSQL conectado correctamente
2026-01-29T22:08:00.142Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-29T22:08:00.142Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-29T22:08:00.142Z 🐘 PostgreSQL conectado exitosamente
2026-01-29T22:08:00.142Z ✅ dbClient compartido con middlewares
2026-01-29T22:08:00.143Z 🚀 Iniciando sistema de migraciones...
2026-01-29T22:08:00.143Z 🔄 Verificando migraciones pendientes...
2026-01-29T22:08:00.147Z ✅ Tabla de migraciones verificada
2026-01-29T22:08:00.152Z ⏭️  Migración 000-initial-schema ya aplicada
2026-01-29T22:08:00.153Z ⏭️  Migración 001-nueva-fecha-entrega ya aplicada
2026-01-29T22:08:00.154Z ⏭️  Migración 002-numeros-compra ya aplicada
2026-01-29T22:08:00.154Z ⏭️  Migración 003-vendedor ya aplicada
2026-01-29T22:08:00.155Z ⏭️  Migración 004-anonimo ya aplicada
2026-01-29T22:08:00.157Z ⏭️  Migración 005-fechas-cliche ya aplicada
2026-01-29T22:08:00.158Z ⏭️  Migración 006-horas-confirmadas ya aplicada
2026-01-29T22:08:00.159Z ⏭️  Migración 007-antivaho-realizado ya aplicada
2026-01-29T22:08:00.160Z ⏭️  Migración 008-menciones-comentarios ya aplicada
2026-01-29T22:08:00.160Z ✅ Base de datos actualizada. No hay migraciones pendientes.
2026-01-29T22:08:00.160Z ✅ Migraciones completadas exitosamente
2026-01-29T22:08:00.160Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-29T22:08:00.161Z 🔧 Iniciando creación/verificación de tablas...
2026-01-29T22:08:00.161Z ✅ Extensión uuid-ossp verificada
2026-01-29T22:08:00.165Z ✅ Tabla admin_users verificada
2026-01-29T22:08:00.179Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-29T22:08:00.180Z ✅ Constraint de rol actualizado
2026-01-29T22:08:00.180Z 🔄 Verificando usuarios existentes...
2026-01-29T22:08:00.182Z ✅ Todos los usuarios ya están actualizados
2026-01-29T22:08:00.182Z ✅ Columnas de admin_users verificadas
2026-01-29T22:08:00.185Z ✅ Tabla user_permissions verificada
2026-01-29T22:08:00.185Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T22:08:00.186Z ✅ Tabla users verificada
2026-01-29T22:08:00.186Z ✅ Tabla audit_log verificada
2026-01-29T22:08:00.191Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T22:08:00.192Z ✅ Tabla pedido_comments creada
2026-01-29T22:08:00.193Z ✅ Tabla vendedores creada
2026-01-29T22:08:00.197Z ✅ Índices verificados
2026-01-29T22:08:00.207Z ✅ Triggers configurados
2026-01-29T22:08:00.212Z ✅ Columna vendedor_id verificada/creada
2026-01-29T22:08:00.212Z 🎉 Todas las tablas han sido verificadas/creadas exitosamente
2026-01-29T22:08:00.215Z 🚀 Servidor iniciado en puerto 3001
2026-01-29T22:08:00.215Z ✅ PostgreSQL conectado - Sistema operativo