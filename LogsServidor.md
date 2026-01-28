2026-01-28T16:16:27.974Z 📜 Ejecutando migraciones de la base de datos...
2026-01-28T16:16:27.977Z === INICIANDO SCRIPT DE MIGRACIÓN DE BASE DE DATOS ===
2026-01-28T16:16:27.978Z ✅ Usando DATABASE_URL para la conexión.
2026-01-28T16:16:27.978Z 🔄 Aplicando migración: Agregar Menciones a Comentarios...
2026-01-28T16:16:28.031Z DO
2026-01-28T16:16:28.042Z DO
2026-01-28T16:16:28.042Z psql:/app/database/migrations/032-add-mentions-to-comments.sql:39: NOTICE:  Columna mentioned_users ya existe en pedido_comments
2026-01-28T16:16:28.043Z psql:/app/database/migrations/032-add-mentions-to-comments.sql:43: NOTICE:  relation "idx_pedido_comments_mentioned_users_gin" already exists, skipping
2026-01-28T16:16:28.043Z CREATE INDEX
2026-01-28T16:16:28.043Z psql:/app/database/migrations/032-add-mentions-to-comments.sql:48: NOTICE:  relation "idx_pedido_comments_mentions" already exists, skipping
2026-01-28T16:16:28.043Z CREATE INDEX
2026-01-28T16:16:28.048Z psql:/app/database/migrations/032-add-mentions-to-comments.sql:66: NOTICE:  Tipo "mention" agregado a la documentación de notifications.type
2026-01-28T16:16:28.049Z DO
2026-01-28T16:16:28.050Z psql:/app/database/migrations/032-add-mentions-to-comments.sql:91: ERROR:  cannot change return type of existing function
2026-01-28T16:16:28.050Z DETAIL:  Row type defined by OUT parameters is different.
2026-01-28T16:16:28.050Z HINT:  Use DROP FUNCTION get_comments_mentioning_user(uuid) first.
2026-01-28T16:16:28.052Z ❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.