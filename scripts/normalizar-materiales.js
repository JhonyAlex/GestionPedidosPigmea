/**
 * Script de normalización de campos materialConsumo
 * 
 * Este script actualiza todos los pedidos existentes para establecer valores
 * por defecto consistentes en los campos recibido y gestionado del array materialConsumo.
 * 
 * Reglas de normalización:
 * - Si gestionado es null/undefined → establecer como true (asumimos que los pedidos legacy ya fueron gestionados)
 * - Si recibido es null/undefined → establecer como true (asumimos que los materiales legacy ya fueron recibidos)
 * - Si tiene número de compra → gestionado=true
 */

const API_URL = process.env.VITE_API_URL || 'http://localhost:8080/api';

async function normalizarMateriales() {
    console.log('🔧 Iniciando normalización de materiales...\n');
    
    try {
        // 1. Obtener todos los pedidos
        console.log('📥 Obteniendo todos los pedidos...');
        const response = await fetch(`${API_URL}/pedidos`, {
            headers: {
                'x-user-id': '1',
                'x-user-role': 'ADMIN'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener pedidos: ${response.status}`);
        }
        
        const pedidos = await response.json();
        console.log(`✅ ${pedidos.length} pedidos obtenidos\n`);
        
        let pedidosActualizados = 0;
        let materialesNormalizados = 0;
        
        // 2. Procesar cada pedido
        for (const pedido of pedidos) {
            let pedidoModificado = false;
            
            // Verificar si tiene materialConsumo
            if (pedido.materialConsumo && Array.isArray(pedido.materialConsumo)) {
                const materialConsumoActualizado = pedido.materialConsumo.map((item, index) => {
                    if (!item) return item;
                    
                    let itemModificado = { ...item };
                    let cambios = [];
                    
                    // Normalizar campo 'gestionado'
                    if (itemModificado.gestionado === null || itemModificado.gestionado === undefined) {
                        // Si tiene número de compra asociado, asumimos que está gestionado
                        const tieneNumeroCompra = pedido.numerosCompra && 
                                                 pedido.numerosCompra[index] && 
                                                 pedido.numerosCompra[index].trim() !== '';
                        
                        itemModificado.gestionado = tieneNumeroCompra ? true : true; // Por defecto true para legacy
                        cambios.push(`gestionado: null → ${itemModificado.gestionado}`);
                    }
                    
                    // Normalizar campo 'recibido'
                    if (itemModificado.recibido === null || itemModificado.recibido === undefined) {
                        // Por defecto, establecer como true para datos legacy
                        itemModificado.recibido = true;
                        cambios.push(`recibido: null → true`);
                    }
                    
                    if (cambios.length > 0) {
                        console.log(`  📝 Pedido ${pedido.numeroPedidoCliente} - Material ${index + 1}: ${cambios.join(', ')}`);
                        pedidoModificado = true;
                        materialesNormalizados++;
                    }
                    
                    return itemModificado;
                });
                
                // 3. Actualizar el pedido si fue modificado
                if (pedidoModificado) {
                    const pedidoActualizado = {
                        ...pedido,
                        materialConsumo: materialConsumoActualizado
                    };
                    
                    const updateResponse = await fetch(`${API_URL}/pedidos/${pedido.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': '1',
                            'x-user-role': 'ADMIN'
                        },
                        body: JSON.stringify(pedidoActualizado)
                    });
                    
                    if (updateResponse.ok) {
                        pedidosActualizados++;
                        console.log(`  ✅ Pedido ${pedido.numeroPedidoCliente} actualizado\n`);
                    } else {
                        console.error(`  ❌ Error actualizando pedido ${pedido.numeroPedidoCliente}: ${updateResponse.status}\n`);
                    }
                    
                    // Pequeña pausa para no saturar el servidor
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }
        
        // 4. Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE NORMALIZACIÓN:');
        console.log('='.repeat(60));
        console.log(`Total de pedidos procesados: ${pedidos.length}`);
        console.log(`Pedidos actualizados: ${pedidosActualizados}`);
        console.log(`Materiales normalizados: ${materialesNormalizados}`);
        console.log('='.repeat(60));
        console.log('\n✅ Normalización completada exitosamente');
        
    } catch (error) {
        console.error('\n❌ Error durante la normalización:', error);
        process.exit(1);
    }
}

// Ejecutar el script
if (typeof window === 'undefined') {
    // Node.js
    normalizarMateriales();
} else {
    // Browser
    console.log('Este script debe ejecutarse desde Node.js');
}
