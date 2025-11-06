#!/usr/bin/env node

/**
 * Script de Archivado Automático de Pedidos Antiguos
 * 
 * Propósito:
 * - Marca como INACTIVO los pedidos COMPLETADOS con fecha de entrega > 2 meses
 * - Esto mejora el rendimiento al excluirlos de las consultas por defecto
 * - Los pedidos INACTIVOS siguen siendo accesibles mediante búsqueda/filtros
 * 
 * Ejecución:
 * - Manual: node backend/scripts/auto-archive-old-pedidos.js
 * - Cron (recomendado): 0 3 * * * (diariamente a las 3:00 AM)
 * 
 * Requisitos:
 * - Variable DATABASE_URL configurada
 * - Migración 017 ejecutada (columna 'estado' debe existir)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const PostgreSQLClient = require('../postgres-client');

async function autoArchiveOldPedidos() {
    const dbClient = new PostgreSQLClient();
    
    console.log('🗄️ Iniciando proceso de archivado automático...');
    console.log('='.repeat(60));
    
    try {
        await dbClient.initialize();
        console.log('✅ Conexión a BD establecida.');
        
        // Calcular fecha límite (2 meses atrás)
        const dosMesesAtras = new Date();
        dosMesesAtras.setMonth(dosMesesAtras.getMonth() - 2);
        const fechaLimite = dosMesesAtras.toISOString().split('T')[0];
        
        console.log(`📅 Fecha límite: ${fechaLimite}`);
        console.log(`   (Pedidos completados antes de esta fecha serán marcados como INACTIVO)`);
        console.log('');
        
        // Consultar pedidos que cumplen los criterios
        const querySelect = `
            SELECT id, data->>'numeroPedidoCliente' as numero, data->>'fechaEntrega' as fecha
            FROM pedidos 
            WHERE data->>'etapaActual' = 'COMPLETADO' 
              AND (data->>'fechaEntrega')::date < $1
              AND estado = 'ACTIVO'
        `;
        
        const selectResult = await dbClient.pool.query(querySelect, [fechaLimite]);
        
        if (selectResult.rowCount === 0) {
            console.log('ℹ️ No hay pedidos para archivar en este momento.');
            return 0;
        }
        
        console.log(`🔍 Se encontraron ${selectResult.rowCount} pedidos para archivar:`);
        console.log('-'.repeat(60));
        
        selectResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. Pedido #${row.numero} | Entrega: ${row.fecha} | ID: ${row.id}`);
        });
        
        console.log('-'.repeat(60));
        console.log('');
        
        // Actualizar estado a INACTIVO
        const queryUpdate = `
            UPDATE pedidos 
            SET estado = 'INACTIVO' 
            WHERE data->>'etapaActual' = 'COMPLETADO' 
              AND (data->>'fechaEntrega')::date < $1
              AND estado = 'ACTIVO'
        `;
        
        const updateResult = await dbClient.pool.query(queryUpdate, [fechaLimite]);
        
        console.log(`✅ ${updateResult.rowCount} pedidos archivados exitosamente.`);
        console.log('');
        console.log('📊 Resumen:');
        console.log(`   - Total archivado: ${updateResult.rowCount}`);
        console.log(`   - Estado: ACTIVO → INACTIVO`);
        console.log(`   - Razón: Completados hace más de 2 meses`);
        console.log('');
        console.log('ℹ️ Los pedidos INACTIVO no se mostrarán por defecto, pero');
        console.log('   seguirán siendo accesibles mediante búsqueda/filtros.');
        console.log('='.repeat(60));
        
        return updateResult.rowCount;
        
    } catch (error) {
        console.error('');
        console.error('❌ ERROR EN EL PROCESO DE ARCHIVADO');
        console.error('='.repeat(60));
        console.error('Mensaje:', error.message);
        if (error.stack) {
            console.error('');
            console.error('Stack trace:');
            console.error(error.stack);
        }
        console.error('='.repeat(60));
        throw error;
    } finally {
        try {
            await dbClient.close();
            console.log('🔌 Conexión a BD cerrada.');
        } catch (closeError) {
            console.error('⚠️ Error al cerrar conexión:', closeError.message);
        }
    }
}

// Ejecutar si se llama directamente (no cuando se importa como módulo)
if (require.main === module) {
    autoArchiveOldPedidos()
        .then(count => {
            console.log('');
            console.log('🎉 PROCESO COMPLETADO EXITOSAMENTE');
            console.log(`   ${count} pedidos archivados.`);
            process.exit(0);
        })
        .catch(error => {
            console.error('');
            console.error('💥 EL PROCESO FINALIZÓ CON ERRORES');
            process.exit(1);
        });
}

module.exports = { autoArchiveOldPedidos };
