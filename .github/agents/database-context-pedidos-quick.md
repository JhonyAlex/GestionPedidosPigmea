# Contexto corto BD Pedidos (para IA)

Fecha: 2026-03-12
Fuente: backup_pedidos.sql
Motor: PostgreSQL 15.17

## 1) Snapshot rapido
- Schemas: limpio (negocio) y public (seguridad/auditoria/soporte).
- Tablas: 21.
- Funciones: 4.
- Triggers: 6.
- Secuencias: 3.
- Extension: uuid-ossp.

## 2) Donde esta lo importante
- Core negocio: limpio.pedidos, limpio.clientes, limpio.vendedores.
- Relacion N:M: limpio.pedidos_materiales.
- Historiales: limpio.clientes_history, limpio.vendedores_history.
- Importacion PDF: limpio.pdf_import_configs (JSONB).
- Seguridad: public.admin_users, public.user_permissions.
- Auditoria: public.action_history, public.audit_log, public.audit_logs.

## 3) Relaciones criticas (FK)
- limpio.pedidos.vendedor_id -> limpio.vendedores.id (SET NULL)
- limpio.pedidos_materiales.pedido_id -> limpio.pedidos.id (CASCADE)
- limpio.pedidos_materiales.material_id -> limpio.materiales.id (CASCADE)
- limpio.clientes_history.cliente_id -> limpio.clientes.id (CASCADE)
- limpio.vendedores_history.vendedor_id -> limpio.vendedores.id (CASCADE)
- public.user_permissions.user_id -> public.admin_users.id (CASCADE)
- public.audit_logs.user_id -> public.admin_users.id (SET NULL)

## 4) Riesgos estructurales que NO ignorar
1. Hay nombres duplicados en distintos schemas:
   - pedido_comments en limpio y public
   - vendedores en limpio y public
2. IDs mezclados por diseno: uuid + varchar + integer.
3. No existe FK declarada entre limpio.pedidos.cliente_id y limpio.clientes.id.
4. Hay JSONB en tablas clave (pedidos/configs/auditoria) con indices GIN.
5. Triggers de updated_at activos en varias tablas.

## 5) Triggers activos
- limpio.pedidos: update_pedidos_updated_at.
- limpio.vendedores: update_vendedores_updated_at + debug_vendedor_update_trigger.
- limpio.pdf_import_configs: update_pdf_import_configs_modified.
- public.admin_users: update_admin_users_updated_at.
- public.user_permissions: update_user_permissions_modtime.

## 6) Checklist minimo antes de cambiar esquema o datos
1. Confirmar schema objetivo (limpio/public) y usar nombre calificado.
2. Revisar PK/UNIQUE/FK impactadas.
3. Verificar si hay trigger que ya modifica updated_at.
4. Revisar indices existentes (evitar duplicados, sobre todo GIN).
5. Probar migracion en transaccion y preparar rollback.
6. Ejecutar validaciones post-cambio.

## 7) SQL minimo de validacion
```sql
-- Conteos base
SELECT 'limpio.pedidos' AS tabla, COUNT(*) FROM limpio.pedidos
UNION ALL
SELECT 'limpio.clientes', COUNT(*) FROM limpio.clientes
UNION ALL
SELECT 'public.admin_users', COUNT(*) FROM public.admin_users;

-- Pedidos con vendedor huerfano
SELECT p.id, p.vendedor_id
FROM limpio.pedidos p
LEFT JOIN limpio.vendedores v ON v.id = p.vendedor_id
WHERE p.vendedor_id IS NOT NULL AND v.id IS NULL;

-- Permisos sin usuario admin
SELECT up.id, up.user_id
FROM public.user_permissions up
LEFT JOIN public.admin_users au ON au.id = up.user_id
WHERE up.user_id IS NOT NULL AND au.id IS NULL;
```

## 8) Prompt de arranque sugerido para agente IA
"Antes de proponer cambios en esta BD:
1) Asume que el schema principal de negocio es limpio.
2) Usa siempre nombres calificados con schema.
3) Verifica impacto en FKs, triggers e indices existentes.
4) No asumas FK entre pedidos.cliente_id y clientes.id (no esta declarada).
5) Entrega plan con rollback y validaciones SQL pre/post cambio."
