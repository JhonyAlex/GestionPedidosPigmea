2026-01-29T21:53:14.833Z [dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
2026-01-29T21:53:15.921Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T21:53:15.922Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T21:53:15.925Z 👂 Event listeners del pool configurados
2026-01-29T21:53:16.132Z 🔗 Nueva conexión al pool establecida
2026-01-29T21:53:16.135Z ✅ PostgreSQL conectado correctamente
2026-01-29T21:53:16.140Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-29T21:53:16.141Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-29T21:53:16.143Z 🐘 PostgreSQL conectado exitosamente
2026-01-29T21:53:16.146Z ✅ dbClient compartido con middlewares
2026-01-29T21:53:16.146Z 🚀 Iniciando sistema de migraciones...
2026-01-29T21:53:16.147Z 🔄 Verificando migraciones pendientes...
2026-01-29T21:53:16.158Z ❌ Error creando tabla de migraciones: schema "limpio" does not exist
2026-01-29T21:53:16.165Z ❌ Error ejecutando migraciones: schema "limpio" does not exist
2026-01-29T21:53:16.166Z ⚠️ Algunas migraciones fallaron: schema "limpio" does not exist
2026-01-29T21:53:16.166Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-29T21:53:16.215Z 🔗 Nueva conexión al pool establecida
2026-01-29T21:53:16.217Z 🔧 Iniciando creación/verificación de tablas...
2026-01-29T21:53:16.223Z ✅ Extensión uuid-ossp verificada
2026-01-29T21:53:16.229Z ✅ Tabla admin_users verificada
2026-01-29T21:53:16.255Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-29T21:53:16.265Z ✅ Constraint de rol actualizado
2026-01-29T21:53:16.266Z 🔄 Verificando usuarios existentes...
2026-01-29T21:53:16.268Z ✅ Todos los usuarios ya están actualizados
2026-01-29T21:53:16.270Z ✅ Columnas de admin_users verificadas
2026-01-29T21:53:16.276Z ✅ Tabla user_permissions verificada
2026-01-29T21:53:16.278Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T21:53:16.278Z ✅ Tabla users verificada
2026-01-29T21:53:16.280Z ✅ Tabla audit_log verificada
2026-01-29T21:53:16.287Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T21:53:16.289Z ✅ Tabla pedido_comments creada
2026-01-29T21:53:16.290Z ✅ Tabla vendedores creada
2026-01-29T21:53:16.296Z ❌ Error al conectar a PostgreSQL: relation "pedidos" does not exist
2026-01-29T21:53:16.296Z 🚨 El servidor no puede continuar sin base de datos