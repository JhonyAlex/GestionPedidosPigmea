-- ========================================
-- SQL: Verificación y Corrección de Permisos
-- Para resolver Error 404 Bulk Delete
-- ========================================

-- 1. VERIFICAR USUARIOS EXISTENTES
-- ========================================
SELECT 
    id,
    username,
    role,
    is_active,
    created_at,
    last_login
FROM admin_users
ORDER BY created_at DESC;

-- 2. VERIFICAR PERMISOS DEL SISTEMA
-- ========================================
SELECT 
    id,
    name,
    category,
    description,
    enabled
FROM permissions
WHERE id LIKE 'pedidos.%'
ORDER BY id;

-- 3. VERIFICAR PERMISOS DE UN USUARIO ESPECÍFICO
-- ========================================
-- Reemplaza 'TU_USER_ID' con el ID del usuario
SELECT 
    up.user_id,
    au.username,
    up.permission_id,
    p.name as permission_name,
    up.enabled,
    up.granted_at,
    up.granted_by
FROM user_permissions up
JOIN admin_users au ON up.user_id = au.id
JOIN permissions p ON up.permission_id = p.id
WHERE up.user_id = 'TU_USER_ID'
ORDER BY p.category, p.id;

-- 4. VERIFICAR SI UN USUARIO TIENE permiso pedidos.delete
-- ========================================
-- Reemplaza 'TU_USER_ID' con el ID del usuario
SELECT 
    au.username,
    au.role,
    up.permission_id,
    up.enabled,
    CASE 
        WHEN up.enabled = true THEN '✅ PERMITIDO'
        WHEN up.enabled = false THEN '❌ DENEGADO'
        WHEN up.enabled IS NULL THEN '⚠️ NO CONFIGURADO'
    END as status
FROM admin_users au
LEFT JOIN user_permissions up ON au.id = up.user_id AND up.permission_id = 'pedidos.delete'
WHERE au.id = 'TU_USER_ID';

-- 5. SOLUCIÓN: ASIGNAR PERMISO pedidos.delete A UN USUARIO
-- ========================================
-- Reemplaza 'TU_USER_ID' con el ID del usuario
INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
VALUES ('TU_USER_ID', 'pedidos.delete', true, 'TU_USER_ID')
ON CONFLICT (user_id, permission_id) 
DO UPDATE SET 
    enabled = true,
    granted_at = CURRENT_TIMESTAMP,
    granted_by = EXCLUDED.granted_by;

-- 6. SOLUCIÓN: CAMBIAR ROL DE USUARIO A ADMINISTRADOR
-- ========================================
-- Reemplaza 'TU_USERNAME' con el nombre de usuario
UPDATE admin_users 
SET role = 'ADMIN'
WHERE username = 'TU_USERNAME';

-- 7. SOLUCIÓN: ASIGNAR TODOS LOS PERMISOS DE PEDIDOS A UN USUARIO
-- ========================================
-- Reemplaza 'TU_USER_ID' con el ID del usuario
INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
SELECT 
    'TU_USER_ID' as user_id,
    id as permission_id,
    true as enabled,
    'TU_USER_ID' as granted_by
FROM permissions
WHERE id LIKE 'pedidos.%'
ON CONFLICT (user_id, permission_id) 
DO UPDATE SET 
    enabled = true,
    granted_at = CURRENT_TIMESTAMP;

-- 8. VERIFICAR PERMISOS DE TODOS LOS USUARIOS
-- ========================================
SELECT 
    au.username,
    au.role,
    COUNT(up.permission_id) as total_permissions,
    COUNT(CASE WHEN up.enabled = true THEN 1 END) as enabled_permissions,
    COUNT(CASE WHEN up.permission_id LIKE 'pedidos.%' THEN 1 END) as pedidos_permissions
FROM admin_users au
LEFT JOIN user_permissions up ON au.id = up.user_id
GROUP BY au.id, au.username, au.role
ORDER BY au.username;

-- 9. CREAR PERMISO SI NO EXISTE
-- ========================================
INSERT INTO permissions (id, name, description, category, enabled)
VALUES 
    ('pedidos.delete', 'Eliminar Pedidos', 'Permite eliminar pedidos del sistema', 'pedidos', true),
    ('pedidos.edit', 'Editar Pedidos', 'Permite editar pedidos existentes', 'pedidos', true)
ON CONFLICT (id) DO NOTHING;

-- 10. OBTENER LISTA DE USUARIOS CON SUS ROLES Y PERMISOS DE PEDIDOS
-- ========================================
SELECT 
    au.id,
    au.username,
    au.role,
    au.is_active,
    COALESCE(
        json_agg(
            json_build_object(
                'permission', up.permission_id,
                'enabled', up.enabled
            ) ORDER BY up.permission_id
        ) FILTER (WHERE up.permission_id IS NOT NULL),
        '[]'::json
    ) as permissions
FROM admin_users au
LEFT JOIN user_permissions up ON au.id = up.user_id AND up.permission_id LIKE 'pedidos.%'
GROUP BY au.id, au.username, au.role, au.is_active
ORDER BY au.username;

-- 11. VERIFICAR QUE LAS TABLAS EXISTAN
-- ========================================
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('admin_users', 'permissions', 'user_permissions') THEN '✅'
        ELSE '❌'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('admin_users', 'permissions', 'user_permissions')
ORDER BY table_name;

-- 12. LIMPIAR PERMISOS DUPLICADOS (MANTENIMIENTO)
-- ========================================
DELETE FROM user_permissions
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM user_permissions
    GROUP BY user_id, permission_id
);

-- 13. OBTENER INFORMACIÓN COMPLETA DE UN USUARIO
-- ========================================
-- Reemplaza 'TU_USERNAME' con el nombre de usuario
WITH user_info AS (
    SELECT 
        id,
        username,
        email,
        role,
        is_active,
        created_at,
        last_login
    FROM admin_users
    WHERE username = 'TU_USERNAME'
),
user_perms AS (
    SELECT 
        ui.id as user_id,
        p.id as permission_id,
        p.name as permission_name,
        p.category,
        COALESCE(up.enabled, false) as enabled
    FROM user_info ui
    CROSS JOIN permissions p
    LEFT JOIN user_permissions up ON ui.id = up.user_id AND p.id = up.permission_id
    WHERE p.id LIKE 'pedidos.%'
)
SELECT 
    ui.*,
    json_agg(
        json_build_object(
            'id', up.permission_id,
            'name', up.permission_name,
            'category', up.category,
            'enabled', up.enabled
        ) ORDER BY up.permission_id
    ) as permissions
FROM user_info ui
LEFT JOIN user_perms up ON ui.id = up.user_id
GROUP BY ui.id, ui.username, ui.email, ui.role, ui.is_active, ui.created_at, ui.last_login;

-- 14. COPIAR PERMISOS DE UN USUARIO A OTRO
-- ========================================
-- Reemplaza 'SOURCE_USER_ID' y 'TARGET_USER_ID'
INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
SELECT 
    'TARGET_USER_ID' as user_id,
    permission_id,
    enabled,
    'SOURCE_USER_ID' as granted_by
FROM user_permissions
WHERE user_id = 'SOURCE_USER_ID'
ON CONFLICT (user_id, permission_id) 
DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    granted_at = CURRENT_TIMESTAMP;

-- 15. RESETEAR PERMISOS DE UN USUARIO A LOS POR DEFECTO DE SU ROL
-- ========================================
-- Reemplaza 'TU_USER_ID' con el ID del usuario
DELETE FROM user_permissions
WHERE user_id = 'TU_USER_ID';

-- Nota: El sistema usará automáticamente los permisos por defecto del rol

-- ========================================
-- COMANDOS RÁPIDOS DE VERIFICACIÓN
-- ========================================

-- Ver mi usuario actual (reemplaza 'mi_usuario')
SELECT * FROM admin_users WHERE username = 'mi_usuario';

-- Ver si tengo pedidos.delete
SELECT 
    au.username,
    COALESCE(up.enabled, false) as tiene_permiso_delete,
    au.role
FROM admin_users au
LEFT JOIN user_permissions up ON au.id = up.user_id AND up.permission_id = 'pedidos.delete'
WHERE au.username = 'mi_usuario';

-- Darme el permiso pedidos.delete (reemplaza con tu user_id)
INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
SELECT id, 'pedidos.delete', true, id
FROM admin_users
WHERE username = 'mi_usuario'
ON CONFLICT (user_id, permission_id) 
DO UPDATE SET enabled = true;

-- Hacerme administrador (reemplaza con tu username)
UPDATE admin_users 
SET role = 'ADMIN'
WHERE username = 'mi_usuario';

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================

-- 1. Usuarios con rol ADMIN tienen todos los permisos automáticamente
--    No necesitan registros en user_permissions

-- 2. Usuarios con otros roles (SUPERVISOR, OPERATOR, VIEWER) 
--    usan los permisos definidos en user_permissions
--    Si no hay registros, se usan los permisos por defecto del rol

-- 3. Los permisos por defecto se definen en:
--    backend/postgres-client.js -> getDefaultPermissionsForRole()

-- 4. Para verificar permisos sin modificar la BD:
--    Usa las consultas SELECT (1-4, 8, 10, 11, 13)

-- 5. Para modificar permisos:
--    Usa las consultas INSERT/UPDATE (5-7, 9, 14, 15)

-- 6. Siempre haz un backup antes de ejecutar comandos DELETE

-- ========================================
-- EJEMPLOS DE USO
-- ========================================

-- Ejemplo 1: Verificar permisos de usuario 'admin'
SELECT 
    au.username,
    au.role,
    up.permission_id,
    up.enabled
FROM admin_users au
LEFT JOIN user_permissions up ON au.id = up.user_id
WHERE au.username = 'admin'
    AND (up.permission_id LIKE 'pedidos.%' OR up.permission_id IS NULL)
ORDER BY up.permission_id;

-- Ejemplo 2: Dar todos los permisos de pedidos al usuario 'operador1'
INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
SELECT 
    au.id,
    p.id,
    true,
    au.id
FROM admin_users au
CROSS JOIN permissions p
WHERE au.username = 'operador1'
    AND p.id LIKE 'pedidos.%'
ON CONFLICT (user_id, permission_id) 
DO UPDATE SET enabled = true;

-- Ejemplo 3: Remover permiso pedidos.delete del usuario 'viewer1'
UPDATE user_permissions
SET enabled = false
WHERE user_id = (SELECT id FROM admin_users WHERE username = 'viewer1')
    AND permission_id = 'pedidos.delete';
