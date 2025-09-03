-- Script para insertar usuario admin inicial
-- Ejecutar en la base de datos PostgreSQL: gestion_pedidos

-- Verificar que la tabla existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'admin_users';

-- Insertar usuario admin inicial
INSERT INTO public.admin_users (
    id, 
    username, 
    password_hash, 
    role, 
    display_name, 
    is_active, 
    created_at
) VALUES (
    'admin-1756911137717',
    'admin',
    '$2a$12$PjppiNRXBF5XYW.QeBjig.EMg4v5tFvGtREMPARC6zIKQzlh0uxWS',
    'admin',
    'Administrador Principal',
    TRUE,
    NOW()
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    is_active = TRUE,
    updated_at = NOW();

-- Verificar que se insertó correctamente
SELECT id, username, role, display_name, is_active, created_at 
FROM public.admin_users 
WHERE username = 'admin';

-- Mostrar todos los usuarios admin
SELECT * FROM public.admin_users;
