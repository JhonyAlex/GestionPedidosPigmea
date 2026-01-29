2026-01-29T21:40:10.198Z [dotenv@17.2.2] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
2026-01-29T21:40:11.051Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T21:40:11.054Z 👂 Event listeners del pool configurados
2026-01-29T21:40:11.302Z 🔗 Nueva conexión al pool establecida
2026-01-29T21:40:11.307Z ✅ PostgreSQL conectado correctamente
2026-01-29T21:40:11.307Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-29T21:40:11.307Z - Database: desde DATABASE_URL
2026-01-29T21:40:11.307Z - Max connections: 20
2026-01-29T21:40:11.310Z 🔧 Iniciando creación/verificación de tablas...
2026-01-29T21:40:11.315Z ✅ Extensión uuid-ossp verificada
2026-01-29T21:40:11.334Z ✅ Tabla admin_users verificada
2026-01-29T21:40:11.365Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-29T21:40:11.374Z ✅ Constraint de rol actualizado
2026-01-29T21:40:11.375Z 🔄 Verificando usuarios existentes...
2026-01-29T21:40:11.379Z ✅ Todos los usuarios ya están actualizados
2026-01-29T21:40:11.379Z ✅ Columnas de admin_users verificadas
2026-01-29T21:40:11.398Z ✅ Tabla user_permissions verificada
2026-01-29T21:40:11.398Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T21:40:11.398Z ✅ Tabla users verificada
2026-01-29T21:40:11.398Z ✅ Tabla audit_log verificada
2026-01-29T21:40:11.398Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T21:40:11.406Z ❌ Error conectando a PostgreSQL: relation "pedidos" does not exist
2026-01-29T21:40:11.406Z 🚨 ERROR CRÍTICO EN PRODUCCIÓN: La base de datos NO está disponible
2026-01-29T21:40:11.406Z 🚨 El sistema NO puede funcionar sin base de datos
2026-01-29T21:40:11.406Z 🚨 Deteniendo la aplicación...
2026-01-29T21:40:11.406Z ❌ Error al conectar a PostgreSQL: CRITICAL: Database connection failed in production
2026-01-29T21:40:11.406Z 🚨 El servidor no puede continuar sin base de datos
2026-01-29T21:40:11.410Z ✅ Tabla pedido_comments creada
2026-01-29T21:40:11.410Z ✅ Tabla vendedores creada