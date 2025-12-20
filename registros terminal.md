root@pigmea-server:~# docker exec -i b03f8648f450 psql -U pigmea_user -d gestion_pedidos <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO pigmea_user;
GRANT ALL ON SCHEMA public TO public;
EOF
NOTICE:  drop cascades to 32 other objects
DETAIL:  drop cascades to table pedidos
drop cascades to extension uuid-ossp
drop cascades to table admin_users
drop cascades to table user_permissions
drop cascades to function update_modified_column()
drop cascades to table clientes
drop cascades to function obtener_estadisticas_clientes()
drop cascades to table clientes_history
drop cascades to table vendedores_history
drop cascades to table notifications
drop cascades to table operaciones_produccion
drop cascades to table pausas_operacion
drop cascades to table metraje_produccion
drop cascades to table observaciones_produccion
drop cascades to function actualizar_estadisticas_pedido()
drop cascades to function calcular_duracion_pausa()
drop cascades to view v_estadisticas_operador_hoy
drop cascades to view v_pedidos_disponibles_produccion
drop cascades to table materiales
drop cascades to function update_materiales_updated_at()
drop cascades to table pedidos_materiales
drop cascades to table users
drop cascades to table audit_log
drop cascades to table audit_logs
drop cascades to table pedido_comments
drop cascades to table vendedores
drop cascades to function update_updated_at_column()
drop cascades to extension pg_trgm
drop cascades to function search_numeros_compra(text)
drop cascades to function set_updated_at()
drop cascades to table pedidos_backup_numeros_compra
drop cascades to view v_operaciones_activas
DROP SCHEMA
CREATE SCHEMA
GRANT
GRANT
root@pigmea-server:~# docker exec -i b03f8648f450 psql -U pigmea_user -d gestion_pedidos < ~/GestionPedidosPigmea/database/migrations/*.sql
-bash: /root/GestionPedidosPigmea/database/migrations/*.sql: No such file or directory
root@pigmea-server:~# cat ~/backup_final.sql | \
  grep -A 10000 "COPY public" | \
  grep -v "CREATE\|ALTER\|DROP\|COMMENT" | \
  docker exec -i b03f8648f450 psql -U pigmea_user -d gestion_pedidos 2>&1 | tee ~/restore_data.log
ERROR:  relation "public.admin_users" does not exist
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "8"
LINE 1: 8 Jhony1010 $2a$12$NhF55jubeP6m.qlf8a9TUOckQnSqpOCmp4Baqext3...
        ^
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "1"
LINE 1: 1 2025-09-01 11:02:18.476301 Administrador Pedido prueba 123...
        ^
invalid command \.
ERROR:  relation "public.clientes" does not exist
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "dc8cb9d9"
LINE 1: dc8cb9d9-de1e-4404-ac43-33831a3ab017 Antivaho prueba
        ^
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "1"
LINE 1: 1 370aa304-2d39-46cc-9c38-7bde6dc2dc61 2025-11-03 19:08:32.6...
        ^
invalid command \.
ERROR:  relation "public.metraje_produccion" does not exist
invalid command \.
ERROR:  relation "public.notifications" does not exist
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "notif"
LINE 1: notif-1766053548369-zvystckvw info Pedido actualizado 250695...
        ^
invalid command \.
ERROR:  relation "public.operaciones_produccion" does not exist
invalid command \.
ERROR:  relation "public.pausas_operacion" does not exist
invalid command \.
ERROR:  relation "public.pedido_comments" does not exist
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  trailing junk after numeric literal at or near "082bc679"
LINE 1: 082bc679-e236-4d8a-b14b-16b0306b1d22 1757667997454 6ed955c6-...
        ^
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "1765450458028"
LINE 1: 1765450458028 2506281 VITACRESS
        ^
ERROR:  syntax error at or near "1760892529278"
LINE 1: 1760892529278 123654
        ^
ERROR:  syntax error at or near "EKP"
LINE 1: EKP-33667;
        ^
ERROR:  syntax error at or near "EKP"
LINE 1: EKP-33668
        ^
invalid command \.
ERROR:  syntax error at or near "EKP"
LINE 1: EKP-33666
        ^
invalid command \.
ERROR:  relation "public.user_permissions" does not exist
invalid command \.
ERROR:  relation "public.users" does not exist
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "user"
LINE 1: user-1756969428311-015bzy7bg admin11 admin123 Administrador ...
        ^
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  trailing junk after numeric literal at or near "16d7cb74"
LINE 1: 16d7cb74-35da-4c17-bc40-4f883941c8c8 ANGEL VILCHEZ
        ^
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \N
invalid command \.
ERROR:  syntax error at or near "1"
LINE 1: 1 a92b21ce-de5c-4a3c-bbc2-2a86324feda8 2025-11-03 19:08:49.8...
        ^
ERROR:  relation "public.audit_log_id_seq" does not exist
LINE 1: SELECT pg_catalog.setval('public.audit_log_id_seq', 1447, tr...
                                 ^
ERROR:  relation "public.clientes_history_id_seq" does not exist
LINE 1: SELECT pg_catalog.setval('public.clientes_history_id_seq', 6...
                                 ^
ERROR:  relation "public.materiales_id_seq" does not exist
LINE 1: SELECT pg_catalog.setval('public.materiales_id_seq', 1, fals...
                                 ^
ERROR:  relation "public.pedidos_materiales_id_seq" does not exist
LINE 1: SELECT pg_catalog.setval('public.pedidos_materiales_id_seq',...
                                 ^
ERROR:  relation "public.vendedores_history_id_seq" does not exist
LINE 1: SELECT pg_catalog.setval('public.vendedores_history_id_seq',...
                                 ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT admin_users_email_key UNIQUE (email);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT admin_users_username_key UNIQUE (username);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT clientes_history_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT materiales_numero_key UNIQUE (numero);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT materiales_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT metraje_produccion_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT observaciones_produccion_pkey PRIMARY KEY (id...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT operaciones_produccion_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT pausas_operacion_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT pedido_comments_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT pedidos_materiales_pedido_id_material_id_key ...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT pedidos_materiales_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT uq_clientes_nombre UNIQUE (nombre);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT user_permissions_user_id_permission_id_key UN...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT users_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT users_username_key UNIQUE (username);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT vendedores_history_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT vendedores_nombre_key UNIQUE (nombre);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT vendedores_pkey PRIMARY KEY (id);
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_metraje_operacion FOREIGN KEY (operacion_i...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_metraje_pedido FOREIGN KEY (pedido_id) REF...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_observacion_operacion FOREIGN KEY (operaci...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_observacion_pedido FOREIGN KEY (pedido_id)...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_operacion_pedido FOREIGN KEY (pedido_id) R...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_pausa_operacion FOREIGN KEY (operacion_id)...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_pedidos_cliente_id FOREIGN KEY (cliente_id...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT fk_pedidos_vendedor FOREIGN KEY (vendedor_id)...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT pedidos_materiales_material_id_fkey FOREIGN K...
        ^
ERROR:  syntax error at or near "ADD"
LINE 1: ADD CONSTRAINT pedidos_materiales_pedido_id_fkey FOREIGN KEY...
        ^
\unrestrict: not currently in restricted mode
root@pigmea-server:~# docker exec -i b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) FROM pedidos;"
ERROR:  relation "pedidos" does not exist
LINE 1: SELECT COUNT(*) FROM pedidos;
                             ^
root@pigmea-server:~#