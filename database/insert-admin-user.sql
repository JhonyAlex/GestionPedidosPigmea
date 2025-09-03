-- Script para insertar usuario admin inicial
-- Ejecutar en la base de datos PostgreSQL: gestion_pedidos

-- Verificar que la tabla existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'admin_users';

-- Insertar usuario admin inicial (sin id, usa secuencia automática)
INSERT INTO public.admin_users (
    username, 
    password_hash, 
    role, 
    is_active, 
    created_at
) VALUES (
    'admin',
    '$2a$12$6q8VqrIAoJK5.dj8vOo7P.0pozuaZN15NPS11HqC/d5pMAWVJTyfi',
    'admin',
    TRUE,
    NOW()
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE,
    updated_at = NOW();

-- Verificar que se insertó correctamente
SELECT id, username, role, is_active, created_at, last_login_at 
FROM public.admin_users 
WHERE username = 'admin';

-- Mostrar todos los usuarios admin
SELECT * FROM public.admin_users;
