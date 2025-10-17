#!/usr/bin/env node

// Script independiente para aplicar migraciones faltantes
// Este script se conecta directamente a la base de datos y aplica las migraciones necesarias

const { Pool } = require('pg');

// Configuración de base de datos desde variables de entorno
const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'gestion_pedidos',
    user: process.env.POSTGRES_USER || 'pigmea_user',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🔧 Iniciando script de migración...');
console.log('📊 Configuración de conexión:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password ? '***' : 'no configurada'
});

async function applyMigrations() {
    const pool = new Pool(config);
    
    try {
        console.log('🔌 Conectando a la base de datos...');
        const client = await pool.connect();
        
        console.log('✅ Conexión exitosa');
        
        try {
            // Verificar que la tabla pedidos existe
            const tableCheck = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'pedidos' AND table_schema = 'public'
            `);
            
            if (tableCheck.rows.length === 0) {
                throw new Error('La tabla pedidos no existe. Ejecute primero las migraciones básicas.');
            }
            
            console.log('✅ Tabla pedidos confirmada');
            
            // Verificar columnas existentes
            const columnsCheck = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'pedidos' 
                AND column_name IN ('nueva_fecha_entrega', 'numero_compra')
                ORDER BY column_name;
            `);
            
            const existingColumns = columnsCheck.rows.map(row => row.column_name);
            console.log('📋 Columnas existentes:', existingColumns.length > 0 ? existingColumns : 'ninguna de las requeridas');
            
            let results = [];
            
            // Migración 1: nueva_fecha_entrega
            if (!existingColumns.includes('nueva_fecha_entrega')) {
                console.log('🔧 Aplicando migración: nueva_fecha_entrega...');
                try {
                    await client.query(`
                        ALTER TABLE pedidos ADD COLUMN nueva_fecha_entrega TIMESTAMP;
                    `);
                    
                    await client.query(`
                        CREATE INDEX IF NOT EXISTS idx_pedidos_nueva_fecha_entrega ON pedidos(nueva_fecha_entrega);
                    `);
                    
                    await client.query(`
                        COMMENT ON COLUMN pedidos.nueva_fecha_entrega IS 'Fecha de entrega alternativa o actualizada del pedido';
                    `);
                    
                    console.log('✅ nueva_fecha_entrega: APLICADA');
                    results.push({ migration: 'nueva_fecha_entrega', status: 'success' });
                } catch (error) {
                    console.error('❌ Error en nueva_fecha_entrega:', error.message);
                    results.push({ migration: 'nueva_fecha_entrega', status: 'error', error: error.message });
                }
            } else {
                console.log('⚠️ nueva_fecha_entrega: YA EXISTE');
                results.push({ migration: 'nueva_fecha_entrega', status: 'already_exists' });
            }
            
            // Migración 2: numero_compra
            if (!existingColumns.includes('numero_compra')) {
                console.log('🔧 Aplicando migración: numero_compra...');
                try {
                    await client.query(`
                        ALTER TABLE pedidos ADD COLUMN numero_compra VARCHAR(50);
                    `);
                    
                    await client.query(`
                        CREATE INDEX IF NOT EXISTS idx_pedidos_numero_compra ON pedidos(numero_compra);
                    `);
                    
                    await client.query(`
                        COMMENT ON COLUMN pedidos.numero_compra IS 'Número de compra del pedido - Alfanumérico, máximo 50 caracteres, opcional';
                    `);
                    
                    // Intentar crear índice GIN para búsquedas de texto
                    try {
                        await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
                        await client.query(`
                            CREATE INDEX IF NOT EXISTS idx_pedidos_numero_compra_text 
                            ON pedidos USING gin(numero_compra gin_trgm_ops);
                        `);
                        console.log('✅ Índice GIN creado para búsquedas de texto');
                    } catch (ginError) {
                        console.log('⚠️ No se pudo crear índice GIN:', ginError.message);
                    }
                    
                    console.log('✅ numero_compra: APLICADA');
                    results.push({ migration: 'numero_compra', status: 'success' });
                } catch (error) {
                    console.error('❌ Error en numero_compra:', error.message);
                    results.push({ migration: 'numero_compra', status: 'error', error: error.message });
                }
            } else {
                console.log('⚠️ numero_compra: YA EXISTE');
                results.push({ migration: 'numero_compra', status: 'already_exists' });
            }
            
            // Verificación final
            const finalCheck = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'pedidos' 
                AND column_name IN ('nueva_fecha_entrega', 'numero_compra')
                ORDER BY column_name;
            `);
            
            const finalColumns = finalCheck.rows.map(row => row.column_name);
            
            console.log('');
            console.log('🎉 RESUMEN DE MIGRACIONES:');
            console.log('========================');
            results.forEach(result => {
                const emoji = result.status === 'success' ? '✅' : 
                             result.status === 'already_exists' ? '⚠️' : '❌';
                console.log(`${emoji} ${result.migration}: ${result.status.toUpperCase()}`);
                if (result.error) {
                    console.log(`   Error: ${result.error}`);
                }
            });
            console.log('');
            console.log('📋 Columnas finales presentes:', finalColumns);
            
            const allRequired = ['nueva_fecha_entrega', 'numero_compra'];
            const allPresent = allRequired.every(col => finalColumns.includes(col));
            
            if (allPresent) {
                console.log('🎉 ¡ÉXITO! Todas las migraciones están aplicadas.');
                console.log('✅ El sistema debería funcionar correctamente ahora.');
            } else {
                console.log('⚠️ Algunas migraciones no se aplicaron correctamente.');
                const missing = allRequired.filter(col => !finalColumns.includes(col));
                console.log('❌ Columnas faltantes:', missing);
            }
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        if (error.code) {
            console.error('📋 Código de error PostgreSQL:', error.code);
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Ejecutar migraciones
applyMigrations().then(() => {
    console.log('');
    console.log('🏁 Script de migración completado.');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
});