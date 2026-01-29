2026-01-29T21:59:24.324Z [dotenv@17.2.2] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
2026-01-29T21:59:25.103Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T21:59:25.103Z 🔄 Intentando conectar a PostgreSQL...
2026-01-29T21:59:25.104Z 🔌 Iniciando conexión a DB (Intento 2)...
2026-01-29T21:59:25.110Z 👂 Event listeners del pool configurados
2026-01-29T21:59:25.253Z 🔗 Nueva conexión al pool establecida
2026-01-29T21:59:25.256Z ✅ PostgreSQL conectado correctamente
2026-01-29T21:59:25.257Z - Host: control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432
2026-01-29T21:59:25.262Z 🔄 Health checks periódicos iniciados (cada 10s)
2026-01-29T21:59:25.263Z 🐘 PostgreSQL conectado exitosamente
2026-01-29T21:59:25.263Z ✅ dbClient compartido con middlewares
2026-01-29T21:59:25.263Z 🚀 Iniciando sistema de migraciones...
2026-01-29T21:59:25.263Z 🔄 Verificando migraciones pendientes...
2026-01-29T21:59:25.270Z ✅ Tabla de migraciones verificada
2026-01-29T21:59:25.277Z ⏭️  Migración 000-initial-schema ya aplicada
2026-01-29T21:59:25.283Z ⏭️  Migración 001-nueva-fecha-entrega ya aplicada
2026-01-29T21:59:25.287Z ⏭️  Migración 002-numeros-compra ya aplicada
2026-01-29T21:59:25.290Z ⏭️  Migración 003-vendedor ya aplicada
2026-01-29T21:59:25.291Z ⏭️  Migración 004-anonimo ya aplicada
2026-01-29T21:59:25.294Z ⏭️  Migración 005-fechas-cliche ya aplicada
2026-01-29T21:59:25.295Z ⏭️  Migración 006-horas-confirmadas ya aplicada
2026-01-29T21:59:25.297Z ⏭️  Migración 007-antivaho-realizado ya aplicada
2026-01-29T21:59:25.302Z 🔄 Aplicando migración: Agregar sistema de menciones en comentarios...
2026-01-29T21:59:25.334Z ❌ Error en migración 008-menciones-comentarios: relation "limpio.pedido_comments" does not exist
2026-01-29T21:59:25.369Z 🔗 Nueva conexión al pool establecida
2026-01-29T21:59:25.373Z ✅ Proceso de migraciones completado. 1 migraciones procesadas.
2026-01-29T21:59:25.373Z ✅ Migraciones completadas exitosamente
2026-01-29T21:59:25.373Z 🏗️ Verificando estructura de tablas complementarias...
2026-01-29T21:59:25.373Z 🔧 Iniciando creación/verificación de tablas...
2026-01-29T21:59:25.375Z ✅ Extensión uuid-ossp verificada
2026-01-29T21:59:25.383Z ✅ Tabla admin_users verificada
2026-01-29T21:59:25.401Z 📋 Columnas existentes en admin_users: id, username, email, first_name, last_name, password_hash, role, permissions, is_active, last_login, last_activity, ip_address, user_agent, created_at, updated_at
2026-01-29T21:59:25.413Z ✅ Constraint de rol actualizado
2026-01-29T21:59:25.414Z 🔄 Verificando usuarios existentes...
2026-01-29T21:59:25.414Z ✅ Todos los usuarios ya están actualizados
2026-01-29T21:59:25.414Z ✅ Columnas de admin_users verificadas
2026-01-29T21:59:25.423Z ✅ Tabla user_permissions verificada
2026-01-29T21:59:25.424Z ✅ Tabla pedidos verificada (creada por migración)
2026-01-29T21:59:25.424Z ✅ Tabla users verificada
2026-01-29T21:59:25.428Z ✅ Tabla audit_log verificada
2026-01-29T21:59:25.441Z ⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)
2026-01-29T21:59:25.441Z ✅ Tabla pedido_comments creada
2026-01-29T21:59:25.441Z ✅ Tabla vendedores creada
2026-01-29T21:59:25.442Z ❌ Error al conectar a PostgreSQL: relation "pedidos" does not exist
2026-01-29T21:59:25.442Z 🚨 El servidor no puede continuar sin base de datos