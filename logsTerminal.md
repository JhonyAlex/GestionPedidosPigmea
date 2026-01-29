root@pigmea-server:~# # Ver estructura de todas las tablas en limpio
docker exec cf17c9b43101 psql -U pigmea_user -d gestion_pedidos -c "
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'limpio'
ORDER BY table_name, ordinal_position;
cat /tmp/limpio_structure.txt
    table_name    |           column_name           |          data_type          | character_maximum_length |            column_default             | is_nullable
------------------+---------------------------------+-----------------------------+--------------------------+---------------------------------------+-------------
 admin_users      | id                              | uuid                        |          
                | uuid_generate_v4()                    | NO
 admin_users      | username                        | character varying           |          
             50 |                                       | NO
 admin_users      | email                           | character varying           |          
            255 |                                       | NO
 admin_users      | first_name                      | character varying           |          
            100 |                                       | NO
 admin_users      | last_name                       | character varying           |          
            100 |                                       | NO
 admin_users      | password_hash                   | character varying           |          
            255 |                                       | NO
 admin_users      | role                            | character varying           |          
             20 |                                       | NO
 admin_users      | permissions                     | jsonb                       |          
                | '[]'::jsonb                           | YES
 admin_users      | is_active                       | boolean                     |          
                | true                                  | YES
 admin_users      | last_login                      | timestamp with time zone    |          
                |                                       | YES
 admin_users      | last_activity                   | timestamp with time zone    |          
                |                                       | YES
 admin_users      | ip_address                      | inet                        |          
                |                                       | YES
 admin_users      | user_agent                      | text                        |          
                |                                       | YES
 admin_users      | created_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 admin_users      | updated_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 audit_log        | id                              | integer                     |          
                | nextval('audit_log_id_seq'::regclass) | NO
 audit_log        | timestamp                       | timestamp without time zone |          
                | CURRENT_TIMESTAMP                     | YES
 audit_log        | user_role                       | character varying           |          
             50 |                                       | NO
 audit_log        | action                          | text                        |          
                |                                       | NO
 audit_log        | pedido_id                       | character varying           |          
            255 |                                       | YES
 audit_log        | details                         | jsonb                       |          
                |                                       | YES
 audit_logs       | id                              | uuid                        |          
                | uuid_generate_v4()                    | NO
 audit_logs       | user_id                         | uuid                        |          
                |                                       | YES
 audit_logs       | username                        | character varying           |          
             50 |                                       | NO
 audit_logs       | action                          | character varying           |          
            100 |                                       | NO
 audit_logs       | module                          | character varying           |          
             50 |                                       | NO
 audit_logs       | details                         | text                        |          
                |                                       | YES
 audit_logs       | ip_address                      | inet                        |          
                |                                       | YES
 audit_logs       | user_agent                      | text                        |          
                |                                       | YES
 audit_logs       | affected_resource               | uuid                        |          
                |                                       | YES
 audit_logs       | metadata                        | jsonb                       |          
                | '{}'::jsonb                           | YES
 audit_logs       | created_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 clientes         | id                              | uuid                        |          
                | uuid_generate_v4()                    | NO
 clientes         | nombre                          | character varying           |          
            255 |                                       | NO
 clientes         | contacto_principal              | character varying           |          
            255 |                                       | YES
 clientes         | telefono                        | character varying           |          
             50 |                                       | YES
 clientes         | email                           | character varying           |          
            255 |                                       | YES
 clientes         | direccion                       | text                        |          
                |                                       | YES
 clientes         | comentarios                     | text                        |          
                |                                       | YES
 clientes         | estado                          | character varying           |          
             20 | 'activo'::character varying           | NO
 clientes         | created_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 clientes         | updated_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 pedido_comments  | id                              | uuid                        |          
                | uuid_generate_v4()                    | NO
 pedido_comments  | pedido_id                       | character varying           |          
             50 |                                       | NO
 pedido_comments  | user_id                         | uuid                        |          
                |                                       | YES
 pedido_comments  | user_role                       | character varying           |          
             20 |                                       | NO
 pedido_comments  | username                        | character varying           |          
             50 |                                       | NO
 pedido_comments  | message                         | text                        |          
                |                                       | NO
 pedido_comments  | is_system_message               | boolean                     |          
                | false                                 | YES
 pedido_comments  | is_edited                       | boolean                     |          
                | false                                 | YES
 pedido_comments  | edited_at                       | timestamp with time zone    |          
                |                                       | YES
 pedido_comments  | created_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 pedido_comments  | updated_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 pedidos          | id                              | character varying           |          
            255 |                                       | NO
 pedidos          | numero_pedido                   | character varying           |          
            255 |                                       | YES
 pedidos          | cliente                         | character varying           |          
            255 |                                       | YES
 pedidos          | cliente_id                      | uuid                        |          
                |                                       | YES
 pedidos          | producto                        | text                        |          
                |                                       | YES
 pedidos          | orden                           | integer                     |          
                |                                       | YES
 pedidos          | metros                          | integer                     |          
                |                                       | YES
 pedidos          | colores                         | integer                     |          
                |                                       | YES
 pedidos          | capa                            | text                        |          
                |                                       | YES
 pedidos          | camisa                          | text                        |          
                |                                       | YES
 pedidos          | min_adap                        | integer                     |          
                |                                       | YES
 pedidos          | min_color                       | integer                     |          
                |                                       | YES
 pedidos          | anonimo                         | boolean                     |          
                | false                                 | YES
 pedidos          | antivaho                        | boolean                     |          
                | false                                 | YES
 pedidos          | antivaho_realizado              | boolean                     |          
                | false                                 | YES
 pedidos          | fecha_pedido                    | timestamp without time zone |          
                |                                       | YES
 pedidos          | fecha_entrega                   | date                        |          
                |                                       | YES
 pedidos          | nueva_fecha_entrega             | date                        |          
                |                                       | YES
 pedidos          | estado                          | character varying           |          
            100 | 'pendiente'::character varying        | YES
 pedidos          | observaciones                   | text                        |          
                |                                       | YES
 pedidos          | numeros_compra                  | text                        |          
                |                                       | YES
 pedidos          | vendedor                        | character varying           |          
            255 |                                       | YES
 pedidos          | vendedor_id                     | uuid                        |          
                |                                       | YES
 pedidos          | cliche_info                     | text                        |          
                |                                       | YES
 pedidos          | historial                       | jsonb                       |          
                | '[]'::jsonb                           | YES
 pedidos          | created_at                      | timestamp without time zone |          
                | CURRENT_TIMESTAMP                     | YES
 pedidos          | updated_at                      | timestamp without time zone |          
                | CURRENT_TIMESTAMP                     | YES
 pedidos          | locked_by                       | integer                     |          
                |                                       | YES
 pedidos          | locked_at                       | timestamp without time zone |          
                |                                       | YES
 pedidos          | atencion_observaciones          | boolean                     |          
                | false                                 | YES
 pedidos          | etapa_actual                    | character varying           |          
            100 |                                       | YES
 pedidos          | prioridad                       | character varying           |          
             50 |                                       | YES
 pedidos          | secuencia_pedido                | integer                     |          
                |                                       | YES
 pedidos          | cantidad_piezas                 | integer                     |          
                |                                       | YES
 pedidos          | datos_tecnicos                  | jsonb                       |          
                |                                       | YES
 pedidos          | data                            | jsonb                       |          
                | '{}'::jsonb                           | YES
 pedidos          | numero_pedido_cliente           | character varying           |          
            255 |                                       | YES
 pedidos          | compra_cliche                   | date                        |          
                |                                       | YES
 pedidos          | recepcion_cliche                | date                        |          
                |                                       | YES
 pedidos          | microperforado                  | boolean                     |          
                | false                                 | YES
 pedidos          | macroperforado                  | boolean                     |          
                | false                                 | YES
 pedidos          | anonimo_post_impresion          | character varying           |          
            100 |                                       | YES
 pedidos          | observaciones_material          | text                        |          
                |                                       | YES
 pedidos          | velocidad_posible               | numeric                     |          
                |                                       | YES
 pedidos          | tiempo_produccion_decimal       | numeric                     |          
                |                                       | YES
 pedidos          | operador_actual_id              | uuid                        |          
                |                                       | YES
 pedidos          | operador_actual_nombre          | character varying           |          
            255 |                                       | YES
 pedidos          | operacion_en_curso_id           | uuid                        |          
                |                                       | YES
 pedidos          | metros_producidos               | numeric                     |          
                | 0                                     | YES
 pedidos          | metros_restantes                | numeric                     |          
                | 0                                     | YES
 pedidos          | porcentaje_completado           | numeric                     |          
                | 0                                     | YES
 pedidos          | tiempo_real_produccion_segundos | integer                     |          
                | 0                                     | YES
 pedidos          | observaciones_rapidas           | ARRAY                       |          
                |                                       | YES
 pedidos          | horas_confirmadas               | boolean                     |          
                | false                                 | YES
 user_permissions | id                              | uuid                        |          
                | uuid_generate_v4()                    | NO
 user_permissions | user_id                         | uuid                        |          
                |                                       | YES
 user_permissions | permission_id                   | character varying           |          
            100 |                                       | NO
 user_permissions | enabled                         | boolean                     |          
                | true                                  | YES
 user_permissions | granted_by                      | uuid                        |          
                |                                       | YES
 user_permissions | created_at                      | timestamp without time zone |          
                | CURRENT_TIMESTAMP                     | YES
 user_permissions | updated_at                      | timestamp without time zone |          
                | CURRENT_TIMESTAMP                     | YES
 users            | id                              | character varying           |          
            255 |                                       | NO
 users            | username                        | character varying           |          
            100 |                                       | NO
 users            | password                        | character varying           |          
            255 |                                       | NO
 users            | role                            | character varying           |          
             50 | 'Operador'::character varying         | NO
 users            | display_name                    | character varying           |          
            255 |                                       | YES
 users            | created_at                      | timestamp without time zone |          
                | CURRENT_TIMESTAMP                     | YES
 users            | last_login                      | timestamp without time zone |          
                |                                       | YES
 vendedores       | id                              | uuid                        |          
                | uuid_generate_v4()                    | NO
 vendedores       | nombre                          | character varying           |          
            255 |                                       | NO
 vendedores       | email                           | character varying           |          
            255 |                                       | YES
 vendedores       | telefono                        | character varying           |          
             50 |                                       | YES
 vendedores       | activo                          | boolean                     |          
                | true                                  | YES
 vendedores       | created_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
 vendedores       | updated_at                      | timestamp with time zone    |          
                | CURRENT_TIMESTAMP                     | YES
(128 rows)

root@pigmea-server:~# # Listar todas las tablas en limpio y public
docker exec cf17c9b43101 psql -U pigmea_user -d gestion_pedidos -c "
SELECT table_schema, table_name, 
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as num_columns
FROM information_schema.tables t
WHERE table_schema IN ('limpio', 'public')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
"
 table_schema |          table_name           | num_columns 
--------------+-------------------------------+-------------
 limpio       | admin_users                   |          15
 limpio       | audit_log                     |           6
 limpio       | audit_logs                    |          11
 limpio       | clientes                      |          10
 limpio       | pedido_comments               |          11
 limpio       | pedidos                       |          54
 limpio       | user_permissions              |           7
 limpio       | users                         |           7
 limpio       | vendedores                    |           7
 public       | action_history                |          10
 public       | analysis_instructions         |           5
 public       | audit_log                     |           6
 public       | audit_logs                    |          11
 public       | clientes_history              |          12
 public       | materiales                    |           7
 public       | metraje_produccion            |          10
 public       | notifications                 |          10
 public       | observaciones_produccion      |           8
 public       | observaciones_templates       |           6
 public       | operaciones_produccion        |          18
 public       | pausas_operacion              |           7
 public       | pedido_comments               |          12
 public       | pedidos_backup_numeros_compra |           2
 public       | pedidos_materiales            |           4
 public       | user_permissions              |           7
 public       | users                         |           7
 public       | vendedores                    |           7
 public       | vendedores_history            |          12
(28 rows)

root@pigmea-server:~#