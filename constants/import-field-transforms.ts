/**
 * Constantes compartidas para transformaciones de campos en importación masiva
 * Mantiene sincronizadas las reglas entre auto-detección y mapeo manual
 */

/**
 * Campos que deben transformarse como fechas (Date)
 */
export const DATE_FIELDS = [
  'fechaEntrega',
  'nuevaFechaEntrega',
  'compraCliche',
  'recepcionCliche',
  'fechaCreacion',
  'fechaFinalizacion'
] as const;

/**
 * Campos que deben transformarse como números (Number)
 */
export const NUMBER_FIELDS = [
  'metros',
  'velocidadPosible',
  'tiempoProduccionDecimal',
  'bobinaMadre',
  'bobinaFinal',
  'minAdap',
  'colores',
  'minColor',
  'micras1',
  'micras2',
  'micras3',
  'micras4',
  'densidad1',
  'densidad2',
  'densidad3',
  'densidad4',
  'necesario1',
  'necesario2',
  'necesario3',
  'necesario4'
] as const;

/**
 * Campos que deben convertirse a MAYÚSCULAS
 */
export const UPPERCASE_FIELDS = [
  'producto'
] as const;

/**
 * Tipo de transformación para un campo
 */
export type FieldTransform = 'date' | 'number' | 'text';

/**
 * Determina el tipo de transformación necesaria para un campo
 */
export function getFieldTransform(fieldName: string): FieldTransform {
  if (DATE_FIELDS.includes(fieldName as any)) {
    return 'date';
  }
  if (NUMBER_FIELDS.includes(fieldName as any)) {
    return 'number';
  }
  return 'text';
}

/**
 * Valida que un valor sea apropiado para el tipo de campo
 */
export function validateFieldValue(fieldName: string, value: any): { valid: boolean; error?: string } {
  const transform = getFieldTransform(fieldName);
  
  // Valores vacíos son permitidos
  if (value === null || value === undefined || value === '') {
    return { valid: true };
  }
  
  if (transform === 'date') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: `"${fieldName}" debe ser una fecha válida (recibido: "${value}")` };
    }
  }
  
  if (transform === 'number') {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: `"${fieldName}" debe ser un número válido (recibido: "${value}")` };
    }
  }
  
  return { valid: true };
}
