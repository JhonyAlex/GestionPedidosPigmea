/**
 * Rutas de API para Importación de Pedidos desde PDF
 * 
 * Endpoints:
 * - POST /api/pdf/upload - Subir PDF y extraer texto
 * - POST /api/pdf/apply-rules - Aplicar reglas de extracción
 * - POST /api/pdf/preview - Vista previa de datos extraídos
 * - GET /api/pdf/configs - Listar configuraciones guardadas
 * - POST /api/pdf/configs - Crear nueva configuración
 * - PUT /api/pdf/configs/:id - Actualizar configuración
 * - DELETE /api/pdf/configs/:id - Eliminar configuración
 */

const express = require('express');
const multer = require('multer');
const {
    extractTextFromPdf,
    applyExtractionRules,
    mapExtractedToPedido,
    createPdfConfigDbFunctions,
    SYSTEM_FIELDS,
    EXTRACTION_TYPES
} = require('../services/pdfService');

// Configurar multer para almacenamiento en memoria (no guardamos el PDF)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // Máximo 10MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

/**
 * Factory function para crear el router de PDF
 * @param {Object} dbClient - Cliente de base de datos
 * @param {Object} io - Instancia de Socket.IO
 * @param {Function} requireAuth - Middleware de autenticación
 * @param {Function} requirePermission - Middleware de permisos
 * @returns {express.Router}
 */
function createPdfRouter(dbClient, io, requireAuth, requirePermission) {
    const router = express.Router();
    
    // Funciones de BD para configuraciones
    let pdfConfigDb = null;
    
    // Inicializar funciones de BD cuando esté disponible
    const getPdfConfigDb = () => {
        if (!pdfConfigDb && dbClient.isInitialized) {
            pdfConfigDb = createPdfConfigDbFunctions(dbClient);
        }
        return pdfConfigDb;
    };
    
    // ========================================================================
    // POST /upload - Subir PDF y extraer texto
    // ========================================================================
    router.post('/upload', requireAuth, upload.single('pdf'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No se ha proporcionado ningún archivo PDF'
                });
            }
            
            console.log(`📄 Procesando PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
            
            // Extraer texto del PDF
            const extracted = await extractTextFromPdf(req.file.buffer);
            
            console.log(`✅ Texto extraído: ${extracted.lines.length} líneas, ${extracted.numPages} páginas`);
            
            res.json({
                success: true,
                filename: req.file.originalname,
                filesize: req.file.size,
                numPages: extracted.numPages,
                text: extracted.text,
                lines: extracted.lines,
                info: extracted.info
            });
            
        } catch (error) {
            console.error('❌ Error procesando PDF:', error);
            res.status(500).json({
                error: 'Error al procesar el PDF',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // POST /apply-rules - Aplicar reglas de extracción al texto
    // ========================================================================
    router.post('/apply-rules', requireAuth, async (req, res) => {
        try {
            const { text, lines, rules } = req.body;
            
            if (!text || !rules) {
                return res.status(400).json({
                    error: 'Se requiere texto y reglas de extracción'
                });
            }
            
            // Aplicar reglas de extracción
            const textLines = lines || text.split('\n').map(l => l.trim()).filter(l => l);
            const extracted = applyExtractionRules(text, textLines, rules);
            
            res.json({
                success: true,
                extracted,
                fieldsFound: Object.keys(extracted).length
            });
            
        } catch (error) {
            console.error('❌ Error aplicando reglas:', error);
            res.status(500).json({
                error: 'Error al aplicar reglas de extracción',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // POST /preview - Vista previa completa con mapeo a campos de pedido
    // ========================================================================
    router.post('/preview', requireAuth, async (req, res) => {
        try {
            const { text, lines, rules, fieldMappings } = req.body;
            
            if (!text || !rules || !fieldMappings) {
                return res.status(400).json({
                    error: 'Se requiere texto, reglas y mapeo de campos'
                });
            }
            
            // Aplicar reglas de extracción
            const textLines = lines || text.split('\n').map(l => l.trim()).filter(l => l);
            const extracted = applyExtractionRules(text, textLines, rules);
            
            // Mapear a campos del sistema de pedidos
            const pedidoData = mapExtractedToPedido(extracted, fieldMappings);
            
            // Validar campos requeridos
            const validation = {
                isValid: true,
                errors: [],
                warnings: []
            };
            
            if (!pedidoData.numeroPedidoCliente) {
                validation.isValid = false;
                validation.errors.push('Número de pedido no encontrado');
            }
            if (!pedidoData.cliente) {
                validation.isValid = false;
                validation.errors.push('Cliente no encontrado');
            }
            if (!pedidoData.fechaEntrega) {
                validation.warnings.push('Fecha de entrega no encontrada');
            }
            if (!pedidoData.metros) {
                validation.warnings.push('Metros no encontrados');
            }
            
            res.json({
                success: true,
                extracted,
                pedidoData,
                validation
            });
            
        } catch (error) {
            console.error('❌ Error en preview:', error);
            res.status(500).json({
                error: 'Error al generar vista previa',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // GET /configs - Listar configuraciones guardadas
    // ========================================================================
    router.get('/configs', requireAuth, async (req, res) => {
        try {
            const db = getPdfConfigDb();
            if (!db) {
                return res.status(503).json({
                    error: 'Base de datos no disponible'
                });
            }
            
            const configs = await db.getAllConfigs();
            
            res.json({
                success: true,
                configs: configs.map(c => ({
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    extractionRules: c.extraction_rules,
                    fieldMappings: c.field_mappings,
                    clienteId: c.cliente_id,
                    clienteNombre: c.cliente_nombre,
                    usageCount: c.usage_count,
                    lastUsedAt: c.last_used_at,
                    createdAt: c.created_at
                }))
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo configs:', error);
            res.status(500).json({
                error: 'Error al obtener configuraciones',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // POST /configs - Crear nueva configuración
    // ========================================================================
    router.post('/configs', requirePermission('pedidos.create'), async (req, res) => {
        try {
            const { name, description, extractionRules, fieldMappings, clienteId } = req.body;
            
            if (!name || !extractionRules) {
                return res.status(400).json({
                    error: 'Se requiere nombre y reglas de extracción'
                });
            }
            
            const db = getPdfConfigDb();
            if (!db) {
                return res.status(503).json({
                    error: 'Base de datos no disponible'
                });
            }
            
            const userId = req.user?.id || null;
            
            const newConfig = await db.createConfig({
                name,
                description,
                extractionRules,
                fieldMappings: fieldMappings || {},
                clienteId,
                createdBy: userId
            });
            
            console.log(`✅ Nueva configuración PDF creada: ${name}`);
            
            res.status(201).json({
                success: true,
                config: {
                    id: newConfig.id,
                    name: newConfig.name,
                    description: newConfig.description,
                    extractionRules: newConfig.extraction_rules,
                    fieldMappings: newConfig.field_mappings,
                    createdAt: newConfig.created_at
                }
            });
            
        } catch (error) {
            console.error('❌ Error creando config:', error);
            res.status(500).json({
                error: 'Error al crear configuración',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // PUT /configs/:id - Actualizar configuración
    // ========================================================================
    router.put('/configs/:id', requirePermission('pedidos.create'), async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, extractionRules, fieldMappings, clienteId } = req.body;
            
            const db = getPdfConfigDb();
            if (!db) {
                return res.status(503).json({
                    error: 'Base de datos no disponible'
                });
            }
            
            const updated = await db.updateConfig(id, {
                name,
                description,
                extractionRules,
                fieldMappings,
                clienteId
            });
            
            if (!updated) {
                return res.status(404).json({
                    error: 'Configuración no encontrada'
                });
            }
            
            console.log(`✅ Configuración PDF actualizada: ${updated.name}`);
            
            res.json({
                success: true,
                config: {
                    id: updated.id,
                    name: updated.name,
                    description: updated.description,
                    extractionRules: updated.extraction_rules,
                    fieldMappings: updated.field_mappings,
                    updatedAt: updated.updated_at
                }
            });
            
        } catch (error) {
            console.error('❌ Error actualizando config:', error);
            res.status(500).json({
                error: 'Error al actualizar configuración',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // DELETE /configs/:id - Eliminar configuración (soft delete)
    // ========================================================================
    router.delete('/configs/:id', requirePermission('pedidos.create'), async (req, res) => {
        try {
            const { id } = req.params;
            
            const db = getPdfConfigDb();
            if (!db) {
                return res.status(503).json({
                    error: 'Base de datos no disponible'
                });
            }
            
            const deleted = await db.deleteConfig(id);
            
            if (!deleted) {
                return res.status(404).json({
                    error: 'Configuración no encontrada'
                });
            }
            
            console.log(`🗑️ Configuración PDF eliminada: ${id}`);
            
            res.json({
                success: true,
                message: 'Configuración eliminada'
            });
            
        } catch (error) {
            console.error('❌ Error eliminando config:', error);
            res.status(500).json({
                error: 'Error al eliminar configuración',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // POST /configs/:id/use - Registrar uso de configuración
    // ========================================================================
    router.post('/configs/:id/use', requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            
            const db = getPdfConfigDb();
            if (!db) {
                return res.status(503).json({
                    error: 'Base de datos no disponible'
                });
            }
            
            await db.incrementUsage(id);
            
            res.json({ success: true });
            
        } catch (error) {
            console.error('❌ Error registrando uso:', error);
            res.status(500).json({
                error: 'Error al registrar uso',
                message: error.message
            });
        }
    });
    
    // ========================================================================
    // GET /system-fields - Obtener campos del sistema disponibles para mapeo
    // ========================================================================
    router.get('/system-fields', requireAuth, (req, res) => {
        res.json({
            success: true,
            fields: SYSTEM_FIELDS,
            extractionTypes: Object.values(EXTRACTION_TYPES)
        });
    });
    
    return router;
}

module.exports = { createPdfRouter };
