// Utilidades para la importación masiva de pedidos desde Excel
import { Pedido } from '../types';
import { Cliente } from '../types/cliente';
import { Vendedor } from '../types/vendedor';

// Mapeo de abreviaciones de meses en español
const SPANISH_MONTHS = {
  'ene': 0, 'enero': 0,
  'feb': 1, 'febrero': 1,
  'mar': 2, 'marzo': 2,
  'abr': 3, 'abril': 3,
  'may': 4, 'mayo': 4,
  'jun': 5, 'junio': 5,
  'jul': 6, 'julio': 6,
  'ago': 7, 'agosto': 7,
  'sep': 8, 'sept': 8, 'septiembre': 8,
  'oct': 9, 'octubre': 9,
  'nov': 10, 'noviembre': 10,
  'dic': 11, 'diciembre': 11
};

/**
 * Convierte fechas en formato español a ISO Date
 * Formatos soportados: 
 * - "02/abr", "30/may" (día/mes, año por defecto 2026)
 * - "2-2", "15-3" (día-mes, año por defecto 2026)
 * - "15/ene/2025", "02/abril/2025" (día/mes/año completo)
 * - "2/5/2026", "02-may-2026" (varios formatos con año)
 * 
 * @param dateStr - String de fecha en formato español
 * @param defaultYear - Año por defecto si no se especifica (por defecto 2026)
 * @returns Date object o null si no se puede parsear
 */
export function parseSpanishDate(dateStr: string, defaultYear: number = 2026): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const trimmed = dateStr.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  
  // Separar por "/" o "-" o espacios
  const parts = trimmed.split(/[\/\-\s]+/);
  if (parts.length < 2) return null;
  
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1].toLowerCase();
  let year = parts.length >= 3 ? parseInt(parts[2], 10) : defaultYear;
  
  // Validar día
  if (isNaN(day) || day < 1 || day > 31) return null;
  
  // Buscar mes en el mapeo (primero texto, luego número)
  let month = SPANISH_MONTHS[monthStr];
  
  // Si no es un mes en español, intentar como número
  if (month === undefined) {
    const monthNum = parseInt(monthStr, 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      month = monthNum - 1; // JavaScript usa meses 0-based
    } else {
      return null;
    }
  }
  
  // Manejar años de 2 dígitos
  if (year < 100) {
    // Si el año es 26, 27, etc., asumir 2026, 2027
    // Si el año es 99, 00, etc., podría ser 1999, 2000 (pero priorizamos 20xx)
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    year = currentCentury + year;
    
    // Si el año es muy futuro (más de 10 años), probablemente pertenece al siglo pasado
    if (year > currentYear + 10) {
      year -= 100;
    }
  }
  
  // Crear fecha
  const date = new Date(year, month, day);
  
  // Validar que la fecha sea válida (ej: 31 de febrero sería inválida)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
}

/**
 * Convierte números en formato español a float de JavaScript
 * Formatos soportados: "10.000" (miles), "0,914" (decimales con coma), "1.500,25"
 * @param numberStr - String de número en formato español
 * @returns number o null si no se puede parsear
 */
export function parseSpanishNumber(numberStr: string | number): number | null {
  if (typeof numberStr === 'number') return numberStr;
  if (!numberStr || typeof numberStr !== 'string') return null;
  
  const trimmed = numberStr.trim();
  if (!trimmed) return null;
  
  // Remover espacios
  let cleaned = trimmed.replace(/\s/g, '');
  
  // Si contiene coma como decimal (formato español)
  if (cleaned.includes(',')) {
    // Si también tiene puntos, son separadores de miles
    if (cleaned.includes('.')) {
      // Ejemplo: "1.500,25" -> "1500.25"
      const parts = cleaned.split(',');
      if (parts.length === 2) {
        const integerPart = parts[0].replace(/\./g, ''); // Remover puntos de miles
        const decimalPart = parts[1];
        cleaned = integerPart + '.' + decimalPart;
      }
    } else {
      // Solo coma como decimal: "0,914" -> "0.914"
      cleaned = cleaned.replace(',', '.');
    }
  }
  // Si solo tiene puntos (SIN comas), en formato español son separadores de miles
  else if (cleaned.includes('.')) {
    // En español, si no hay coma, el punto es separador de miles
    // Ejemplos: "20.000" -> 20000, "1.500.000" -> 1500000
    // SOLO si la parte después del último punto tiene exactamente 3 dígitos (patrón de miles)
    const parts = cleaned.split('.');
    
    // Verificar si todos los grupos (excepto el primero) tienen exactamente 3 dígitos
    let isMilesSeparator = true;
    if (parts.length > 1) {
      // El primer grupo puede tener 1-3 dígitos, los demás deben tener exactamente 3
      for (let i = 1; i < parts.length; i++) {
        if (parts[i].length !== 3) {
          isMilesSeparator = false;
          break;
        }
      }
    }
    
    if (isMilesSeparator) {
      // Son separadores de miles: "20.000" -> "20000"
      cleaned = cleaned.replace(/\./g, '');
    }
    // Si no cumple el patrón de miles, podría ser decimal (poco común en español)
    // En ese caso, se mantiene como está (el parseFloat lo interpretará como decimal)
  }
  
  const result = parseFloat(cleaned);
  return isNaN(result) ? null : result;
}

/**
 * Convierte texto Tab-separated en matriz bidimensional
 * @param tsvText - Texto con valores separados por tabs
 * @returns Matriz de strings
 */
export function parseTSV(tsvText: string): string[][] {
  if (!tsvText) return [];
  
  const lines = tsvText.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => line.split('\t'));
}

/**
 * Detecta automáticamente la fila de encabezados
 * Busca la fila que más parezca contener nombres de columnas (no números/fechas)
 * @param data - Matriz de datos
 * @returns Índice de la fila de encabezados (0-based) o 0 por defecto
 */
export function detectHeaders(data: string[][]): number {
  if (!data.length) return 0;
  
  // Calcular score para cada fila (mayor score = más probable que sea header)
  const scores = data.map((row, index) => {
    if (index >= Math.min(5, data.length)) return -1; // Solo evaluar las primeras 5 filas
    
    let score = 0;
    
    for (const cell of row) {
      const trimmed = cell.trim();
      if (!trimmed) continue;
      
      // Penalizar si es un número puro
      if (/^\d+([.,]\d+)*$/.test(trimmed)) {
        score -= 2;
        continue;
      }
      
      // Penalizar si parece fecha
      if (/^\d{1,2}[\/\-]\w{3,4}/.test(trimmed) || /^\d{1,2}[\/\-]\d{1,2}/.test(trimmed)) {
        score -= 1;
        continue;
      }
      
      // Bonificar si contiene palabras típicas de headers
      const headerKeywords = [
        'pedido', 'producto', 'cliente', 'material', 'cantidad', 'fecha', 'entrega',
        'metros', 'vendedor', 'observaciones', 'tipo', 'color', 'referencia'
      ];
      
      if (headerKeywords.some(keyword => trimmed.toLowerCase().includes(keyword))) {
        score += 3;
      }
      
      // Bonificar si es texto (contiene letras)
      if (/[a-záéíóúñ]/i.test(trimmed)) {
        score += 1;
      }
    }
    
    return score;
  });
  
  // Encontrar la fila con mayor score
  let maxScore = -Infinity;
  let headerIndex = 0;
  
  scores.forEach((score, index) => {
    if (score > maxScore) {
      maxScore = score;
      headerIndex = index;
    }
  });
  
  return headerIndex;
}

/**
 * Normaliza nombres para comparación fuzzy
 * @param name - Nombre a normalizar
 * @returns Nombre normalizado
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios → uno solo
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[.,\-_()]/g, ' ') // Puntuación → espacio
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula similitud entre dos strings usando distancia de Levenshtein
 * @param a - Primer string
 * @param b - Segundo string
 * @returns Valor entre 0 y 1 (1 = idénticos)
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;
  
  // Crear matriz
  for (let i = 0; i <= aLen; i++) {
    matrix[i] = [];
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }
  
  // Llenar matriz
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // eliminación
        );
      }
    }
  }
  
  const distance = matrix[aLen][bLen];
  const maxLen = Math.max(aLen, bLen);
  
  return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
}

/**
 * Busca el cliente más similar usando matching fuzzy
 * @param clienteName - Nombre del cliente a buscar
 * @param clientes - Lista de clientes disponibles
 * @param minSimilarity - Umbral mínimo de similitud (por defecto 0.6)
 * @returns Cliente encontrado o null
 */
export function findBestClientMatch(
  clienteName: string,
  clientes: Cliente[],
  minSimilarity: number = 0.6
): Cliente | null {
  if (!clienteName || !clientes.length) return null;
  
  const normalizedTarget = normalizeName(clienteName);
  let bestMatch: Cliente | null = null;
  let bestSimilarity = 0;
  
  for (const cliente of clientes) {
    const normalizedClient = normalizeName(cliente.nombre);
    
    // Búsqueda exacta primero
    if (normalizedClient === normalizedTarget) {
      return cliente;
    }
    
    // Búsqueda por contención
    if (normalizedClient.includes(normalizedTarget) || normalizedTarget.includes(normalizedClient)) {
      const similarity = Math.max(
        normalizedTarget.length / normalizedClient.length,
        normalizedClient.length / normalizedTarget.length
      );
      
      if (similarity > bestSimilarity && similarity >= minSimilarity) {
        bestSimilarity = similarity;
        bestMatch = cliente;
      }
      continue;
    }
    
    // Búsqueda por similitud de Levenshtein
    const similarity = calculateSimilarity(normalizedTarget, normalizedClient);
    
    if (similarity > bestSimilarity && similarity >= minSimilarity) {
      bestSimilarity = similarity;
      bestMatch = cliente;
    }
  }
  
  return bestMatch;
}

/**
 * Busca el vendedor más similar
 * @param vendedorName - Nombre del vendedor a buscar
 * @param vendedores - Lista de vendedores disponibles
 * @param minSimilarity - Umbral mínimo de similitud
 * @returns Vendedor encontrado o null
 */
export function findBestVendedorMatch(
  vendedorName: string,
  vendedores: Vendedor[],
  minSimilarity: number = 0.7
): Vendedor | null {
  if (!vendedorName || !vendedores.length) return null;
  
  const normalizedTarget = normalizeName(vendedorName);
  let bestMatch: Vendedor | null = null;
  let bestSimilarity = 0;
  
  for (const vendedor of vendedores) {
    const normalizedVendedor = normalizeName(vendedor.nombre);
    
    if (normalizedVendedor === normalizedTarget) {
      return vendedor;
    }
    
    const similarity = calculateSimilarity(normalizedTarget, normalizedVendedor);
    
    if (similarity > bestSimilarity && similarity >= minSimilarity) {
      bestSimilarity = similarity;
      bestMatch = vendedor;
    }
  }
  
  return bestMatch;
}

/**
 * Convierte formato YYYY-MM-DD a formato de entrada de date input
 * @param dateStr - Fecha en formato ISO o español
 * @returns Fecha en formato YYYY-MM-DD para input[type="date"]
 */
export function toDateInputFormat(dateStr: string): string {
  if (!dateStr) return '';
  
  // Si ya está en formato ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0]; // Remover tiempo si existe
  }
  
  // Intentar parsear fecha española
  const parsed = parseSpanishDate(dateStr);
  if (parsed) {
    return parsed.toISOString().split('T')[0];
  }
  
  return '';
}

/**
 * Valida que una fila de datos tenga los campos requeridos
 * @param row - Fila de datos mapeada
 * @returns Array de errores encontrados
 */
export function validateImportRow(row: Record<string, any>): string[] {
  const errors: string[] = [];
  
  // Campos obligatorios
  if (!row.cliente?.toString().trim()) {
    errors.push('Cliente es obligatorio');
  }
  
  if (!row.numeroPedidoCliente?.toString().trim()) {
    errors.push('Número de pedido del cliente es obligatorio');
  }
  
  if (!row.fechaEntrega) {
    errors.push('Fecha de entrega es obligatoria');
  } else {
    // Validar que sea una fecha válida (aceptar formato ISO o español)
    const dateStr = row.fechaEntrega.toString();
    
    // Si es formato ISO (YYYY-MM-DD), validar directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        errors.push('Fecha de entrega debe tener un formato válido');
      }
    } else {
      // Si no es ISO, intentar parsear como formato español
      const dateValidation = parseSpanishDate(dateStr);
      if (!dateValidation) {
        errors.push('Fecha de entrega debe tener un formato válido (ej: 30/may, 15/12/2026, o YYYY-MM-DD)');
      }
    }
  }
  
  const metros = Number(row.metros);
  if (!row.metros || isNaN(metros) || metros <= 0) {
    errors.push('Metros debe ser un número mayor a 0');
  }
  
  // Validaciones adicionales
  if (row.numeroPedidoCliente && row.numeroPedidoCliente.toString().length > 100) {
    errors.push('Número de pedido demasiado largo (máximo 100 caracteres)');
  }
  
  if (row.cliente && row.cliente.toString().length > 255) {
    errors.push('Nombre del cliente demasiado largo (máximo 255 caracteres)');
  }
  
  return errors;
}