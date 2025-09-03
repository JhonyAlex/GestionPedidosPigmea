// Script para generar hash bcrypt
const bcryptjs = require('bcryptjs');

async function generatePasswordHash() {
    const password = 'Admin#2025!'; // Contraseña segura para admin
    const saltRounds = 12; // Nivel de seguridad alto
    
    try {
        const hash = await bcryptjs.hash(password, saltRounds);
        console.log('='.repeat(60));
        console.log('🔐 HASH BCRYPT GENERADO');
        console.log('='.repeat(60));
        console.log('Contraseña:', password);
        console.log('Hash:', hash);
        console.log('='.repeat(60));
        console.log('\n📋 SQL PARA INSERTAR USUARIO ADMIN:');
        console.log('='.repeat(60));
        
        const sql = `
INSERT INTO public.admin_users (
    id, 
    username, 
    password_hash, 
    role, 
    display_name, 
    is_active, 
    created_at
) VALUES (
    'admin-${Date.now()}',
    'admin',
    '${hash}',
    'admin',
    'Administrador Principal',
    TRUE,
    NOW()
);`;
        
        console.log(sql);
        console.log('='.repeat(60));
        console.log('✅ Copia este SQL y ejecútalo en tu base de datos PostgreSQL');
        
    } catch (error) {
        console.error('Error generando hash:', error);
    }
}

generatePasswordHash();
