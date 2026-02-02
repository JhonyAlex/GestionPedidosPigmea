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
 * Procesa la importación masiva de pedidos
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
        
        // Cargar vendedores si es necesario
        const vendedoresData = await dbClient.query(
            'SELECT id, nombre FROM limpio.vendedores WHERE activo = $1 ORDER BY nombre', 
            [true]
        );
        const vendedoresMap = new Map();
        vendedoresData.rows.forEach(vendedor => {
            vendedoresMap.set(normalizeName(vendedor.nombre), vendedor);
        });
        
        const processedPedidos = [];
        const errors = [];
        let successCount = 0;
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
                // Combinar datos mapeados con campos globales
                const pedidoData = { ...globalFields, ...row.mappedData };
                
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
                        
                        console.log(`✅ Cliente "${nuevoCliente.nombre}" creado automáticamente`);
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
                        
                        console.log(`✅ Vendedor "${nuevoVendedor.nombre}" creado automáticamente`);
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
                    cliente: pedidoData.cliente,
                    clienteId: pedidoData.clienteId || null,
                    fechaCreacion: currentDate,
                    fechaEntrega: pedidoData.fechaEntrega,
                    metros: Number(pedidoData.metros) || 0,
                    maquinaImpresion: pedidoData.maquinaImpresion || '',
                    vendedorId: pedidoData.vendedorId || null,
                    vendedorNombre: pedidoData.vendedorNombre || null,
                    etapaActual: pedidoData.etapaActual || DEFAULT_ETAPA,
                    prioridad: pedidoData.prioridad || DEFAULT_PRIORIDAD,
                    tipoImpresion: pedidoData.tipoImpresion || DEFAULT_TIPO_IMPRESION,
                    desarrollo: pedidoData.desarrollo || pedidoData.producto || '',
                    capa: pedidoData.capa || '',
                    observaciones: pedidoData.observaciones || '',
                    tiempoProduccionPlanificado: '00:00',
                    secuenciaTrabajo: [DEFAULT_ETAPA],
                    etapasSecuencia: [{
                        etapa: pedidoData.etapaActual || DEFAULT_ETAPA,
                        fecha: currentDate
                    }],
                    historial: [{
                        id: generateHistorialId(),
                        type: 'CREATE',
                        timestamp: currentDate,
                        userId: user.id || 'system',
                        userName: user.nombre || 'Sistema',
                        description: `Pedido importado desde Excel`,
                        changes: []
                    }],
                    // Campos adicionales con valores por defecto
                    materialDisponible: false,
                    clicheDisponible: false,
                    antivaho: false,
                    antivahoRealizado: false,
                    microperforado: false,
                    macroperforado: false,
                    anonimo: false,
                    atencionObservaciones: false
                };
                
                // Validar campos requeridos usando función centralizada
                validatePedidoData(completePedido);
                
                // Verificar que el número de pedido del cliente no exista (esquema limpio)
                const existingPedido = await dbClient.query(
                    'SELECT id FROM limpio.pedidos WHERE numero_pedido_cliente = $1',
                    [completePedido.numeroPedidoCliente]
                );
                
                if (existingPedido.rows.length > 0) {
                    throw new Error(`Ya existe un pedido con el número "${completePedido.numeroPedidoCliente}"`);
                }
                
                // Insertar en la base de datos
                await dbClient.create(completePedido);
                
                processedPedidos.push(completePedido);
                successCount++;
                
            } catch (error) {
                console.error(`Error procesando fila ${i + 1}:`, error);
                errors.push({
                    rowIndex: i,
                    rowData: row.originalData,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            result: {
                totalRows: rows.length,
                successCount,
                errorCount: errors.length,
                importedPedidos: processedPedidos,
                errors: errors.slice(0, MAX_ERRORS_TO_RETURN) // Limitar errores para evitar respuesta demasiado grande
            },
            processedCount: rows.length,
            remainingCount: 0
        };
        
    } catch (error) {
        console.error("Error en importación por lotes:", error);
        return {
            success: false,
            error: "Error interno del servidor durante la importación por lotes.",
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