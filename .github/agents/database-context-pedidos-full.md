# Contexto de Base de Datos - Sistema de Pedidos

Fecha de documento: 2026-03-12
Fuente analizada: backup_pedidos.sql
Motor origen: PostgreSQL 15.17 (pg_dump 15.17)

## Objetivo
Este archivo da contexto operativo a cualquier agente IA antes de hacer cambios en estructura, datos o rendimiento.
La idea es evitar cambios a ciegas y tener claro como esta organizada la base.

## Resumen tecnico rapido
- Schemas: 2 (limpio, public)
- Tablas: 21
- Funciones: 4
- Triggers: 6
- Secuencias: 3
- Vistas: 0
- Extension: uuid-ossp (en schema public)

## Mapa funcional por schema

### Schema limpio (negocio de pedidos)
- clientes: maestro de clientes.
- clientes_history: historial de cambios de clientes.
- materiales: catalogo de materiales.
- migrations: control de migraciones aplicadas.
- pdf_import_configs: reglas de importacion de pedidos desde PDF.
- pedido_comments: comentarios de pedidos con soporte de menciones (JSONB).
- pedidos: entidad principal del proceso productivo/comercial.
- pedidos_materiales: tabla puente N:M entre pedidos y materiales.
- vendedores: maestro de vendedores.
- vendedores_history: historial de cambios de vendedores.

### Schema public (seguridad, auditoria y soporte)
- action_history: historial de acciones del sistema.
- admin_users: usuarios administrativos y permisos base.
- analysis_instructions: instrucciones de analisis (config funcional).
- audit_log: auditoria funcional por rol/accion.
- audit_logs: auditoria tecnica por usuario admin.
- notifications: notificaciones de sistema.
- observaciones_templates: plantillas de observaciones.
- pedido_comments: segunda implementacion de comentarios (sin mentioned_users).
- user_permissions: permisos granulares por admin_user.
- users: usuarios legacy (separado de admin_users).
- vendedores: segunda implementacion de vendedores.

## Dependencias y relaciones (FK)
- limpio.clientes_history.cliente_id -> limpio.clientes.id (ON DELETE CASCADE)
- limpio.pedidos.vendedor_id -> limpio.vendedores.id (ON DELETE SET NULL)
- limpio.pdf_import_configs.cliente_id -> limpio.clientes.id (ON DELETE SET NULL)
- limpio.pedidos_materiales.material_id -> limpio.materiales.id (ON DELETE CASCADE)
- limpio.pedidos_materiales.pedido_id -> limpio.pedidos.id (ON DELETE CASCADE)
- limpio.vendedores_history.vendedor_id -> limpio.vendedores.id (ON DELETE CASCADE)
- public.audit_logs.user_id -> public.admin_users.id (ON DELETE SET NULL)
- public.user_permissions.granted_by -> public.admin_users.id
- public.user_permissions.user_id -> public.admin_users.id (ON DELETE CASCADE)

## Triggers y funciones

### Funciones
- limpio.update_modified_column(): actualiza updated_at con CURRENT_TIMESTAMP.
- public.debug_vendedor_update(): emite NOTICE al actualizar limpio.vendedores.
- public.update_modified_column(): actualiza updated_at con now().
- public.update_updated_at_column(): actualiza updated_at con CURRENT_TIMESTAMP.

### Triggers
- debug_vendedor_update_trigger: BEFORE UPDATE en limpio.vendedores.
- update_pdf_import_configs_modified: BEFORE UPDATE en limpio.pdf_import_configs.
- update_pedidos_updated_at: BEFORE UPDATE en limpio.pedidos.
- update_vendedores_updated_at: BEFORE UPDATE en limpio.vendedores.
- update_admin_users_updated_at: BEFORE UPDATE en public.admin_users.
- update_user_permissions_modtime: BEFORE UPDATE en public.user_permissions.

## Secuencias y columnas autogeneradas
- limpio.pedidos_secuencia_pedido_seq -> limpio.pedidos.secuencia_pedido
- public.analysis_instructions_id_seq -> public.analysis_instructions.id
- public.audit_log_id_seq -> public.audit_log.id

## Volumen aproximado de datos en el backup (COPY)

| Tabla | Filas |
|---|---:|
| limpio.clientes | 124 |
| limpio.clientes_history | 93 |
| limpio.materiales | 0 |
| limpio.migrations | 21 |
| limpio.pdf_import_configs | 1 |
| limpio.pedido_comments | 8 |
| limpio.pedidos | 819 |
| limpio.pedidos_materiales | 0 |
| limpio.vendedores | 18 |
| limpio.vendedores_history | 13 |
| public.action_history | 2610 |
| public.admin_users | 4 |
| public.analysis_instructions | 2 |
| public.audit_log | 2364 |
| public.audit_logs | 10 |
| public.notifications | 51 |
| public.observaciones_templates | 2 |
| public.pedido_comments | 0 |
| public.user_permissions | 0 |
| public.users | 0 |
| public.vendedores | 0 |

## Diccionario de tablas (columnas)

### limpio.clientes
- PK: id
- Columnas:
  - id uuid DEFAULT gen_random_uuid() NOT NULL
  - nombre varchar(255) NOT NULL
  - razon_social varchar(255)
  - cif varchar(50)
  - direccion_fiscal text
  - persona_contacto varchar(255)
  - telefono varchar(50)
  - email varchar(255)
  - estado varchar(50) DEFAULT 'activo'
  - notas text
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamp DEFAULT CURRENT_TIMESTAMP
  - codigo_postal varchar(20)
  - poblacion varchar(100)
  - provincia varchar(100)
  - pais varchar(100) DEFAULT 'Espana'

### limpio.clientes_history
- PK: id
- FK: cliente_id -> limpio.clientes.id
- Columnas:
  - id uuid DEFAULT gen_random_uuid() NOT NULL
  - cliente_id uuid
  - changed_by varchar(255)
  - user_role varchar(50)
  - action varchar(50)
  - field_name varchar(255)
  - old_value text
  - new_value text
  - details text
  - changed_at timestamp DEFAULT CURRENT_TIMESTAMP

### limpio.materiales
- PK: id
- Columnas:
  - id uuid DEFAULT gen_random_uuid() NOT NULL
  - numero varchar(255)
  - descripcion text
  - pendiente_recibir boolean DEFAULT false
  - pendiente_gestion boolean DEFAULT false
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamp DEFAULT CURRENT_TIMESTAMP

### limpio.migrations
- PK: id
- Columnas:
  - id varchar(255) NOT NULL
  - name varchar(255) NOT NULL
  - applied_at timestamp DEFAULT CURRENT_TIMESTAMP
  - success boolean DEFAULT true

### limpio.pdf_import_configs
- PK: id
- FK: cliente_id -> limpio.clientes.id
- Columnas:
  - id uuid DEFAULT gen_random_uuid() NOT NULL
  - name varchar(255) NOT NULL
  - description text
  - extraction_rules jsonb DEFAULT '{}' NOT NULL
  - field_mappings jsonb DEFAULT '{}' NOT NULL
  - cliente_id uuid
  - created_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - created_by uuid
  - is_active boolean DEFAULT true
  - usage_count integer DEFAULT 0
  - last_used_at timestamptz
- Comentarios del esquema:
  - Tabla para reglas de importacion PDF.
  - extraction_rules: reglas de extraccion.
  - field_mappings: mapeo de campos extraidos.

### limpio.pedido_comments
- PK: id
- Columnas:
  - id uuid DEFAULT uuid_generate_v4() NOT NULL
  - pedido_id varchar(50) NOT NULL
  - user_id uuid
  - user_role varchar(20) NOT NULL
  - username varchar(50) NOT NULL
  - message text NOT NULL
  - is_system_message boolean DEFAULT false
  - is_edited boolean DEFAULT false
  - edited_at timestamptz
  - created_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - mentioned_users jsonb DEFAULT '[]'
- Comentario de columna:
  - mentioned_users guarda lista JSON de usuarios mencionados.

### limpio.pedidos
- PK: id
- FK: vendedor_id -> limpio.vendedores.id
- Columnas:
  - id varchar(255) NOT NULL
  - cliente varchar(255) NOT NULL
  - descripcion text
  - fecha_entrega timestamp
  - estado varchar(50) DEFAULT 'pendiente'
  - etapa_actual varchar(50) DEFAULT 'ingreso'
  - prioridad varchar(20) DEFAULT 'normal'
  - secuencia_pedido integer NOT NULL DEFAULT nextval(limpio.pedidos_secuencia_pedido_seq)
  - data jsonb DEFAULT '{}'
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamp DEFAULT CURRENT_TIMESTAMP
  - nueva_fecha_entrega timestamp
  - numeros_compra jsonb DEFAULT '[]'
  - vendedor varchar(255)
  - anonimo boolean DEFAULT false
  - compra_cliche date
  - recepcion_cliche date
  - horas_confirmadas boolean DEFAULT false
  - antivaho_realizado boolean DEFAULT false
  - vendedor_id uuid
  - cliente_id uuid
  - numero_pedido_cliente varchar(255)
- Comentarios de negocio:
  - anonimo: pedido anonimo.
  - compra_cliche: fecha compra cliche.
  - recepcion_cliche: fecha recepcion cliche.
  - horas_confirmadas: horas de cliche confirmadas.
  - antivaho_realizado: tratamiento antivaho realizado.

### limpio.pedidos_materiales
- PK compuesta: (pedido_id, material_id)
- FK:
  - pedido_id -> limpio.pedidos.id
  - material_id -> limpio.materiales.id
- Columnas:
  - pedido_id varchar(255) NOT NULL
  - material_id uuid NOT NULL

### limpio.vendedores
- PK: id
- UNIQUE: nombre
- Columnas:
  - id uuid DEFAULT uuid_generate_v4() NOT NULL
  - nombre varchar(255) NOT NULL
  - email varchar(255)
  - telefono varchar(50)
  - activo boolean DEFAULT true
  - created_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamptz DEFAULT CURRENT_TIMESTAMP

### limpio.vendedores_history
- PK: id
- FK: vendedor_id -> limpio.vendedores.id
- Columnas:
  - id uuid DEFAULT gen_random_uuid() NOT NULL
  - vendedor_id uuid
  - changed_by varchar(255)
  - user_role varchar(50)
  - action varchar(50)
  - field_name varchar(255)
  - old_value text
  - new_value text
  - details text
  - changed_at timestamp DEFAULT CURRENT_TIMESTAMP

### public.action_history
- PK: id
- Columnas:
  - id varchar(255) NOT NULL
  - context_id varchar(255)
  - context_type varchar(50)
  - action_type varchar(50)
  - payload jsonb
  - timestamp timestamp
  - user_id uuid
  - user_name varchar(255)
  - description text
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - source varchar(20) DEFAULT 'backend'

### public.admin_users
- PK: id
- UNIQUE: email, username
- Check: role in (ADMIN, SUPERVISOR, OPERATOR, VIEWER)
- Columnas:
  - id uuid DEFAULT uuid_generate_v4() NOT NULL
  - username varchar(50) NOT NULL
  - email varchar(255) NOT NULL
  - first_name varchar(100) NOT NULL
  - last_name varchar(100) NOT NULL
  - password_hash varchar(255) NOT NULL
  - role varchar(20) NOT NULL
  - permissions jsonb DEFAULT '[]'
  - is_active boolean DEFAULT true
  - last_login timestamptz
  - last_activity timestamptz
  - ip_address inet
  - user_agent text
  - created_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamptz DEFAULT CURRENT_TIMESTAMP

### public.analysis_instructions
- PK: id
- Columna autogenerada por secuencia: public.analysis_instructions_id_seq
- Columnas:
  - id integer NOT NULL
  - instructions text
  - updated_by uuid
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamp DEFAULT CURRENT_TIMESTAMP

### public.audit_log
- PK: id
- Columna autogenerada por secuencia: public.audit_log_id_seq
- Columnas:
  - id integer NOT NULL
  - timestamp timestamp DEFAULT CURRENT_TIMESTAMP
  - user_role varchar(50) NOT NULL
  - action text NOT NULL
  - pedido_id varchar(255)
  - details jsonb

### public.audit_logs
- PK: id
- FK: user_id -> public.admin_users.id
- Columnas:
  - id uuid DEFAULT uuid_generate_v4() NOT NULL
  - user_id uuid
  - username varchar(50) NOT NULL
  - action varchar(100) NOT NULL
  - module varchar(50) NOT NULL
  - details text
  - ip_address inet
  - user_agent text
  - affected_resource uuid
  - metadata jsonb DEFAULT '{}'
  - created_at timestamptz DEFAULT CURRENT_TIMESTAMP

### public.notifications
- PK: id
- Columnas:
  - id varchar(255) NOT NULL
  - type varchar(50) NOT NULL
  - title varchar(255) NOT NULL
  - message text
  - timestamp timestamp DEFAULT CURRENT_TIMESTAMP
  - read boolean DEFAULT false
  - pedido_id varchar(255)
  - user_id uuid
  - metadata jsonb
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP

### public.observaciones_templates
- PK: id
- UNIQUE: text
- Columnas:
  - id uuid DEFAULT gen_random_uuid() NOT NULL
  - text varchar(100) NOT NULL
  - usage_count integer DEFAULT 0
  - last_used timestamp DEFAULT CURRENT_TIMESTAMP
  - is_active boolean DEFAULT true
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamp DEFAULT CURRENT_TIMESTAMP

### public.pedido_comments
- PK: id
- Columnas:
  - id uuid DEFAULT uuid_generate_v4() NOT NULL
  - pedido_id varchar(50) NOT NULL
  - user_id uuid
  - user_role varchar(20) NOT NULL
  - username varchar(50) NOT NULL
  - message text NOT NULL
  - is_system_message boolean DEFAULT false
  - is_edited boolean DEFAULT false
  - edited_at timestamptz
  - created_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamptz DEFAULT CURRENT_TIMESTAMP

### public.user_permissions
- PK: id
- UNIQUE: (user_id, permission_id)
- FK:
  - user_id -> public.admin_users.id (ON DELETE CASCADE)
  - granted_by -> public.admin_users.id
- Columnas:
  - id uuid DEFAULT uuid_generate_v4() NOT NULL
  - user_id uuid
  - permission_id varchar(100) NOT NULL
  - enabled boolean DEFAULT true
  - granted_by uuid
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamp DEFAULT CURRENT_TIMESTAMP

### public.users
- PK: id
- UNIQUE: username
- Columnas:
  - id varchar(255) NOT NULL
  - username varchar(100) NOT NULL
  - password varchar(255) NOT NULL
  - role varchar(50) DEFAULT 'Operador' NOT NULL
  - display_name varchar(255)
  - created_at timestamp DEFAULT CURRENT_TIMESTAMP
  - last_login timestamp

### public.vendedores
- PK: id
- UNIQUE: nombre
- Columnas:
  - id uuid DEFAULT uuid_generate_v4() NOT NULL
  - nombre varchar(255) NOT NULL
  - email varchar(255)
  - telefono varchar(50)
  - activo boolean DEFAULT true
  - created_at timestamptz DEFAULT CURRENT_TIMESTAMP
  - updated_at timestamptz DEFAULT CURRENT_TIMESTAMP

## Indices relevantes por dominio

### Pedidos y produccion (limpio)
- limpio.pedidos: indices por estado, etapa_actual, fecha_entrega, nueva_fecha_entrega, cliente, cliente_id, vendedor, vendedor_id, secuencia_pedido, compra_cliche, recepcion_cliche, anonimo, antivaho_realizado, numero_pedido_cliente.
- limpio.pedidos: GIN en numeros_compra y GIN sobre expresion data->'numerosCompra'.
- limpio.pedidos_materiales: indices por pedido_id y material_id.

### Comentarios y colaboracion
- limpio.pedido_comments: index por pedido_id, user_id, created_at y GIN por mentioned_users.

### Seguridad y auditoria (public)
- public.action_history: indices por context_id, (context_type, context_id), timestamp (asc y desc), user_id.
- public.audit_log y public.audit_logs: indices por timestamp/created_at y user_id.
- public.notifications: indices por user_id, (user_id, read), timestamp desc.
- public.user_permissions: indices por user_id y permission_id.

## Puntos de atencion antes de cambios
1. Hay tablas duplicadas por nombre en schemas distintos:
   - pedido_comments en limpio y public
   - vendedores en limpio y public
   Siempre usar nombre calificado con schema.
2. Existen varios tipos de ID en paralelo:
   - uuid (muchas tablas)
   - varchar (pedidos, users, notifications, action_history, migrations)
   - integer (audit_log, analysis_instructions)
   Cuidar conversiones y joins.
3. No se observa FK entre limpio.pedidos.cliente_id y limpio.clientes.id.
   Si se agrega, validar primero integridad de datos existentes.
4. Triggers actualizan updated_at automaticamente en varias tablas.
   Evitar duplicar logica en aplicacion si ya la cubre trigger.
5. public.debug_vendedor_update emite NOTICE en cada update de limpio.vendedores.
   Puede generar ruido/log en operaciones masivas.
6. Hay uso de JSONB en tablas criticas (pedidos, configs, auditoria).
   Cualquier cambio debe considerar compatibilidad de estructura JSON y sus indices GIN.

## Checklist para agente IA antes de modificar
1. Definir schema objetivo exacto (limpio o public).
2. Verificar si la tabla tiene trigger de updated_at.
3. Revisar PK, UNIQUE y FKs impactadas por el cambio.
4. Revisar indices existentes para no crear duplicados.
5. Validar impacto en columnas JSONB e indices GIN.
6. Si se toca pedidos, validar impacto en pedidos_materiales y action/audit logs.
7. Si se toca admin_users, revisar user_permissions y audit_logs.
8. Probar migracion en transaccion y con rollback plan.
9. Ejecutar validacion post-cambio (conteos, nulls inesperados, orphan rows).

## Consultas de validacion sugeridas (pre y post cambio)

```sql
-- Conteo por tabla principal
SELECT 'limpio.pedidos' AS tabla, COUNT(*) FROM limpio.pedidos
UNION ALL
SELECT 'limpio.clientes', COUNT(*) FROM limpio.clientes
UNION ALL
SELECT 'public.admin_users', COUNT(*) FROM public.admin_users;

-- Deteccion de pedidos con vendedor_id huerfano (si existieran)
SELECT p.id, p.vendedor_id
FROM limpio.pedidos p
LEFT JOIN limpio.vendedores v ON v.id = p.vendedor_id
WHERE p.vendedor_id IS NOT NULL AND v.id IS NULL;

-- Deteccion de permisos sin usuario
SELECT up.id, up.user_id
FROM public.user_permissions up
LEFT JOIN public.admin_users au ON au.id = up.user_id
WHERE up.user_id IS NOT NULL AND au.id IS NULL;
```

## Nota final
Este contexto representa el estado observado en el backup analizado.
Si el esquema evoluciona, actualizar este archivo junto con cada migracion estructural.
