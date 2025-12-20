root@pigmea-server:~# docker exec -it b03f8648f450 psql -U pigmea_user -d gestion_pedidos -c "SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables;"
 schemaname |         relname          | n_live_tup
------------+--------------------------+------------
 public     | pedido_comments          |          0
 public     | pausas_operacion         |          0
 public     | vendedores_history       |          0
 public     | clientes                 |          0
 public     | metraje_produccion       |          0
 public     | vendedores               |          0
 public     | audit_log                |          0
 public     | audit_logs               |          0
 public     | observaciones_produccion |          0
 public     | pedidos_materiales       |          0
 public     | admin_users              |          0
 public     | pedidos                  |          0
 public     | clientes_history         |          0
 public     | materiales               |          0
 public     | notifications            |          0
 public     | operaciones_produccion   |          0
 public     | users                    |          0
 public     | user_permissions         |          0
(18 rows)

root@pigmea-server:~#