2025-12-21T12:15:53.069Z 📜 Ejecutando migraciones de la base de datos...
2025-12-21T12:15:53.070Z === INICIANDO SCRIPT DE MIGRACIÓN DE BASE DE DATOS ===
2025-12-21T12:15:53.070Z Cargando variables de entorno desde .env...
2025-12-21T12:15:53.074Z ✅ Usando DATABASE_URL para la conexión.
2025-12-21T12:15:53.074Z ✅ Variables de conexión configuradas.
2025-12-21T12:15:53.075Z 🔄 Aplicando migración: Crear Tabla de Pedidos...
2025-12-21T12:15:53.112Z CREATE TABLE
2025-12-21T12:15:53.112Z psql:../database/migrations/000-create-pedidos-table.sql:21: NOTICE:  relation "pedidos" already exists, skipping
2025-12-21T12:15:53.113Z psql:../database/migrations/000-create-pedidos-table.sql:23: NOTICE:  relation "idx_pedidos_etapa" already exists, skipping
2025-12-21T12:15:53.113Z CREATE INDEX
2025-12-21T12:15:53.114Z CREATE INDEX
2025-12-21T12:15:53.114Z psql:../database/migrations/000-create-pedidos-table.sql:24: NOTICE:  relation "idx_pedidos_cliente" already exists, skipping
2025-12-21T12:15:53.114Z psql:../database/migrations/000-create-pedidos-table.sql:25: NOTICE:  relation "idx_pedidos_fecha_entrega" already exists, skipping
2025-12-21T12:15:53.114Z CREATE INDEX
2025-12-21T12:15:53.115Z psql:../database/migrations/000-create-pedidos-table.sql:26: NOTICE:  relation "idx_pedidos_secuencia" already exists, skipping
2025-12-21T12:15:53.115Z CREATE INDEX
2025-12-21T12:15:53.117Z ✅ Migración 'Crear Tabla de Pedidos' aplicada exitosamente.
2025-12-21T12:15:53.117Z ❌ Error: Archivo de migración no encontrado: ../database/migrations/create_user_permissions_table.sql
2025-12-21T12:15:53.117Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.