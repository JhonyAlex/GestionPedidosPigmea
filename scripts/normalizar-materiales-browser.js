/**
 * Script de normalización de campos materialConsumo (Versión Browser)
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre la aplicación en el navegador
 * 2. Inicia sesión como ADMIN
 * 3. Abre la consola del navegador (F12)
 * 4. Copia y pega este script completo
 * 5. Presiona Enter
 * 6. Espera a que termine (verás el progreso en la consola)
 */

(async function normalizarMateriales() {
    console.log('🔧 Iniciando normalización de materiales...\n');
    
    const API_URL = '/api';
    
    try {
        // Obtener usuario actual del localStorage
        const userStr = localStorage.getItem('pigmea_user');
        if (!userStr) {
            throw new Error('No hay sesión activa. Por favor inicia sesión como ADMIN.');
        }
        
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            throw new Error('Debes estar autenticado como ADMIN para ejecutar este script.');
        }
        
        // 1. Obtener todos los pedidos
        console.log('📥 Obteniendo todos los pedidos...');
        const response = await fetch(`${API_URL}/pedidos`, {
            headers: {
                'x-user-id': String(user.id),
                'x-user-role': user.role
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
                        
                        itemModificado.gestionado = tieneNumeroCompra ? true : true;
                        cambios.push(`gestionado: null → ${itemModificado.gestionado}`);
                    }
                    
                    // Normalizar campo 'recibido'
                    if (itemModificado.recibido === null || itemModificado.recibido === undefined) {
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
                            'x-user-id': String(user.id),
                            'x-user-role': user.role
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
        console.log('\n💡 Recarga la página (F5) para ver los cambios reflejados en la UI');
        
    } catch (error) {
        console.error('\n❌ Error durante la normalización:', error);
    }
})();
