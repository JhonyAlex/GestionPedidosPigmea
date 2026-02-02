/**
 * Servicio de Procesamiento de PDFs para Importación de Pedidos
 * 
 * Características:
 * - Extracción de texto de archivos PDF
 * - Aplicación de reglas de extracción configurables (regex, delimitadores)
 * - Parsing de campos extraídos a formato de pedido
 * - Gestión de configuraciones de mapeo guardadas
 */

const pdfParse = require('pdf-parse');

// ============================================================================
// CONSTANTES
// ============================================================================

const EXTRACTION_TYPES = {
    REGEX: 'regex',
    DELIMITER: 'delimiter',
    POSITION: 'position',
    LINE_CONTAINS: 'line_contains'
};

// Campos del sistema de pedidos que se pueden mapear
const SYSTEM_FIELDS = [
    'numeroPedidoCliente',
    'cliente',
    'fechaEntrega',
    'metros',
    'ancho',
    'observaciones',
    'prioridad',
    'nombreProducto',
    'vendedor',
    'tipoImpresion',
    'numeroColores',
    'tratado',
    'solapa',
    'fuelle',
    'confeccion',
    'perforado'
];

// ============================================================================
// FUNCIONES DE EXTRACCIÓN DE TEXTO
// ============================================================================

/**
 * Extrae el texto completo de un buffer de PDF
 * @param {Buffer} pdfBuffer - Buffer del archivo PDF
 * @returns {Promise<{text: string, numPages: number, info: Object}>}
 */
async function extractTextFromPdf(pdfBuffer) {
    try {
        const data = await pdfParse(pdfBuffer);
        
        return {
            text: data.text,
            numPages: data.numpages,
            info: data.info || {},
            // Texto dividido en líneas para facilitar el mapeo
            lines: data.text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        };
    } catch (error) {
        console.error('❌ Error extrayendo texto del PDF:', error);
        throw new Error(`Error al procesar el PDF: ${error.message}`);
    }
}

// ============================================================================
// FUNCIONES DE APLICACIÓN DE REGLAS
// ============================================================================

/**
 * Aplica reglas de extracción al texto del PDF
 * @param {string} text - Texto completo del PDF
 * @param {string[]} lines - Líneas del PDF
 * @param {Object} rules - Reglas de extracción {fieldName: {type, pattern, ...}}
 * @returns {Object} Campos extraídos {fieldName: extractedValue}
 */
function applyExtractionRules(text, lines, rules) {
    const extracted = {};
    
    for (const [fieldName, rule] of Object.entries(rules)) {
        try {
            const value = extractFieldByRule(text, lines, rule);
            if (value !== null && value !== undefined && value !== '') {
                extracted[fieldName] = value;
            }
        } catch (error) {
            console.warn(`⚠️ Error extrayendo campo "${fieldName}":`, error.message);
        }
    }
    
    return extracted;
}

/**
 * Extrae un campo específico usando una regla
 * @param {string} text - Texto completo
 * @param {string[]} lines - Líneas del texto
 * @param {Object} rule - Regla de extracción
 * @returns {string|null} Valor extraído
 */
function extractFieldByRule(text, lines, rule) {
    switch (rule.type) {
        case EXTRACTION_TYPES.REGEX:
            return extractByRegex(text, rule.pattern, rule.group || 1);
            
        case EXTRACTION_TYPES.DELIMITER:
            return extractByDelimiters(text, rule.startMarker, rule.endMarker);
            
        case EXTRACTION_TYPES.LINE_CONTAINS:
            return extractByLineContains(lines, rule.contains, rule.offset || 0, rule.extractPattern);
            
        case EXTRACTION_TYPES.POSITION:
            return extractByPosition(lines, rule.lineIndex, rule.startChar, rule.endChar);
            
        default:
            console.warn(`Tipo de extracción desconocido: ${rule.type}`);
            return null;
    }
}

/**
 * Extrae texto usando expresión regular
 * @param {string} text - Texto completo
 * @param {string} pattern - Patrón regex
 * @param {number} group - Grupo de captura (default: 1)
 * @returns {string|null}
 */
function extractByRegex(text, pattern, group = 1) {
    try {
        const regex = new RegExp(pattern, 'im');
        const match = text.match(regex);
        if (match && match[group]) {
            return match[group].trim();
        }
        // Si no hay grupo específico, devolver el match completo
        if (match && match[0] && group === 0) {
            return match[0].trim();
        }
        return null;
    } catch (error) {
        console.error(`Error en regex "${pattern}":`, error.message);
        return null;
    }
}

/**
 * Extrae texto entre dos marcadores
 * @param {string} text - Texto completo
 * @param {string} startMarker - Texto inicial
 * @param {string} endMarker - Texto final
 * @returns {string|null}
 */
function extractByDelimiters(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return null;
    
    const contentStart = startIndex + startMarker.length;
    
    if (endMarker) {
        const endIndex = text.indexOf(endMarker, contentStart);
        if (endIndex === -1) return null;
        return text.substring(contentStart, endIndex).trim();
    }
    
    // Si no hay endMarker, tomar hasta el final de la línea
    const lineEnd = text.indexOf('\n', contentStart);
    if (lineEnd === -1) {
        return text.substring(contentStart).trim();
    }
    return text.substring(contentStart, lineEnd).trim();
}

/**
 * Extrae texto de una línea que contiene cierto texto
 * @param {string[]} lines - Líneas del texto
 * @param {string} contains - Texto que debe contener la línea
 * @param {number} offset - Offset de líneas (0 = misma línea, 1 = siguiente, etc.)
 * @param {string} extractPattern - Patrón regex para extraer valor de la línea
 * @returns {string|null}
 */
function extractByLineContains(lines, contains, offset = 0, extractPattern = null) {
    const lineIndex = lines.findIndex(line => 
        line.toLowerCase().includes(contains.toLowerCase())
    );
    
    if (lineIndex === -1) return null;
    
    const targetLine = lines[lineIndex + offset];
    if (!targetLine) return null;
    
    if (extractPattern) {
        return extractByRegex(targetLine, extractPattern, 1);
    }
    
    // Si no hay patrón, devolver el contenido después del texto buscado
    const colonIndex = targetLine.indexOf(':');
    if (colonIndex !== -1) {
        return targetLine.substring(colonIndex + 1).trim();
    }
    
    return targetLine.trim();
}

/**
 * Extrae texto por posición absoluta
 * @param {string[]} lines - Líneas del texto
 * @param {number} lineIndex - Índice de línea (0-based)
 * @param {number} startChar - Posición inicial de caracter
 * @param {number} endChar - Posición final de caracter (opcional)
 * @returns {string|null}
 */
function extractByPosition(lines, lineIndex, startChar = 0, endChar = null) {
    if (lineIndex < 0 || lineIndex >= lines.length) return null;
    
    const line = lines[lineIndex];
    if (endChar !== null) {
        return line.substring(startChar, endChar).trim();
    }
    return line.substring(startChar).trim();
}

// ============================================================================
// FUNCIONES DE PARSING Y TRANSFORMACIÓN
// ============================================================================

/**
 * Transforma campos extraídos a formato de pedido del sistema
 * @param {Object} extracted - Campos extraídos {extractedField: value}
 * @param {Object} fieldMappings - Mapeo {extractedField: systemField}
 * @returns {Object} Datos de pedido mapeados
 */
function mapExtractedToPedido(extracted, fieldMappings) {
    const pedido = {};
    
    for (const [extractedField, systemField] of Object.entries(fieldMappings)) {
        if (systemField === 'ignore' || !SYSTEM_FIELDS.includes(systemField)) {
            continue;
        }
        
        const value = extracted[extractedField];
        if (value !== null && value !== undefined) {
            pedido[systemField] = transformFieldValue(value, systemField);
        }
    }
    
    return pedido;
}

/**
 * Transforma un valor según el tipo de campo del sistema
 * @param {string} value - Valor extraído
 * @param {string} fieldName - Nombre del campo del sistema
 * @returns {any} Valor transformado
 */
function transformFieldValue(value, fieldName) {
    switch (fieldName) {
        case 'metros':
        case 'ancho':
        case 'numeroColores':
            // Parsear como número, manejar formato español (coma como decimal)
            const numStr = String(value).replace(/\./g, '').replace(',', '.');
            const num = parseFloat(numStr);
            return isNaN(num) ? 0 : num;
            
        case 'fechaEntrega':
            return parseSpanishDate(value);
            
        case 'tratado':
        case 'solapa':
        case 'fuelle':
        case 'perforado':
            // Convertir a booleano
            return parseBooleanField(value);
            
        case 'prioridad':
            return parseprioridad(value);
            
        default:
            return String(value).trim();
    }
}

/**
 * Parsea fecha en formato español (DD/MM/YYYY, DD-MM-YYYY, etc.)
 * @param {string} dateStr - String de fecha
 * @returns {string} Fecha en formato ISO (YYYY-MM-DD)
 */
function parseSpanishDate(dateStr) {
    if (!dateStr) return null;
    
    // Meses en español
    const meses = {
        'ene': '01', 'enero': '01',
        'feb': '02', 'febrero': '02',
        'mar': '03', 'marzo': '03',
        'abr': '04', 'abril': '04',
        'may': '05', 'mayo': '05',
        'jun': '06', 'junio': '06',
        'jul': '07', 'julio': '07',
        'ago': '08', 'agosto': '08',
        'sep': '09', 'sept': '09', 'septiembre': '09',
        'oct': '10', 'octubre': '10',
        'nov': '11', 'noviembre': '11',
        'dic': '12', 'diciembre': '12'
    };
    
    const str = String(dateStr).toLowerCase().trim();
    
    // Formato: DD/MM/YYYY o DD-MM-YYYY
    let match = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) {
            year = parseInt(year) > 50 ? '19' + year : '20' + year;
        }
        return `${year}-${month}-${day}`;
    }
    
    // Formato: DD de MMMM de YYYY o DD MMMM YYYY
    match = str.match(/(\d{1,2})\s*(?:de\s+)?(\w+)\s*(?:de\s+)?(\d{2,4})/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthStr = match[2].toLowerCase();
        const month = meses[monthStr] || meses[monthStr.substring(0, 3)];
        let year = match[3];
        if (year.length === 2) {
            year = parseInt(year) > 50 ? '19' + year : '20' + year;
        }
        if (month) {
            return `${year}-${month}-${day}`;
        }
    }
    
    // Intentar formato ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.substring(0, 10);
    }
    
    return dateStr; // Devolver original si no se puede parsear
}

/**
 * Parsea campo booleano desde texto
 * @param {string} value - Valor del campo
 * @returns {boolean}
 */
function parseBooleanField(value) {
    const str = String(value).toLowerCase().trim();
    return ['sí', 'si', 'yes', 'true', '1', 'x', '✓', '✔'].includes(str);
}

/**
 * Parsea prioridad desde texto
 * @param {string} value - Valor de prioridad
 * @returns {string} ALTA, MEDIA, NORMAL o BAJA
 */
function parseprioridad(value) {
    const str = String(value).toLowerCase().trim();
    if (str.includes('alta') || str.includes('urgent')) return 'ALTA';
    if (str.includes('media')) return 'MEDIA';
    if (str.includes('baja')) return 'BAJA';
    return 'NORMAL';
}

// ============================================================================
// FUNCIONES DE BASE DE DATOS
// ============================================================================

/**
 * Crea funciones CRUD para configs de PDF vinculadas a la BD
 * @param {Object} dbClient - Cliente de base de datos
 * @returns {Object} Funciones de BD
 */
function createPdfConfigDbFunctions(dbClient) {
    return {
        /**
         * Obtiene todas las configuraciones de importación activas
         */
        async getAllConfigs() {
            const result = await dbClient.pool.query(`
                SELECT 
                    pc.*,
                    c.nombre as cliente_nombre
                FROM limpio.pdf_import_configs pc
                LEFT JOIN limpio.clientes c ON pc.cliente_id = c.id
                WHERE pc.is_active = true
                ORDER BY pc.usage_count DESC, pc.name ASC
            `);
            return result.rows;
        },
        
        /**
         * Obtiene una configuración por ID
         */
        async getConfigById(id) {
            const result = await dbClient.pool.query(
                'SELECT * FROM limpio.pdf_import_configs WHERE id = $1 AND is_active = true',
                [id]
            );
            return result.rows[0] || null;
        },
        
        /**
         * Crea una nueva configuración
         */
        async createConfig(config) {
            const result = await dbClient.pool.query(`
                INSERT INTO limpio.pdf_import_configs 
                (name, description, extraction_rules, field_mappings, cliente_id, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                config.name,
                config.description || null,
                JSON.stringify(config.extractionRules || {}),
                JSON.stringify(config.fieldMappings || {}),
                config.clienteId || null,
                config.createdBy || null
            ]);
            return result.rows[0];
        },
        
        /**
         * Actualiza una configuración existente
         */
        async updateConfig(id, config) {
            const result = await dbClient.pool.query(`
                UPDATE limpio.pdf_import_configs 
                SET 
                    name = COALESCE($2, name),
                    description = COALESCE($3, description),
                    extraction_rules = COALESCE($4, extraction_rules),
                    field_mappings = COALESCE($5, field_mappings),
                    cliente_id = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND is_active = true
                RETURNING *
            `, [
                id,
                config.name,
                config.description,
                config.extractionRules ? JSON.stringify(config.extractionRules) : null,
                config.fieldMappings ? JSON.stringify(config.fieldMappings) : null,
                config.clienteId || null
            ]);
            return result.rows[0];
        },
        
        /**
         * Elimina (soft delete) una configuración
         */
        async deleteConfig(id) {
            const result = await dbClient.pool.query(`
                UPDATE limpio.pdf_import_configs 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id
            `, [id]);
            return result.rows[0] || null;
        },
        
        /**
         * Incrementa el contador de uso de una configuración
         */
        async incrementUsage(id) {
            await dbClient.pool.query(`
                UPDATE limpio.pdf_import_configs 
                SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [id]);
        }
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Extracción
    extractTextFromPdf,
    
    // Reglas
    applyExtractionRules,
    extractFieldByRule,
    EXTRACTION_TYPES,
    
    // Parsing
    mapExtractedToPedido,
    transformFieldValue,
    parseSpanishDate,
    
    // BD
    createPdfConfigDbFunctions,
    
    // Constantes
    SYSTEM_FIELDS
};
