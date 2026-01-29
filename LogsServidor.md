2026-01-29T21:49:53.665Z [dotenv@17.2.2] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
2026-01-29T21:49:54.181Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T21:49:54.182Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T21:49:54.182Z 👂 Event listeners del pool configurados
2026-01-29T21:49:54.306Z 🔗 Nueva conexión al pool establecida
2026-01-29T21:49:54.307Z ✅ PostgreSQL conectado correctamente
2026-01-29T21:49:54.308Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-29T21:49:54.322Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-29T21:49:54.322Z 🐘 PostgreSQL conectado exitosamente
2026-01-29T21:49:54.322Z ✅ dbClient compartido con middlewares
2026-01-29T21:49:54.322Z 🚀 Iniciando sistema de migraciones...
2026-01-29T21:49:54.322Z 🔄 Verificando migraciones pendientes...
2026-01-29T21:49:54.322Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-29T21:49:54.323Z ❌ Error creando tabla de migraciones: schema "limpio" does not exist
2026-01-29T21:49:54.323Z ❌ Error ejecutando migraciones: schema "limpio" does not exist
2026-01-29T21:49:54.323Z ⚠️ Algunas migraciones fallaron: schema "limpio" does not exist
2026-01-29T21:49:54.359Z 🔗 Nueva conexión al pool establecida
2026-01-29T21:49:54.359Z 🔧 Iniciando creación/verificación de tablas...
2026-01-29T21:49:54.366Z ✅ Extensión uuid-ossp verificada
2026-01-29T21:49:54.370Z ✅ Tabla admin_users verificada
2026-01-29T21:49:54.386Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-29T21:49:54.391Z ✅ Constraint de rol actualizado
2026-01-29T21:49:54.391Z 🔄 Verificando usuarios existentes...
2026-01-29T21:49:54.391Z ✅ Todos los usuarios ya están actualizados
2026-01-29T21:49:54.391Z ✅ Columnas de admin_users verificadas
2026-01-29T21:49:54.400Z ✅ Tabla user_permissions verificada
2026-01-29T21:49:54.400Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T21:49:54.400Z ✅ Tabla users verificada
2026-01-29T21:49:54.401Z ✅ Tabla audit_log verificada
2026-01-29T21:49:54.407Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T21:49:54.409Z ✅ Tabla pedido_comments creada
2026-01-29T21:49:54.409Z ✅ Tabla vendedores creada
2026-01-29T21:49:54.410Z ❌ Error al conectar a PostgreSQL: relation "pedidos" does not exist
2026-01-29T21:49:54.411Z 🚨 El servidor no puede continuar sin base de datos