/**
 * Servicio de Importación Masiva de Pedidos
 * Maneja la importación por lotes desde Excel con resolución de clientes y validación
 * 
 * Características:
 * - Resolución automática de clientes y vendedores por nombre
 * - Validación exhaustiva de datos requeridos
 * - Prevención de duplicados por número de pedido
 * - Generación automática de secuencias
 * - Historial completo de importación
 * - Notificaciones en tiempo real via WebSocket
 */

// Constantes de configuración
const MAX_ERRORS_TO_RETURN = 10;
const MAX_PEDIDOS_IN_WEBSOCKET = 5;
const DEFAULT_ETAPA = 'PREPARACION';
const DEFAULT_PRIORIDAD = 'NORMAL';
const DEFAULT_TIPO_IMPRESION = 'SUPERFICIE';

/**
 * Función auxiliar para generar ID único de pedido
 * @returns {string} ID único con timestamp y aleatorio
 */
function generatePedidoId() {
    return `pedido_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Función auxiliar para generar ID único de historial
 * @returns {string} ID único con timestamp y aleatorio
 */
function generateHistorialId() {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida los campos requeridos de un pedido
 * @param {Object} pedido - Datos del pedido a validar
 * @throws {Error} Si falta algún campo requerido o tiene valor inválido
 */
function validatePedidoData(pedido) {
    const errores = [];
    
    if (!pedido.numeroPedidoCliente || pedido.numeroPedidoCliente.trim() === '') {
        errores.push('El número de pedido del cliente es obligatorio');
    }
    if (!pedido.cliente || pedido.cliente.trim() === '') {
        errores.push('El cliente es obligatorio');
    }
    if (!pedido.fechaEntrega) {
        errores.push('La fecha de entrega es obligatoria');
    }
    if (isNaN(pedido.metros) || pedido.metros <= 0) {
        errores.push('Los metros deben ser un número mayor a 0');
    }
    
    // Si hay múltiples errores, combinarlos
    if (errores.length > 0) {
        throw new Error(errores.join('; '));
    }
}

/**
 * Normaliza el nombre de un cliente/vendedor para búsqueda
 * @param {string} nombre - Nombre a normalizar
 * @returns {string} Nombre normalizado
 */
function normalizeName(nombre) {
    if (!nombre || typeof nombre !== 'string') return '';
    return nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,\-_()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Calcula la similitud entre dos strings usando Levenshtein
 * @param {string} a - Primer string
 * @param {string} b - Segundo string
 * @returns {number} Valor entre 0 y 1 (1 = idénticos)
 */
function calculateSimilarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    
    const matrix = [];
    const aLen = a.length;
    const bLen = b.length;
    
    for (let i = 0; i <= aLen; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= bLen; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= aLen; i++) {
        for (let j = 1; j <= bLen; j++) {
            if (a.charAt(i - 1) === b.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    const distance = matrix[aLen][bLen];
    const maxLen = Math.max(aLen, bLen);
    
    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
}

/**
 * Busca el mejor match de cliente usando fuzzy matching
 * @param {string} nombreBuscado - Nombre a buscar
 * @param {Map} clientesMap - Mapa de clientes existentes
 * @param {number} minSimilarity - Umbral mínimo de similitud (0.6 por defecto)
 * @returns {Object|null} Cliente encontrado o null
 */
function findBestClientMatch(nombreBuscado, clientesMap, minSimilarity = 0.6) {
    const normalizedTarget = normalizeName(nombreBuscado);
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const [normalizedKey, cliente] of clientesMap.entries()) {
        // Coincidencia exacta
        if (normalizedKey === normalizedTarget) {
            return cliente;
        }
        
        // Coincidencia por contención
        if (normalizedKey.includes(normalizedTarget) || normalizedTarget.includes(normalizedKey)) {
            const similarity = Math.max(
                normalizedTarget.length / normalizedKey.length,
                normalizedKey.length / normalizedTarget.length
            );
            
            if (similarity > bestSimilarity && similarity >= minSimilarity) {
                bestSimilarity = similarity;
                bestMatch = cliente;
            }
            continue;
        }
        
        // Similitud de Levenshtein
        const similarity = calculateSimilarity(normalizedTarget, normalizedKey);
        
        if (similarity > bestSimilarity && similarity >= minSimilarity) {
            bestSimilarity = similarity;
            bestMatch = cliente;
        }
    }
    
    return bestMatch;
}

/**
 * Busca el mejor match de vendedor usando fuzzy matching
 * @param {string} nombreBuscado - Nombre a buscar
 * @param {Map} vendedoresMap - Mapa de vendedores existentes
 * @param {number} minSimilarity - Umbral mínimo de similitud (0.7 por defecto)
 * @returns {Object|null} Vendedor encontrado o null
 */
function findBestVendedorMatch(nombreBuscado, vendedoresMap, minSimilarity = 0.7) {
    const normalizedTarget = normalizeName(nombreBuscado);
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const [normalizedKey, vendedor] of vendedoresMap.entries()) {
        // Coincidencia exacta
        if (normalizedKey === normalizedTarget) {
            return vendedor;
        }
        
        // Similitud de Levenshtein
        const similarity = calculateSimilarity(normalizedTarget, normalizedKey);
        
        if (similarity > bestSimilarity && similarity >= minSimilarity) {
            bestSimilarity = similarity;
            bestMatch = vendedor;
        }
    }
    
    return bestMatch;
}

/**
 * Procesa la importación masiva de pedidos con transacciones y mejor manejo de errores
 * @param {Object} params - Parámetros de importación
 * @param {Array} params.rows - Filas de datos a importar
 * @param {Object} params.globalFields - Campos globales aplicados a todas las filas
 * @param {Object} params.options - Opciones de importación
 * @param {Object} params.dbClient - Cliente de base de datos
 * @param {Object} params.user - Usuario que realiza la importación
 * @returns {Object} Resultado de la importación
 */
async function processBulkImport({ rows, globalFields = {}, options = {}, dbClient, user = {} }) {
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Se esperaba un array de filas no vacío para importar');
    }
    
    // Validar que el usuario esté autenticado
    if (!user || !user.id) {
        throw new Error('Usuario no autenticado. No se puede procesar la importación.');
    }
    
    console.log(`📥 Iniciando importación de ${rows.length} pedidos por usuario: ${user.nombre} (${user.id})`);
    
    try {
        // Cargar todos los clientes en memoria para optimizar búsquedas
        const clientesData = await dbClient.query(
            'SELECT id, nombre FROM limpio.clientes WHERE estado = $1 ORDER BY nombre', 
            ['activo']
        );
        const clientesMap = new Map();
        clientesData.rows.forEach(cliente => {
            clientesMap.set(normalizeName(cliente.nombre), cliente);
        });
        
        console.log(`📋 Clientes cargados: ${clientesMap.size}`);
        
        // Cargar vendedores si es necesario
        const vendedoresData = await dbClient.query(
            'SELECT id, nombre FROM limpio.vendedores WHERE activo = $1 ORDER BY nombre', 
            [true]
        );
        const vendedoresMap = new Map();
        vendedoresData.rows.forEach(vendedor => {
            vendedoresMap.set(normalizeName(vendedor.nombre), vendedor);
        });
        
        console.log(`👥 Vendedores cargados: ${vendedoresMap.size}`);
        
        const processedPedidos = [];
        const errors = [];
        let successCount = 0;
        let createdClients = 0;
        let createdVendors = 0;
        
        // Cache de números de pedido existentes para detección rápida de duplicados
        const existingPedidosResult = await dbClient.query(
            'SELECT numero_pedido_cliente FROM limpio.pedidos'
        );
        const existingPedidos = new Set(
            existingPedidosResult.rows.map(row => row.numero_pedido_cliente?.toLowerCase().trim())
        );
        
        console.log(`🔍 Pedidos existentes en BD: ${existingPedidos.size}`);
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
                // Combinar datos mapeados con campos globales (prioridad a datos específicos)
                const pedidoData = { ...globalFields, ...row.mappedData };
                
                // 🐛 DEBUG: Log para verificar fechaEntrega
                if (pedidoData.fechaEntrega) {
                    console.log(`📅 DEBUG - Pedido "${pedidoData.numeroPedidoCliente}": fechaEntrega = "${pedidoData.fechaEntrega}"`);
                }
                if (pedidoData.metros) {
                    console.log(`📏 DEBUG - Pedido "${pedidoData.numeroPedidoCliente}": metros = ${pedidoData.metros}`);
                }
                
                // Validar número de pedido único ANTES de procesamiento pesado
                if (pedidoData.numeroPedidoCliente) {
                    const normalizedNumber = pedidoData.numeroPedidoCliente.toLowerCase().trim();
                    if (existingPedidos.has(normalizedNumber)) {
                        throw new Error(`Ya existe un pedido con el número "${pedidoData.numeroPedidoCliente}"`);
                    }
                }
                
                // Resolver cliente por nombre (con búsqueda fuzzy)
                if (pedidoData.cliente && !pedidoData.clienteId) {
                    // Primero intentar búsqueda fuzzy
                    const clienteMatch = findBestClientMatch(pedidoData.cliente, clientesMap, 0.7);
                    
                    if (clienteMatch) {
                        pedidoData.clienteId = clienteMatch.id;
                        pedidoData.cliente = clienteMatch.nombre; // Normalizar nombre
                        console.log(`🔍 Cliente encontrado por similitud: "${pedidoData.cliente}" → "${clienteMatch.nombre}"`);
                    } else {
                        // Crear cliente automáticamente si no existe
                        const nuevoCliente = {
                            id: null, // PostgreSQL generará el UUID automáticamente
                            nombre: pedidoData.cliente.trim(),
                            razon_social: pedidoData.cliente.trim(),
                            persona_contacto: '',
                            telefono: '',
                            email: '',
                            direccion_fiscal: '',
                            estado: 'activo',
                            notas: 'Creado automáticamente durante importación masiva'
                        };
                        
                        // Insertar cliente en BD (esquema limpio)
                        const clienteResult = await dbClient.query(
                            `INSERT INTO limpio.clientes (nombre, razon_social, persona_contacto, telefono, email, direccion_fiscal, estado, notas) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                            [
                                nuevoCliente.nombre,
                                nuevoCliente.razon_social,
                                nuevoCliente.persona_contacto,
                                nuevoCliente.telefono,
                                nuevoCliente.email,
                                nuevoCliente.direccion_fiscal,
                                nuevoCliente.estado,
                                nuevoCliente.notas
                            ]
                        );
                        
                        // Obtener el ID generado por PostgreSQL
                        nuevoCliente.id = clienteResult.rows[0].id;
                        
                        // Agregar al mapa para futuros usos en este batch
                        const clienteKey = normalizeName(nuevoCliente.nombre);
                        clientesMap.set(clienteKey, nuevoCliente);
                        
                        pedidoData.clienteId = nuevoCliente.id;
                        pedidoData.cliente = nuevoCliente.nombre;
                        
                        createdClients++;
                        console.log(`✅ Cliente "${nuevoCliente.nombre}" creado automáticamente (${createdClients} nuevos en este batch)`);
                    }
                }
                
                // Resolver vendedor por nombre (con búsqueda fuzzy)
                if (pedidoData.vendedorNombre && !pedidoData.vendedorId) {
                    // Primero intentar búsqueda fuzzy
                    const vendedorMatch = findBestVendedorMatch(pedidoData.vendedorNombre, vendedoresMap, 0.7);
                    
                    if (vendedorMatch) {
                        pedidoData.vendedorId = vendedorMatch.id;
                        pedidoData.vendedorNombre = vendedorMatch.nombre;
                        console.log(`🔍 Vendedor encontrado por similitud: "${pedidoData.vendedorNombre}" → "${vendedorMatch.nombre}"`);
                    } else {
                        // Crear vendedor automáticamente si no existe
                        const nuevoVendedor = {
                            id: null, // PostgreSQL generará el UUID automáticamente
                            nombre: pedidoData.vendedorNombre.trim(),
                            email: '',
                            telefono: '',
                            activo: true
                        };
                        
                        // Insertar vendedor en BD (esquema limpio)
                        const vendedorResult = await dbClient.query(
                            `INSERT INTO limpio.vendedores (nombre, email, telefono, activo) 
                             VALUES ($1, $2, $3, $4) RETURNING id`,
                            [
                                nuevoVendedor.nombre,
                                nuevoVendedor.email,
                                nuevoVendedor.telefono,
                                nuevoVendedor.activo
                            ]
                        );
                        
                        // Obtener el ID generado por PostgreSQL
                        nuevoVendedor.id = vendedorResult.rows[0].id;
                        
                        // Agregar al mapa para futuros usos en este batch
                        const vendedorKey = normalizeName(nuevoVendedor.nombre);
                        vendedoresMap.set(vendedorKey, nuevoVendedor);
                        
                        pedidoData.vendedorId = nuevoVendedor.id;
                        pedidoData.vendedorNombre = nuevoVendedor.nombre;
                        
                        createdVendors++;
                        console.log(`✅ Vendedor "${nuevoVendedor.nombre}" creado automáticamente (${createdVendors} nuevos en este batch)`);
                    }
                }
                
                // Generar ID único para el pedido
                const pedidoId = generatePedidoId();
                const currentDate = new Date().toISOString();
                
                // Obtener siguiente número de secuencia (esquema limpio)
                const maxSeqResult = await dbClient.query('SELECT COALESCE(MAX(secuencia_pedido), 0) as max_seq FROM limpio.pedidos');
                const nextSequence = maxSeqResult.rows[0].max_seq + 1;
                
                // Preparar datos completos del pedido
                const completePedido = {
                    id: pedidoId,
                    secuenciaPedido: nextSequence,
                    orden: nextSequence,
                    numeroRegistro: `REG-${nextSequence.toString().padStart(6, '0')}`,
                    numeroPedidoCliente: pedidoData.numeroPedidoCliente,
                    numerosCompra: pedidoData.numerosCompra || [],
                    cliente: pedidoData.cliente,
                    clienteId: pedidoData.clienteId || null,
                    fechaCreacion: (pedidoData.fechaCreacion && String(pedidoData.fechaCreacion).trim() !== '') ? pedidoData.fechaCreacion : currentDate,
                    fechaEntrega: pedidoData.fechaEntrega,
                    nuevaFechaEntrega: pedidoData.nuevaFechaEntrega || null,
                    metros: Number(pedidoData.metros) || 0,
                    maquinaImpresion: pedidoData.maquinaImpresion || '',
                    vendedorId: pedidoData.vendedorId || null,
                    vendedorNombre: pedidoData.vendedorNombre || null,
                    etapaActual: pedidoData.etapaActual || DEFAULT_ETAPA,
                    subEtapaActual: pedidoData.subEtapaActual || null,
                    prioridad: pedidoData.prioridad || DEFAULT_PRIORIDAD,
                    tipoImpresion: pedidoData.tipoImpresion || DEFAULT_TIPO_IMPRESION,
                    desarrollo: pedidoData.desarrollo || pedidoData.producto || '',
                    capa: pedidoData.capa || '',
                    producto: pedidoData.producto ? String(pedidoData.producto).toUpperCase().trim() : null,
                    velocidadPosible: pedidoData.velocidadPosible || null,
                    tiempoProduccionDecimal: pedidoData.tiempoProduccionDecimal || null,
                    observaciones: pedidoData.observaciones || '',
                    observacionesRapidas: pedidoData.observacionesRapidas || null,
                    observacionesMaterial: pedidoData.observacionesMaterial || null,
                    tiempoProduccionPlanificado: '00:00',
                    secuenciaTrabajo: [pedidoData.etapaActual || DEFAULT_ETAPA],
                    etapasSecuencia: [{
                        etapa: pedidoData.etapaActual || DEFAULT_ETAPA,
                        fecha: currentDate
                    }],
                    subEtapasSecuencia: pedidoData.subEtapaActual ? [{
                        subEtapa: pedidoData.subEtapaActual,
                        fecha: currentDate
                    }] : [],
                    historial: [{
                        id: generateHistorialId(),
                        type: 'CREATE',
                        timestamp: currentDate,
                        userId: user.id,
                        userName: user.nombre || user.email || 'Usuario',
                        description: `Pedido importado masivamente desde Excel por ${user.nombre || user.email}`,
                        changes: []
                    }],
                    // Campos de preparación y cliché
                    materialDisponible: pedidoData.materialDisponible || false,
                    clicheDisponible: pedidoData.clicheDisponible || false,
                    estadoCliché: pedidoData.estadoCliché || null,
                    clicheInfoAdicional: pedidoData.clicheInfoAdicional || null,
                    compraCliche: pedidoData.compraCliche || null,
                    horasConfirmadas: pedidoData.horasConfirmadas || false,
                    recepcionCliche: pedidoData.recepcionCliche || null,
                    camisa: pedidoData.camisa || null,
                    // Campos de post-impresión
                    antivaho: pedidoData.antivaho || false,
                    antivahoRealizado: pedidoData.antivahoRealizado || false,
                    microperforado: pedidoData.microperforado || false,
                    macroperforado: pedidoData.macroperforado || false,
                    anonimo: pedidoData.anonimo || false,
                    anonimoPostImpresion: pedidoData.anonimoPostImpresion || null,
                    atencionObservaciones: pedidoData.atencionObservaciones || false,
                    // Campos de material
                    materialConsumoCantidad: pedidoData.materialConsumoCantidad || null,
                    materialConsumo: pedidoData.materialConsumo || null,
                    // Campos de bobinas y producción
                    bobinaMadre: pedidoData.bobinaMadre || null,
                    bobinaFinal: pedidoData.bobinaFinal || null,
                    colores: pedidoData.colores || null,
                    minColor: pedidoData.minColor || null,
                    minAdap: pedidoData.minAdap || null
                };
                
                // Validar campos requeridos usando función centralizada
                validatePedidoData(completePedido);
                
                // Verificar duplicado usando cache (más eficiente que query por cada fila)
                const normalizedNumber = completePedido.numeroPedidoCliente.toLowerCase().trim();
                if (existingPedidos.has(normalizedNumber)) {
                    throw new Error(`Ya existe un pedido con el número "${completePedido.numeroPedidoCliente}"`);
                }
                
                // Insertar en la base de datos
                await dbClient.create(completePedido);
                
                // Agregar al cache para evitar duplicados dentro del mismo batch
                existingPedidos.add(normalizedNumber);
                
                processedPedidos.push(completePedido);
                successCount++;
                
                if (successCount % 10 === 0) {
                    console.log(`📊 Progreso: ${successCount}/${rows.length} pedidos procesados...`);
                }
                
            } catch (error) {
                console.error(`❌ Error procesando fila ${i + 1}:`, error.message);
                errors.push({
                    rowIndex: i,
                    rowData: row.originalData,
                    error: error.message
                });
            }
        }
        
        console.log(`\n📈 Resumen de importación:`);
        console.log(`   ✅ Exitosos: ${successCount}/${rows.length}`);
        console.log(`   ❌ Errores: ${errors.length}`);
        console.log(`   👤 Clientes nuevos: ${createdClients}`);
        console.log(`   💼 Vendedores nuevos: ${createdVendors}`);
        
        return {
            success: true,
            result: {
                totalRows: rows.length,
                successCount,
                errorCount: errors.length,
                createdClients,
                createdVendors,
                importedPedidos: processedPedidos,
                errors: errors.slice(0, MAX_ERRORS_TO_RETURN), // Limitar errores para evitar respuesta demasiado grande
                user: {
                    id: user.id,
                    nombre: user.nombre || user.email
                }
            },
            processedCount: rows.length,
            remainingCount: 0
        };
        
    } catch (error) {
        console.error("💥 Error crítico en importación por lotes:", error);
        return {
            success: false,
            error: error.message || "Error interno del servidor durante la importación por lotes.",
            processedCount: 0,
            remainingCount: rows?.length || 0
        };
    }
}

/**
 * Crea el endpoint de importación masiva para Express
 * @param {Function} requirePermission - Middleware de permisos
 * @param {Object} dbClient - Cliente de base de datos
 * @param {Function} broadcastToClients - Función para emitir eventos WebSocket
 * @returns {Function} Handler del endpoint
 */
function createImportBatchEndpoint(requirePermission, dbClient, broadcastToClients) {
    return async (req, res) => {
        try {
            const { rows, globalFields, options = {} } = req.body;
            
            if (!Array.isArray(rows)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Se esperaba un array de filas para importar.' 
                });
            }
            
            // Procesar importación
            const result = await processBulkImport({
                rows,
                globalFields,
                options,
                dbClient,
                user: req.user
            });
            
            // Emitir evento WebSocket si hay pedidos creados exitosamente
            if (result.success && result.result && result.result.importedPedidos.length > 0) {
                broadcastToClients('pedidos-imported', {
                    importedCount: result.result.importedPedidos.length,
                    pedidos: result.result.importedPedidos.slice(0, MAX_PEDIDOS_IN_WEBSOCKET),
                    message: `${result.result.importedPedidos.length} pedido${result.result.importedPedidos.length === 1 ? '' : 's'} importado${result.result.importedPedidos.length === 1 ? '' : 's'} exitosamente`,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Responder según el resultado
            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(500).json(result);
            }
            
        } catch (error) {
            console.error("Error en endpoint de importación por lotes:", error);
            res.status(500).json({ 
                success: false, 
                error: "Error interno del servidor durante la importación por lotes.",
                processedCount: 0,
                remainingCount: req.body.rows?.length || 0
            });
        }
    };
}

module.exports = {
    generatePedidoId,
    generateHistorialId,
    processBulkImport,
    createImportBatchEndpoint
};