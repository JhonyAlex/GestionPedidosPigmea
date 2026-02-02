import React, { useState, useCallback, useMemo } from 'react';
import { 
  ImportRow, 
  ImportValidationError, 
  ColumnMapping, 
  ImportBatchRequest, 
  Pedido, 
  Prioridad, 
  TipoImpresion, 
  Etapa, 
  EstadoCliché 
} from '../types';
import {
  parseTSV,
  detectHeaders,
  parseSpanishDate,
  parseSpanishNumber,
  validateImportRow,
  findBestClientMatch,
  findBestVendedorMatch
} from '../utils/importUtils';
import { useClientesManager } from '../hooks/useClientesManager';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
import { Icons } from './Icons';
import { MAQUINAS_IMPRESION, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import {
  saveMappingConfig,
  getAllMappingConfigs,
  getMappingConfig,
  deleteMappingConfig,
  updateConfigUsage,
  findCompatibleConfig,
  applyConfigToHeaders,
  MappingConfig
} from '../utils/mappingConfigStorage';

// Función para obtener headers de autenticación
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('pigmea_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return {
        'x-user-id': String(user.id),
        'x-user-role': user.role || 'OPERATOR',
        'x-user-permissions': JSON.stringify(user.permissions || [])
      };
    }
  }
  return {};
};

// Iconos SVG
const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const LoadingSpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="animate-spin" {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

interface BulkImportModalV2Props {
  onClose: () => void;
  onImportComplete?: (result: any) => void;
}

// LISTA COMPLETA DE CAMPOS DISPONIBLES (todos los campos de la tabla pedidos)
const AVAILABLE_FIELDS = [
  { value: 'ignore', label: '-- Ignorar columna --', required: false },
  
  // Campos básicos obligatorios
  { value: 'numeroPedidoCliente', label: '🔢 Número de Pedido Cliente *', required: true },
  { value: 'cliente', label: '👤 Cliente *', required: true },
  { value: 'fechaEntrega', label: '📅 Fecha de Entrega *', required: true },
  { value: 'metros', label: '📏 Metros *', required: true },
  
  // Información de producción
  { value: 'producto', label: '📦 Producto' },
  { value: 'desarrollo', label: '🔬 Material/Desarrollo' },
  { value: 'capa', label: '📄 Capa' },
  { value: 'observaciones', label: '📝 Observaciones' },
  { value: 'observacionesRapidas', label: '⚡ Observaciones Rápidas' },
  { value: 'observacionesMaterial', label: '🧱 Observaciones Material' },
  
  // Máquinas y vendedores
  { value: 'maquinaImpresion', label: '🖨️ Máquina de Impresión' },
  { value: 'vendedorNombre', label: '💼 Vendedor' },
  
  // Fechas y plazos
  { value: 'fechaCreacion', label: '🕐 Fecha Creación' },
  { value: 'nuevaFechaEntrega', label: '📆 Nueva Fecha Entrega' },
  { value: 'compraCliche', label: '🛒 Fecha Compra Cliché' },
  { value: 'recepcionCliche', label: '📥 Fecha Recepción Cliché' },
  { value: 'fechaFinalizacion', label: '🏁 Fecha Finalización' },
  
  // Números y medidas
  { value: 'numerosCompra', label: '🧾 Números de Compra (separados por coma)' },
  { value: 'velocidadPosible', label: '⚡ Velocidad Posible (m/min)' },
  { value: 'tiempoProduccionDecimal', label: '⏱️ Tiempo Producción (decimal)' },
  
  // Bobinas y dimensiones
  { value: 'bobinaMadre', label: '🔵 Bobina Madre (mm)' },
  { value: 'bobinaFinal', label: '🟢 Bobina Final (mm)' },
  { value: 'camisa', label: '🎯 Camisa' },
  
  // Tiempos y colores
  { value: 'minAdap', label: '⏲️ Minutos Adaptación' },
  { value: 'colores', label: '🎨 Número de Colores' },
  { value: 'minColor', label: '⏰ Minutos por Color' },
  
  // Información de cliché
  { value: 'clicheInfoAdicional', label: 'ℹ️ Info Adicional Cliché' },
  
  // Campos de consumo de material
  { value: 'materialConsumoCantidad', label: '🔢 Cantidad Consumo Material (1-4)' },
  
  // Material 1
  { value: 'numeroCompra1', label: '🧾 N° Compra Material 1' },
  { value: 'micras1', label: '📏 Micras Material 1' },
  { value: 'densidad1', label: '⚖️ Densidad Material 1' },
  { value: 'necesario1', label: '✅ Necesario Material 1' },
  { value: 'recibido1', label: '📦 Recibido Material 1' },
  
  // Material 2
  { value: 'numeroCompra2', label: '🧾 N° Compra Material 2' },
  { value: 'micras2', label: '📏 Micras Material 2' },
  { value: 'densidad2', label: '⚖️ Densidad Material 2' },
  { value: 'necesario2', label: '✅ Necesario Material 2' },
  { value: 'recibido2', label: '📦 Recibido Material 2' },
  
  // Material 3
  { value: 'numeroCompra3', label: '🧾 N° Compra Material 3' },
  { value: 'micras3', label: '📏 Micras Material 3' },
  { value: 'densidad3', label: '⚖️ Densidad Material 3' },
  { value: 'necesario3', label: '✅ Necesario Material 3' },
  { value: 'recibido3', label: '📦 Recibido Material 3' },
  
  // Material 4
  { value: 'numeroCompra4', label: '🧾 N° Compra Material 4' },
  { value: 'micras4', label: '📏 Micras Material 4' },
  { value: 'densidad4', label: '⚖️ Densidad Material 4' },
  { value: 'necesario4', label: '✅ Necesario Material 4' },
  { value: 'recibido4', label: '📦 Recibido Material 4' },
];

// Valores por defecto para campos globales
const GLOBAL_FIELD_OPTIONS = {
  prioridad: Object.values(Prioridad),
  tipoImpresion: Object.values(TipoImpresion),
  etapaActual: Object.values(Etapa),
  estadoCliché: Object.values(EstadoCliché),
  subEtapaActual: Object.values(PREPARACION_SUB_ETAPAS_IDS)
};

export default function BulkImportModalV2({ onClose, onImportComplete }: BulkImportModalV2Props) {
  // Estados principales
  const [currentPhase, setCurrentPhase] = useState<'input' | 'mapping' | 'importing'>('input');
  const [pastedText, setPastedText] = useState('');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [hasHeaders, setHasHeaders] = useState(true); // ✅ NUEVO: Checkbox para indicar si hay encabezados
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [globalFields, setGlobalFields] = useState<Partial<Pedido>>({
    etapaActual: Etapa.PREPARACION,
    subEtapaActual: PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA,
    prioridad: Prioridad.NORMAL,
    tipoImpresion: TipoImpresion.SUPERFICIE
  });
  const [selectedRowsForGlobalFields, setSelectedRowsForGlobalFields] = useState<Set<number>>(new Set()); // ✅ NUEVO: Filas seleccionadas para aplicar valores globales
  
  // Estados de importación
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set()); // ✅ Filas excluidas de importación
  const [existingPedidoNumbers, setExistingPedidoNumbers] = useState<Set<string>>(new Set()); // ✅ Números de pedido existentes en BD
  const [isLoadingExistingNumbers, setIsLoadingExistingNumbers] = useState(false); // ✅ Estado de carga
  const [duplicateRows, setDuplicateRows] = useState<Set<number>>(new Set()); // ✅ Filas con números duplicados
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  // Hooks para datos
  const { clientes } = useClientesManager();
  const { vendedores } = useVendedoresManager();

  // Cargar números de pedido existentes para validación de duplicados
  const loadExistingPedidoNumbers = useCallback(async () => {
    setIsLoadingExistingNumbers(true);
    try {
      const response = await fetch('/api/pedidos/numeros-existentes', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar números de pedido existentes');
      }
      
      const data = await response.json();
      const numbersSet = new Set<string>(data.numeros.map((n: any) => n.normalized));
      setExistingPedidoNumbers(numbersSet);
      console.log(`📋 Cargados ${numbersSet.size} números de pedido para validación`);
    } catch (error) {
      console.error('❌ Error al cargar números existentes:', error);
      alert('No se pudieron cargar los pedidos existentes para validar duplicados. Intente nuevamente.');
    } finally {
      setIsLoadingExistingNumbers(false);
    }
  }, []);

  // Procesar datos pegados (Paso 1 -> 2)
  const handleProcessPastedData = useCallback(() => {
    if (!pastedText.trim()) {
      alert('Por favor, pegue los datos del Excel.');
      return;
    }

    const parsed = parseTSV(pastedText);
    if (parsed.length === 0) {
      alert('No se pudieron procesar los datos. Verifique el formato.');
      return;
    }

    if (parsed.length === 1) {
      alert('Se detectó solo una fila. Asegúrese de incluir tanto encabezados como datos.');
      return;
    }

    setRawData(parsed);
    
    // Detectar automáticamente la fila de encabezados
    const detectedHeader = detectHeaders(parsed);
    setSelectedHeaderRow(detectedHeader);
    
    setCurrentPhase('mapping');
  }, [pastedText]);

  // Configurar mapeos iniciales cuando se selecciona la fila de encabezados
  const setupInitialMappings = useCallback((headerRowIndex: number, withHeaders: boolean) => {
    if (!rawData.length) return;

    let headers: string[];
    
    if (!withHeaders) {
      // ✅ SIN ENCABEZADOS: Generar nombres de columnas genéricas (Columna A, B, C...)
      const firstRow = rawData[0] || [];
      headers = firstRow.map((_, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D...
        return `Columna ${letter}`;
      });
    } else {
      // CON ENCABEZADOS: Usar la fila seleccionada
      if (headerRowIndex >= rawData.length) return;
      headers = rawData[headerRowIndex] || [];
    }
    
    // 🔍 DETECCIÓN AUTOMÁTICA DE MULTI-MATERIALES
    // Buscar patrones repetidos de columnas de materiales
    const materialPatterns = {
      numeroCompra: /n[°o].*compra|compra/i,
      micras: /micra/i,
      densidad: /densidad/i,
      necesario: /necesario/i,
      recibido: /recibido/i
    };
    
    // Detectar cuántos sets de materiales hay
    const materialCounts = {
      numeroCompra: 0,
      micras: 0,
      densidad: 0,
      necesario: 0,
      recibido: 0
    };
    
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      Object.entries(materialPatterns).forEach(([key, pattern]) => {
        if (pattern.test(normalizedHeader)) {
          materialCounts[key as keyof typeof materialCounts]++;
        }
      });
    });
    
    // Determinar el número de materiales detectados (máximo común)
    const detectedMaterialCount = Math.max(...Object.values(materialCounts));
    let currentMaterialIndex = 1;
    const materialFieldsUsed = {
      numeroCompra: 0,
      micras: 0,
      densidad: 0,
      necesario: 0,
      recibido: 0
    };
    
    const initialMappings: ColumnMapping[] = headers.map((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Mapeo automático inteligente
      let dbField: keyof Pedido | 'ignore' | string = 'ignore';
      
      if (normalizedHeader.includes('pedido') || normalizedHeader.includes('nº') || normalizedHeader.includes('n°')) {
        dbField = 'numeroPedidoCliente';
      } else if (normalizedHeader.includes('cliente')) {
        dbField = 'cliente';
      } else if (normalizedHeader.includes('fecha') && normalizedHeader.includes('entrega')) {
        dbField = 'fechaEntrega';
      } else if (normalizedHeader.includes('fecha') && normalizedHeader.includes('creacion')) {
        dbField = 'fechaCreacion';
      } else if (normalizedHeader.includes('fecha') && normalizedHeader.includes('compra') && normalizedHeader.includes('cliche')) {
        dbField = 'compraCliche';
      } else if (normalizedHeader.includes('fecha') && normalizedHeader.includes('recepcion') && normalizedHeader.includes('cliche')) {
        dbField = 'recepcionCliche';
      } else if (normalizedHeader.includes('fecha') && normalizedHeader.includes('finalizacion')) {
        dbField = 'fechaFinalizacion';
      } else if (normalizedHeader.includes('metro') || normalizedHeader === 'c' || normalizedHeader === 'm') {
        dbField = 'metros';
      } else if (normalizedHeader.includes('producto')) {
        dbField = 'producto';
      } else if (normalizedHeader.includes('material') || normalizedHeader.includes('desarrollo')) {
        dbField = 'desarrollo';
      } else if (normalizedHeader.includes('observ')) {
        dbField = 'observaciones';
      } else if (normalizedHeader.includes('vendedor')) {
        dbField = 'vendedorNombre';
      } else if (normalizedHeader.includes('capa')) {
        dbField = 'capa';
      } else if (normalizedHeader.includes('máquina') || normalizedHeader.includes('maquina')) {
        dbField = 'maquinaImpresion';
      }
      // 🔍 DETECCIÓN DE CAMPOS DE MATERIALES
      else if (materialPatterns.numeroCompra.test(normalizedHeader) && detectedMaterialCount > 0) {
        materialFieldsUsed.numeroCompra++;
        dbField = `numeroCompra${materialFieldsUsed.numeroCompra}`;
      } else if (materialPatterns.micras.test(normalizedHeader) && detectedMaterialCount > 0) {
        materialFieldsUsed.micras++;
        dbField = `micras${materialFieldsUsed.micras}`;
      } else if (materialPatterns.densidad.test(normalizedHeader) && detectedMaterialCount > 0) {
        materialFieldsUsed.densidad++;
        dbField = `densidad${materialFieldsUsed.densidad}`;
      } else if (materialPatterns.necesario.test(normalizedHeader) && detectedMaterialCount > 0) {
        materialFieldsUsed.necesario++;
        dbField = `necesario${materialFieldsUsed.necesario}`;
      } else if (materialPatterns.recibido.test(normalizedHeader) && detectedMaterialCount > 0) {
        materialFieldsUsed.recibido++;
        dbField = `recibido${materialFieldsUsed.recibido}`;
      }
      
      return {
        excelColumn: header,
        dbField,
        transform: ['fechaEntrega', 'nuevaFechaEntrega', 'compraCliche', 'recepcionCliche', 'fechaCreacion', 'fechaFinalizacion'].includes(dbField as string) ? 'date' : 
                   ['metros', 'velocidadPosible', 'tiempoProduccionDecimal', 'bobinaMadre', 'bobinaFinal', 'minAdap', 'colores', 'minColor', 'micras1', 'micras2', 'micras3', 'micras4', 'densidad1', 'densidad2', 'densidad3', 'densidad4', 'necesario1', 'necesario2', 'necesario3', 'necesario4'].includes(dbField as string) ? 'number' : 
                   'text'
      };
    });
    
    setColumnMappings(initialMappings);
    
    // 🔔 Notificar al usuario si se detectaron materiales
    if (detectedMaterialCount > 0) {
      console.log(`✅ Se detectaron ${detectedMaterialCount} materiales automáticamente`);
    }
  }, [rawData]);

  // Actualizar mapeos cuando cambia la fila de encabezado seleccionada o el checkbox de encabezados
  React.useEffect(() => {
    if (currentPhase === 'mapping' && rawData.length > 0) {
      setupInitialMappings(hasHeaders ? selectedHeaderRow : 0, hasHeaders);
    }
  }, [currentPhase, rawData, selectedHeaderRow, hasHeaders, setupInitialMappings]);

  // Procesar datos para importación (Paso 2 -> 3)
  const processImportData = useCallback(async () => {
    if (!rawData.length) return;

    // ✅ Si NO tiene encabezados, todos los datos son filas a importar (desde la fila 0)
    // ✅ Si tiene encabezados, saltar la fila de encabezados
    const dataStartRow = hasHeaders ? selectedHeaderRow + 1 : 0;
    const dataRows = rawData.slice(dataStartRow);
    
    // Validar que haya datos para importar
    if (dataRows.length === 0) {
      alert('No hay datos para importar. Verifique que haya filas después de los encabezados.');
      return;
    }
    
    console.log(`📊 Procesando ${dataRows.length} filas de datos...`);
    
    // ✅ Headers pueden ser los reales o los genéricos (Columna A, B, C...)
    const headers = columnMappings.map(m => m.excelColumn);
    
    const processedRows: ImportRow[] = dataRows.map((row, index) => {
      const originalData: Record<string, string> = {};
      const mappedData: Partial<Pedido> = { ...globalFields };
      
      // Mapear datos según configuración
      headers.forEach((header, colIndex) => {
        const cellValue = row[colIndex] || '';
        originalData[header] = cellValue;
        
        const mapping = columnMappings.find(m => m.excelColumn === header);
        if (!mapping || mapping.dbField === 'ignore' || !cellValue.trim()) return;
        
        let processedValue: any = cellValue;
        
        // Aplicar transformaciones
        switch (mapping.transform) {
          case 'date':
            const parsedDate = parseSpanishDate(cellValue);
            if (parsedDate) {
              processedValue = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            } else {
              processedValue = null;
            }
            break;
            
          case 'number':
            const parsedNumber = parseSpanishNumber(cellValue);
            processedValue = parsedNumber !== null ? parsedNumber : cellValue;
            break;
            
          default:
            processedValue = cellValue.trim();
        }
        
        // Asignar al campo correspondiente
        if (mapping.dbField === 'vendedorNombre') {
          // Intentar encontrar vendedor
          const vendedor = findBestVendedorMatch(processedValue, vendedores);
          if (vendedor) {
            mappedData.vendedorId = vendedor.id;
            mappedData.vendedorNombre = vendedor.nombre;
          } else {
            mappedData.vendedorNombre = processedValue;
          }
        } else if (mapping.dbField === 'numerosCompra') {
          // Convertir string separado por comas en array
          const numeros = processedValue.split(',').map((n: string) => n.trim()).filter((n: string) => n);
          mappedData.numerosCompra = numeros;
        } else {
          (mappedData as any)[mapping.dbField] = processedValue;
        }
      });
      
      // Intentar encontrar cliente
      if (mappedData.cliente) {
        const cliente = findBestClientMatch(mappedData.cliente, clientes);
        if (cliente) {
          mappedData.clienteId = cliente.id;
          mappedData.cliente = cliente.nombre; // Normalizar nombre
        }
      }

      // 🔄 CONSOLIDAR DATOS DE MULTI-MATERIALES
      // Convertir campos individuales (numeroCompra1, micras1, etc.) en arrays estructurados
      const numerosCompraTemp: string[] = [];
      const materialConsumoTemp: Array<{
        necesario?: number | null;
        recibido?: boolean | null;
        gestionado?: boolean | null;
        micras?: number | null;
        densidad?: number | null;
      }> = [];
      
      for (let i = 1; i <= 4; i++) {
        const numeroCompraKey = `numeroCompra${i}` as any;
        const micrasKey = `micras${i}` as any;
        const densidadKey = `densidad${i}` as any;
        const necesarioKey = `necesario${i}` as any;
        const recibidoKey = `recibido${i}` as any;
        
        const numeroCompra = (mappedData as any)[numeroCompraKey];
        const micras = (mappedData as any)[micrasKey];
        const densidad = (mappedData as any)[densidadKey];
        const necesario = (mappedData as any)[necesarioKey];
        const recibido = (mappedData as any)[recibidoKey];
        
        // Si hay al menos un dato, agregar este material
        if (numeroCompra || micras || densidad || necesario !== undefined || recibido !== undefined) {
          if (numeroCompra) {
            numerosCompraTemp.push(String(numeroCompra).trim());
          }
          
          materialConsumoTemp.push({
            necesario: necesario !== undefined ? Number(necesario) : null,
            recibido: recibido !== undefined ? Boolean(recibido) : null,
            gestionado: null,
            micras: micras !== undefined && micras !== null ? Number(micras) : null,
            densidad: densidad !== undefined && densidad !== null ? Number(densidad) : null,
          });
          
          // Limpiar campos temporales
          delete (mappedData as any)[numeroCompraKey];
          delete (mappedData as any)[micrasKey];
          delete (mappedData as any)[densidadKey];
          delete (mappedData as any)[necesarioKey];
          delete (mappedData as any)[recibidoKey];
        }
      }
      
      // Asignar arrays consolidados
      if (numerosCompraTemp.length > 0) {
        mappedData.numerosCompra = numerosCompraTemp;
      }
      if (materialConsumoTemp.length > 0) {
        mappedData.materialConsumoCantidad = Math.min(materialConsumoTemp.length, 4) as 1 | 2 | 3 | 4;
        mappedData.materialConsumo = materialConsumoTemp;
      }

      // Asegurar que si la etapa es PREPARACION, tenga una subetapa asignada
      if (mappedData.etapaActual === Etapa.PREPARACION && !mappedData.subEtapaActual) {
        mappedData.subEtapaActual = PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
      }

      // Validar datos
      const validationErrors = validateImportRow(mappedData).map(error => ({
        field: 'general',
        message: error,
        severity: 'error' as const
      }));
      
      return {
        originalData,
        mappedData,
        validationErrors,
        rowIndex: index,
        status: validationErrors.length > 0 ? 'error' as const : 'pending' as const
      };
    });
    
    setImportRows(processedRows);
    
    // Cargar números existentes y validar duplicados
    await loadExistingPedidoNumbers();
    
    setCurrentPhase('importing');
  }, [rawData, hasHeaders, selectedHeaderRow, columnMappings, globalFields, clientes, vendedores, loadExistingPedidoNumbers]);

  // Detectar duplicados cuando cambien los datos o números existentes
  React.useEffect(() => {
    if (importRows.length === 0 || existingPedidoNumbers.size === 0) {
      setDuplicateRows(new Set());
      return;
    }

    const duplicates = new Set<number>();
    const seenInBatch = new Set<string>();

    importRows.forEach((row, index) => {
      const numeroPedido = row.mappedData.numeroPedidoCliente;
      if (!numeroPedido) return;

      const normalized = numeroPedido.toLowerCase().trim();

      // Verificar si existe en BD
      if (existingPedidoNumbers.has(normalized)) {
        duplicates.add(index);
        // Agregar error de validación
        const existingError = row.validationErrors.find(e => e.message.includes('ya existe'));
        if (!existingError) {
          row.validationErrors.push({
            field: 'numeroPedidoCliente',
            message: `⚠️ Ya existe un pedido con el número "${numeroPedido}" en la base de datos`,
            severity: 'error' as const
          });
        }
      }
      // Verificar si está duplicado dentro del mismo batch
      else if (seenInBatch.has(normalized)) {
        duplicates.add(index);
        const existingError = row.validationErrors.find(e => e.message.includes('duplicado'));
        if (!existingError) {
          row.validationErrors.push({
            field: 'numeroPedidoCliente',
            message: `⚠️ Número de pedido "${numeroPedido}" duplicado en este Excel`,
            severity: 'error' as const
          });
        }
      } else {
        seenInBatch.add(normalized);
      }
    });

    setDuplicateRows(duplicates);
    console.log(`🔍 Detectados ${duplicates.size} pedidos duplicados`);
  }, [importRows, existingPedidoNumbers]);

  // Ejecutar importación
  const executeImport = useCallback(async () => {
    if (isImporting) return;
    
    // Validación previa
    const validRows = importRows.filter((row, index) => 
      row.validationErrors.length === 0 && !excludedRows.has(index)
    );
    
    if (validRows.length === 0) {
      alert('No hay pedidos válidos para importar. Verifique los errores y vuelva a intentar.');
      return;
    }
    
    // Confirmar importación
    const confirmMsg = `¿Está seguro de importar ${validRows.length} pedido${validRows.length === 1 ? '' : 's'}?\n\n` +
      `✅ Válidos: ${validRows.length}\n` +
      `${excludedRows.size > 0 ? `🚫 Excluidos: ${excludedRows.size}\n` : ''}` +
      `${importRows.length - validRows.length - excludedRows.size > 0 ? `❌ Con errores: ${importRows.length - validRows.length - excludedRows.size}` : ''}`;
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    console.log(`🚀 Iniciando importación de ${validRows.length} pedidos...`);
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const batchSize = 50; // Procesar en lotes de 50 para no saturar
      let processedCount = 0;
      const results = [];
      const startTime = Date.now();
      
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(validRows.length / batchSize);
        
        console.log(`📦 Procesando lote ${batchNumber}/${totalBatches} (${batch.length} pedidos)...`);
        
        const batchRequest: ImportBatchRequest = {
          rows: batch,
          globalFields
        };
        
        const response = await fetch('/api/pedidos/import-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(batchRequest)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error en lote ${batchNumber}:`, errorText);
          throw new Error(`Error en lote ${batchNumber}: ${errorText}`);
        }
        
        const result = await response.json();
        results.push(result);
        
        processedCount += batch.length;
        const progress = (processedCount / validRows.length) * 100;
        setImportProgress(progress);
        
        console.log(`✅ Lote ${batchNumber}/${totalBatches} completado. Progreso: ${progress.toFixed(1)}%`);
        
        // Pequeña pausa entre lotes para no saturar el servidor
        if (i + batchSize < validRows.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      
      // Consolidar resultados
      const totalImported = results.reduce((sum, r) => sum + (r.result?.successCount || 0), 0);
      const totalErrors = results.reduce((sum, r) => sum + (r.result?.errorCount || 0), 0);
      
      console.log(`✅ Importación completada en ${duration}s`);
      console.log(`   📊 Importados: ${totalImported}`);
      console.log(`   ❌ Errores: ${totalErrors}`);
      
      setImportResults({
        ...results[0],
        totalImported,
        totalErrors,
        duration
      });
      onImportComplete?.(results);
      
    } catch (error) {
      console.error('❌ Error durante la importación:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error durante la importación:\n\n${errorMsg}\n\nRevise la consola para más detalles.`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [importRows, excludedRows, globalFields, isImporting, onImportComplete]);

  // Editar valor de celda individual
  const handleCellEdit = useCallback((rowIndex: number, field: string, value: any) => {
    setImportRows(prev => prev.map((row, index) => {
      if (index === rowIndex) {
        // Actualizar el campo editado
        const updatedMappedData = { ...row.mappedData, [field]: value };
        
        // Revalidar con los datos actualizados
        const validationErrors = validateImportRow(updatedMappedData).map(error => ({
          field: 'general',
          message: error,
          severity: 'error' as const
        }));
        
        console.log(`✏️ Campo editado: ${field} = ${value}, Errores: ${validationErrors.length}`);
        
        return {
          ...row,
          mappedData: updatedMappedData,
          validationErrors,
          status: validationErrors.length > 0 ? 'error' as const : 'pending' as const
        };
      }
      return row;
    }));
  }, []);

  // Copiar valores de un pedido a otros seleccionados
  const handleCopyToSelected = useCallback((sourceRowIndex: number, selectedIndices: number[]) => {
    const sourceData = importRows[sourceRowIndex]?.mappedData;
    if (!sourceData) return;

    setImportRows(prev => prev.map((row, index) => {
      if (selectedIndices.includes(index) && index !== sourceRowIndex) {
        const updatedMappedData = { ...row.mappedData, ...sourceData };
        const validationErrors = validateImportRow(updatedMappedData).map(error => ({
          field: 'general',
          message: error,
          severity: 'error' as const
        }));
        
        return {
          ...row,
          mappedData: updatedMappedData,
          validationErrors,
          status: validationErrors.length > 0 ? 'error' as const : 'pending' as const
        };
      }
      return row;
    }));
  }, [importRows]);

  // Eliminar una fila completamente del array de importación
  const handleDeleteRow = useCallback((rowIndex: number) => {
    setImportRows(prev => {
      const newRows = prev.filter((_, index) => index !== rowIndex);
      console.log(`🗑️ Fila ${rowIndex} eliminada. Filas restantes: ${newRows.length}`);
      return newRows;
    });

    // Actualizar excludedRows ajustando índices
    setExcludedRows(prev => {
      const newExcluded = new Set<number>();
      prev.forEach(idx => {
        if (idx < rowIndex) {
          newExcluded.add(idx); // Mantener índices anteriores
        } else if (idx > rowIndex) {
          newExcluded.add(idx - 1); // Ajustar índices posteriores
        }
        // Si idx === rowIndex, no se agrega (se elimina)
      });
      return newExcluded;
    });

    // Actualizar duplicateRows ajustando índices
    setDuplicateRows(prev => {
      const newDuplicates = new Set<number>();
      prev.forEach(idx => {
        if (idx < rowIndex) {
          newDuplicates.add(idx);
        } else if (idx > rowIndex) {
          newDuplicates.add(idx - 1);
        }
      });
      return newDuplicates;
    });
  }, []);

  // Estadísticas de validación
  const validationStats = useMemo(() => {
    const total = importRows.length;
    const valid = importRows.filter(row => row.validationErrors.length === 0).length;
    const errors = total - valid;
    return { total, valid, errors };
  }, [importRows]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold">📊 Importación Masiva de Pedidos</h2>
            <p className="text-blue-100 text-sm mt-1">
              {currentPhase === 'input' && '📋 Paso 1 de 3: Pegar datos del Excel'}
              {currentPhase === 'mapping' && '🔗 Paso 2 de 3: Mapear columnas y configurar'}
              {currentPhase === 'importing' && '✅ Paso 3 de 3: Revisar e importar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
            disabled={isImporting}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    currentPhase === 'input' ? 33 :
                    currentPhase === 'mapping' ? 66 :
                    isImporting ? 66 + (importProgress * 0.34) : 100
                  }%`
                }}
              />
            </div>
            {isImporting && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-16">
                {Math.round(importProgress)}%
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {currentPhase === 'input' && (
            <InputPhaseV2
              pastedText={pastedText}
              setPastedText={setPastedText}
              onNext={handleProcessPastedData}
              rawData={rawData}
              selectedHeaderRow={selectedHeaderRow}
              setSelectedHeaderRow={setSelectedHeaderRow}
              hasHeaders={hasHeaders}
              setHasHeaders={setHasHeaders}
            />
          )}

          {currentPhase === 'mapping' && (
            <MappingPhaseV2
              rawData={rawData}
              hasHeaders={hasHeaders}
              selectedHeaderRow={selectedHeaderRow}
              setSelectedHeaderRow={setSelectedHeaderRow}
              columnMappings={columnMappings}
              setColumnMappings={setColumnMappings}
              globalFields={globalFields}
              setGlobalFields={setGlobalFields}
              clientes={clientes}
              vendedores={vendedores}
              onNext={processImportData}
              onBack={() => setCurrentPhase('input')}
            />
          )}

          {currentPhase === 'importing' && (
            <ImportingPhaseV2
              importRows={importRows}
              validationStats={validationStats}
              onCellEdit={handleCellEdit}
              onCopyToSelected={handleCopyToSelected}
              onDeleteRow={handleDeleteRow}
              onImport={executeImport}
              onBack={() => setCurrentPhase('mapping')}
              isImporting={isImporting}
              importProgress={importProgress}
              importResults={importResults}
              globalFields={globalFields}
              setGlobalFields={setGlobalFields}
              clientes={clientes}
              vendedores={vendedores}
              excludedRows={excludedRows}
              setExcludedRows={setExcludedRows}
              duplicateRows={duplicateRows}
              isLoadingExistingNumbers={isLoadingExistingNumbers}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ======================== FASE 1: INGESTA CON SELECCIÓN DE ENCABEZADOS ========================
interface InputPhaseV2Props {
  pastedText: string;
  setPastedText: (text: string) => void;
  onNext: () => void;
  rawData: string[][];
  selectedHeaderRow: number;
  setSelectedHeaderRow: (row: number) => void;
  hasHeaders: boolean;
  setHasHeaders: (has: boolean) => void;
}

function InputPhaseV2({ pastedText, setPastedText, onNext, rawData, selectedHeaderRow, setSelectedHeaderRow, hasHeaders, setHasHeaders }: InputPhaseV2Props) {
  const [showPreview, setShowPreview] = useState(false);

  // Analizar los datos cuando el usuario pega
  const handlePaste = (text: string) => {
    setPastedText(text);
    if (text.trim()) {
      setShowPreview(true);
    }
  };

  const previewLines = useMemo(() => {
    if (!pastedText.trim()) return [];
    return parseTSV(pastedText).slice(0, 5);
  }, [pastedText]);

  return (
    <div className="p-6 h-full flex flex-col overflow-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">📋 Pegar datos del Excel</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Copie las celdas de Excel (incluidos encabezados) y péguelas aquí. El sistema detectará el formato automáticamente.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Guía Rápida:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Seleccione las celdas en Excel y use Ctrl+C para copiar</li>
            <li>• Incluya la fila de encabezados (ej: Cliente, Fecha, Metros...)</li>
            <li>• Formatos aceptados: fechas como "02/abr", "30/may", números como "10.000" o "0,914"</li>
            <li>• Si tiene múltiples filas de encabezados, seleccione cuál usar en la vista previa</li>
            <li>• Si NO tiene encabezados, marque el checkbox abajo y mapee por Columna A, B, C...</li>
          </ul>
        </div>

        {/* ✅ NUEVO: Checkbox para indicar si NO hay encabezados */}
        <div className="mb-4 flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <input
            type="checkbox"
            id="noHeaders"
            checked={!hasHeaders}
            onChange={(e) => setHasHeaders(!e.target.checked)}
            className="w-4 h-4 text-yellow-600"
          />
          <label htmlFor="noHeaders" className="text-sm font-medium text-yellow-800 dark:text-yellow-200 cursor-pointer">
            ⚠️ Los datos NO tienen encabezados (mapear por Columna A, B, C...)
          </label>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Datos del Excel:
        </label>
        <textarea
          value={pastedText}
          onChange={(e) => handlePaste(e.target.value)}
          placeholder="Pegue aquí los datos copiados del Excel (Ctrl+V)..."
          className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[200px]"
        />
        
        {showPreview && previewLines.length > 0 && hasHeaders && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              👀 Vista Previa ({previewLines.length} primeras filas de {previewLines.length} detectadas)
            </h4>
            
            <div className="space-y-2">
              {previewLines.map((line, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedHeaderRow(index)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                    ${selectedHeaderRow === index 
                      ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 border-2 border-blue-500' 
                      : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                    }
                  `}
                >
                  <input
                    type="radio"
                    checked={selectedHeaderRow === index}
                    onChange={() => setSelectedHeaderRow(index)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fila {index + 1}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                      {line.slice(0, 5).join(' | ')}
                      {line.length > 5 && <span className="text-gray-400">...</span>}
                    </div>
                  </div>
                  {selectedHeaderRow === index && (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      ← Encabezados
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showPreview && previewLines.length > 0 && !hasHeaders && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
              📊 Modo Sin Encabezados Activado
            </h4>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
              Todas las filas se importarán como datos. Podrá mapear cada columna manualmente como "Columna A", "Columna B", etc.
            </p>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
              {previewLines.length} filas de datos detectadas • {previewLines[0]?.length || 0} columnas
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!pastedText.trim() || (hasHeaders && previewLines.length < 2)}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors font-medium shadow-lg"
        >
          Continuar al Mapeo <ArrowRightIcon className="w-5 h-5 inline ml-2" />
        </button>
      </div>
    </div>
  );
}

// ======================== FASE 2: MAPEO MEJORADO CON PANEL LATERAL ========================
interface MappingPhaseV2Props {
  rawData: string[][];
  hasHeaders: boolean;
  selectedHeaderRow: number;
  setSelectedHeaderRow: (row: number) => void;
  columnMappings: ColumnMapping[];
  setColumnMappings: (mappings: ColumnMapping[]) => void;
  globalFields: Partial<Pedido>;
  setGlobalFields: (fields: Partial<Pedido>) => void;
  clientes: any[];
  vendedores: any[];
  onNext: () => void;
  onBack: () => void;
}

function MappingPhaseV2({
  rawData,
  hasHeaders,
  selectedHeaderRow,
  setSelectedHeaderRow,
  columnMappings,
  setColumnMappings,
  globalFields,
  setGlobalFields,
  clientes,
  vendedores,
  onNext,
  onBack
}: MappingPhaseV2Props) {
  const [savedConfigs, setSavedConfigs] = useState<MappingConfig[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');

  // Cargar configuraciones guardadas al montar
  React.useEffect(() => {
    loadSavedConfigs();
  }, []);

  const loadSavedConfigs = async () => {
    try {
      const configs = await getAllMappingConfigs();
      setSavedConfigs(configs);
      console.log(`📂 ${configs.length} configuraciones cargadas`);
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!configName.trim()) {
      alert('Por favor ingrese un nombre para la configuración');
      return;
    }

    try {
      const headers = columnMappings.map(m => m.excelColumn);
      await saveMappingConfig({
        name: configName.trim(),
        description: configDescription.trim() || undefined,
        headers,
        mappings: columnMappings
      });

      alert(`✅ Configuración "${configName}" guardada exitosamente`);
      setConfigName('');
      setConfigDescription('');
      setShowSaveDialog(false);
      await loadSavedConfigs();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    }
  };

  const handleLoadConfig = async (config: MappingConfig) => {
    try {
      const headers = columnMappings.map(m => m.excelColumn);
      const newMappings = applyConfigToHeaders(config, headers);
      setColumnMappings(newMappings);
      await updateConfigUsage(config.id);
      setShowLoadDialog(false);
      alert(`✅ Configuración "${config.name}" aplicada`);
      await loadSavedConfigs();
    } catch (error) {
      console.error('Error aplicando configuración:', error);
      alert('Error al aplicar la configuración');
    }
  };

  const handleDeleteConfig = async (config: MappingConfig) => {
    if (!confirm(`¿Eliminar la configuración "${config.name}"?`)) return;

    try {
      await deleteMappingConfig(config.id);
      alert(`🗑️ Configuración eliminada`);
      await loadSavedConfigs();
    } catch (error) {
      console.error('Error eliminando configuración:', error);
      alert('Error al eliminar la configuración');
    }
  };

  const handleMappingChange = (columnIndex: number, newDbField: keyof Pedido | 'ignore') => {
    const newMappings: ColumnMapping[] = [...columnMappings];
    if (newMappings[columnIndex]) {
      newMappings[columnIndex] = {
        ...newMappings[columnIndex],
        dbField: newDbField,
        transform: ['fechaEntrega', 'nuevaFechaEntrega', 'compraCliche', 'recepcionCliche'].includes(newDbField as string) ? 'date' : 
                   ['metros', 'velocidadPosible', 'tiempoProduccionDecimal', 'bobinaMadre', 'bobinaFinal', 'minAdap', 'colores', 'minColor'].includes(newDbField as string) ? 'number' : 
                   'text'
      };
    }
    setColumnMappings(newMappings);
  };

  const headers = columnMappings.map(m => m.excelColumn);
  const dataStartRow = hasHeaders ? selectedHeaderRow + 1 : 0;
  const previewRows = rawData.slice(dataStartRow, dataStartRow + 3); // Mostrar 3 filas

  return (
    <>
    <div className="h-full flex">
      {/* Área principal: Grid de Datos (65%) */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">🔗 Mapear Columnas del Excel</h3>
            
            {/* Botones de Guardar/Cargar configuración */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowLoadDialog(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow"
                title="Cargar configuración guardada"
              >
                📂 Cargar ({savedConfigs.length})
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow"
                title="Guardar configuración actual"
              >
                💾 Guardar Mapeo
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Seleccione qué campo de base de datos corresponde a cada columna. Los campos con * son obligatorios.
          </p>
        </div>

        {/* Tabla de mapeo con scroll horizontal */}
        <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg shadow-inner bg-white dark:bg-gray-800">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 sticky top-0 z-10 shadow">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="px-4 py-3 text-left min-w-[200px] border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={header}>
                        📄 {header}
                      </div>
                      <select
                        value={columnMappings[index]?.dbField || 'ignore'}
                        onChange={(e) => handleMappingChange(index, e.target.value as any)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      >
                        {AVAILABLE_FIELDS.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-10">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700 last:border-r-0">
                      <div className="max-w-[180px] truncate" title={cell}>
                        {cell || <span className="text-gray-400 italic">vacío</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          📊 Vista previa de {previewRows.length} filas • Total: {rawData.length - dataStartRow} pedidos
        </div>
      </div>

      {/* Panel lateral: Valores Globales COMPLETO (35%) */}
      <div className="w-[450px] bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 border-l border-gray-300 dark:border-gray-600 p-5 overflow-y-auto flex flex-col">
        <div className="mb-4 sticky top-0 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 pb-3 z-10">
          <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">⚙️ Valores Globales</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Estos valores se aplican a <strong>todos</strong> los pedidos. Si una columna del Excel tiene datos, ese valor tiene prioridad.
          </p>
        </div>
        
        <div className="space-y-4 flex-1">
          {/* Etapa y Prioridad */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">📍 Etapa Inicial:</label>
            <select
              value={globalFields.etapaActual || Etapa.PREPARACION}
              onChange={(e) => setGlobalFields({ ...globalFields, etapaActual: e.target.value as Etapa })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {GLOBAL_FIELD_OPTIONS.etapaActual.map(etapa => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">⚡ Prioridad:</label>
            <select
              value={globalFields.prioridad || Prioridad.NORMAL}
              onChange={(e) => setGlobalFields({ ...globalFields, prioridad: e.target.value as Prioridad })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {GLOBAL_FIELD_OPTIONS.prioridad.map(prioridad => (
                <option key={prioridad} value={prioridad}>{prioridad}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🖨️ Tipo de Impresión:</label>
            <select
              value={globalFields.tipoImpresion || TipoImpresion.SUPERFICIE}
              onChange={(e) => setGlobalFields({ ...globalFields, tipoImpresion: e.target.value as TipoImpresion })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {GLOBAL_FIELD_OPTIONS.tipoImpresion.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* ✅ Máquina con SELECT */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🏭 Máquina de Impresión:</label>
            <select
              value={globalFields.maquinaImpresion || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, maquinaImpresion: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar --</option>
              {MAQUINAS_IMPRESION.map(maq => (
                <option key={maq.id} value={maq.id}>{maq.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado Cliché */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🎨 Estado Cliché:</label>
            <select
              value={globalFields.estadoCliché || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, estadoCliché: e.target.value as EstadoCliché })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar --</option>
              {GLOBAL_FIELD_OPTIONS.estadoCliché.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          {/* Cliente con SELECT */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">👤 Cliente (opcional):</label>
            <select
              value={globalFields.clienteId || ''}
              onChange={(e) => {
                const cliente = clientes.find(c => c.id === e.target.value);
                setGlobalFields({ 
                  ...globalFields, 
                  clienteId: e.target.value,
                  cliente: cliente?.nombre || ''
                });
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar --</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </select>
          </div>

          {/* Vendedor con SELECT */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">💼 Vendedor (opcional):</label>
            <select
              value={globalFields.vendedorId || ''}
              onChange={(e) => {
                const vendedor = vendedores.find(v => v.id === e.target.value);
                setGlobalFields({ 
                  ...globalFields, 
                  vendedorId: e.target.value,
                  vendedorNombre: vendedor?.nombre || ''
                });
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar --</option>
              {vendedores.map(vendedor => (
                <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
              ))}
            </select>
          </div>

          {/* Producto */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">📦 Producto:</label>
            <input
              type="text"
              value={globalFields.producto || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, producto: e.target.value })}
              placeholder="Nombre del producto..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Material/Desarrollo */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🔬 Material/Desarrollo:</label>
            <input
              type="text"
              value={globalFields.desarrollo || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, desarrollo: e.target.value })}
              placeholder="Ej: PE, PP, PET..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Capa */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">📄 Capa:</label>
            <input
              type="text"
              value={globalFields.capa || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, capa: e.target.value })}
              placeholder="Información de capa..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">📝 Observaciones:</label>
            <textarea
              value={globalFields.observaciones || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, observaciones: e.target.value })}
              placeholder="Observaciones generales..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Observaciones Rápidas */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">⚡ Observaciones Rápidas:</label>
            <input
              type="text"
              value={globalFields.observacionesRapidas || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, observacionesRapidas: e.target.value })}
              placeholder="Tags separados por |"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bobinas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🔵 Bobina Madre:</label>
              <input
                type="number"
                value={globalFields.bobinaMadre || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, bobinaMadre: Number(e.target.value) })}
                placeholder="mm"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🟢 Bobina Final:</label>
              <input
                type="number"
                value={globalFields.bobinaFinal || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, bobinaFinal: Number(e.target.value) })}
                placeholder="mm"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Velocidad y Tiempo */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">⚡ Velocidad (m/min):</label>
              <input
                type="number"
                value={globalFields.velocidadPosible || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, velocidadPosible: Number(e.target.value) })}
                placeholder="m/min"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">⏱️ Tiempo (decimal):</label>
              <input
                type="number"
                step="0.1"
                value={globalFields.tiempoProduccionDecimal || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, tiempoProduccionDecimal: Number(e.target.value) })}
                placeholder="Ej: 1.5"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Colores */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🎨 Nº Colores:</label>
              <input
                type="number"
                value={globalFields.colores || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, colores: Number(e.target.value) })}
                placeholder="1-8"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">⏰ Min/Color:</label>
              <input
                type="number"
                value={globalFields.minColor || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, minColor: Number(e.target.value) })}
                placeholder="minutos"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Camisa */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">🎯 Camisa:</label>
            <input
              type="text"
              value={globalFields.camisa || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, camisa: e.target.value })}
              placeholder="Información de camisa..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.antivaho || false}
                onChange={(e) => setGlobalFields({ ...globalFields, antivaho: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">💨 Antivaho</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.microperforado || false}
                onChange={(e) => setGlobalFields({ ...globalFields, microperforado: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">🔘 Microperforado</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.macroperforado || false}
                onChange={(e) => setGlobalFields({ ...globalFields, macroperforado: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">⚫ Macroperforado</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.anonimo || false}
                onChange={(e) => setGlobalFields({ ...globalFields, anonimo: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">👻 Anónimo</span>
            </label>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-300 dark:border-gray-600 flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-xs font-medium shadow"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 inline mr-1" /> Volver
          </button>
          <button
            onClick={onNext}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg transition-all text-xs font-medium shadow-lg"
          >
            Revisar <ArrowRightIcon className="w-3.5 h-3.5 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
    
    {/* Modal: Guardar Configuración */}
    {showSaveDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">💾 Guardar Configuración de Mapeo</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Nombre de la configuración: *
              </label>
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Ej: Pedidos Cliente ABC, Importación Mensual..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Descripción (opcional):
              </label>
              <textarea
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                placeholder="Describe cuándo usar esta configuración..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                rows={2}
              />
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-3 rounded">
              <strong>💡 Tip:</strong> Se guardarán {columnMappings.length} columnas mapeadas. Podrás reutilizar esta configuración en futuras importaciones.
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={!configName.trim()}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
            >
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* Modal: Cargar Configuración */}
    {showLoadDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLoadDialog(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">📂 Cargar Configuración Guardada</h3>
          
          {savedConfigs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-5xl mb-4">📭</div>
              <p>No hay configuraciones guardadas aún.</p>
              <p className="text-sm mt-2">Guarda tu primer mapeo para reutilizarlo después.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {savedConfigs.map((config) => (
                <div
                  key={config.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        {config.name}
                      </h4>
                      {config.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {config.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>📊 {config.headers.length} columnas</span>
                        <span>🔗 {config.mappings.filter(m => m.dbField !== 'ignore').length} mapeadas</span>
                        {config.useCount > 0 && <span>✨ Usada {config.useCount} {config.useCount === 1 ? 'vez' : 'veces'}</span>}
                        <span>📅 {new Date(config.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleLoadConfig(config)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        title="Aplicar esta configuración"
                      >
                        ✅ Aplicar
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        title="Eliminar configuración"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowLoadDialog(false)}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ======================== FASE 3: REVISIÓN E IMPORTACIÓN CON EDICIÓN INDIVIDUAL ========================
interface ImportingPhaseV2Props {
  importRows: ImportRow[];
  validationStats: { total: number; valid: number; errors: number };
  onCellEdit: (rowIndex: number, field: string, value: any) => void;
  onCopyToSelected: (sourceIndex: number, targetIndices: number[]) => void;
  onDeleteRow: (rowIndex: number) => void;
  onImport: () => void;
  onBack: () => void;
  isImporting: boolean;
  importProgress: number;
  importResults: any;
  globalFields: Partial<Pedido>;
  setGlobalFields: (fields: Partial<Pedido>) => void;
  clientes: any[];
  vendedores: any[];
  excludedRows: Set<number>;
  setExcludedRows: (rows: Set<number>) => void;
  duplicateRows: Set<number>;
  isLoadingExistingNumbers: boolean;
}

function ImportingPhaseV2({
  importRows,
  validationStats,
  onCellEdit,
  onCopyToSelected,
  onDeleteRow,
  onImport,
  onBack,
  isImporting,
  importProgress,
  importResults,
  globalFields,
  setGlobalFields,
  clientes,
  vendedores,
  excludedRows,
  setExcludedRows,
  duplicateRows,
  isLoadingExistingNumbers
}: ImportingPhaseV2Props) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);

  const toggleRowSelection = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const toggleRowExclusion = (rowIndex: number) => {
    const newExclusion = new Set(excludedRows);
    if (newExclusion.has(rowIndex)) {
      newExclusion.delete(rowIndex);
    } else {
      newExclusion.add(rowIndex);
    }
    setExcludedRows(newExclusion);
  };

  const handleCopyFromRow = (sourceRow: number) => {
    if (selectedRows.size === 0) {
      alert('Seleccione al menos una fila destino para copiar.');
      return;
    }
    onCopyToSelected(sourceRow, Array.from(selectedRows));
    setSelectedRows(new Set());
  };

  // ✅ Aplicar valores globales solo a filas seleccionadas
  const applyGlobalToSelected = () => {
    if (selectedRows.size === 0) {
      alert('Seleccione al menos una fila para aplicar los valores globales.');
      return;
    }

    selectedRows.forEach(rowIndex => {
      // Aplicar todos los campos globales que tengan valor
      Object.entries(globalFields).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          onCellEdit(rowIndex, field, value);
        }
      });
    });

    setSelectedRows(new Set());
    alert(`Valores globales aplicados a ${selectedRows.size} filas.`);
  };

  const activeRows = importRows.filter((_, index) => !excludedRows.has(index));
  const activeValidCount = activeRows.filter(row => row.validationErrors.length === 0).length;

  if (importResults) {
    const stats = importResults.result || importResults;
    const totalImported = importResults.totalImported || stats.successCount || 0;
    const duration = importResults.duration || 0;
    
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
          <div className="text-7xl mb-4 animate-bounce">✅</div>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3">¡Importación Completada!</h3>
          
          {/* Estadísticas detalladas */}
          <div className="grid grid-cols-2 gap-4 my-6 text-left">
            <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pedidos Importados</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalImported}</div>
            </div>
            
            {stats.errorCount > 0 && (
              <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Con Errores</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.errorCount}</div>
              </div>
            )}
            
            {stats.createdClients > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes Nuevos</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.createdClients}</div>
              </div>
            )}
            
            {stats.createdVendors > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vendedores Nuevos</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.createdVendors}</div>
              </div>
            )}
          </div>
          
          {duration > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Tiempo de procesamiento: {duration}s
            </p>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg transition-all font-medium shadow-lg"
          >
            🎉 Ver Pedidos Importados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Tabla principal de revisión (65%) - EXPANDIDA */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">✅ Revisar Datos Antes de Importar</h3>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">
              ✅ {activeValidCount} filas válidas (de {activeRows.length} activas)
            </span>
            {validationStats.errors > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                ❌ {validationStats.errors} con errores
              </span>
            )}
            {duplicateRows.size > 0 && (
              <span className="text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 px-2 py-1 rounded">
                ⚠️ {duplicateRows.size} duplicado{duplicateRows.size === 1 ? '' : 's'}
              </span>
            )}
            {excludedRows.size > 0 && (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                🚫 {excludedRows.size} excluidas
              </span>
            )}
            {selectedRows.size > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                📋 {selectedRows.size} seleccionadas
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Clic en celda para editar • Clic en borde de fila para seleccionar • Checkbox rojo para excluir
            {duplicateRows.size > 0 && (
              <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
                ⚠️ No se pueden importar pedidos con números duplicados
              </span>
            )}
          </p>
        </div>

        {/* Tabla scrolleable EXPANDIDA - TODOS LOS CAMPOS */}
        <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg shadow-inner bg-white dark:bg-gray-800">
          <table className="min-w-full text-xs">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 sticky top-0 z-10 shadow">
              <tr>
                {/* Controles */}
                <th className="px-2 py-2 text-center w-8 sticky left-0 bg-gray-200 dark:bg-gray-700 z-20">
                  <input
                    type="checkbox"
                    title="Seleccionar todas"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(importRows.map((_, i) => i).filter(i => !excludedRows.has(i))));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-2 py-2 text-center w-8 sticky left-8 bg-gray-200 dark:bg-gray-700 z-20" title="Incluir/Excluir pedido">🚫</th>
                <th className="px-2 py-2 text-center w-8 sticky left-16 bg-gray-200 dark:bg-gray-700 z-20">✓</th>
                
                {/* Campos OBLIGATORIOS */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px] bg-red-50 dark:bg-red-900 dark:bg-opacity-20" title="OBLIGATORIO">N° Pedido*</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[130px] bg-red-50 dark:bg-red-900 dark:bg-opacity-20" title="OBLIGATORIO">Cliente*</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px] bg-red-50 dark:bg-red-900 dark:bg-opacity-20" title="OBLIGATORIO">F. Entrega*</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px] bg-red-50 dark:bg-red-900 dark:bg-opacity-20" title="OBLIGATORIO">Metros*</th>
                
                {/* Campos importantes de producción */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Producto</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[100px]">Desarrollo</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px]">Capa</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Máquina</th>
                
                {/* Workflow */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Etapa</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[140px]" title="Solo para PREPARACIÓN">Subetapa Prep.</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px]">Prioridad</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[130px]">Tipo Impresión</th>
                
                {/* Personas */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Vendedor</th>
                
                {/* Fechas adicionales */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">F. Creación</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Nueva F. Entrega</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">F. Compra Cliché</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">F. Recep. Cliché</th>
                
                {/* Información de cliché */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Estado Cliché</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[150px]">Info Cliché</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px]">Camisa</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Material Disp.</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Cliché Disp.</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Horas Confirm.</th>
                
                {/* Medidas y tiempos */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[100px]">Velocidad (m/min)</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Tiempo Prod. (h)</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[100px]">Bobina Madre</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[100px]">Bobina Final</th>
                
                {/* Colores */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[80px]">N° Colores</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px]">Min/Color</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px]">Min Adap.</th>
                
                {/* Números de compra */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[130px]">Nºs Compra</th>
                
                {/* Observaciones */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[180px]">Observaciones</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[150px]">Obs. Rápidas</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[150px]">Obs. Material</th>
                
                {/* Checkboxes */}
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px]">Antivaho</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Antivaho Real.</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Microperf.</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">Macroperf.</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[90px]">Anónimo</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[130px]">Post-Impresión Anon.</th>
                <th className="px-3 py-2 text-left uppercase font-medium min-w-[110px]">⚠️ Aten. Obs.</th>
                
                {/* Acciones */}
                <th className="px-2 py-2 text-center w-16 sticky right-16 bg-gray-200 dark:bg-gray-700 z-20">Copiar</th>
                <th className="px-2 py-2 text-center w-16 sticky right-0 bg-gray-200 dark:bg-gray-700 z-20">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {importRows.map((row, index) => {
                const isExcluded = excludedRows.has(index);
                const isSelected = selectedRows.has(index);
                const hasErrors = row.validationErrors.length > 0;

                // Helper para crear celdas editables
                const EditableCell = ({ field, type = 'text', maxWidth = '100px' }: { field: string; type?: 'text' | 'number' | 'date' | 'select'; maxWidth?: string }) => {
                  const value = row.mappedData[field as keyof typeof row.mappedData];
                  const isEditing = editingCell?.row === index && editingCell.field === field;
                  
                  // Convertir valor a string seguro
                  const displayValue = value != null && typeof value !== 'object' ? String(value) : '';
                  
                  return (
                    <td 
                      className="px-3 py-2"
                      onClick={() => !isExcluded && setEditingCell({ row: index, field })}
                    >
                      {isEditing ? (
                        <input
                          type={type}
                          value={displayValue}
                          onChange={(e) => onCellEdit(index, field, type === 'number' ? Number(e.target.value) : e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          autoFocus
                          className="w-full border border-blue-500 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <div 
                          className={`truncate cursor-text hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 px-1 py-0.5 rounded`}
                          style={{ maxWidth }}
                          title={displayValue}
                        >
                          {displayValue || '-'}
                        </div>
                      )}
                    </td>
                  );
                };

                // Helper para checkboxes
                const CheckboxCell = ({ field }: { field: string }) => {
                  const value = row.mappedData[field as keyof typeof row.mappedData];
                  
                  return (
                    <td 
                      className="px-3 py-2 text-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCellEdit(index, field, !value);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={() => onCellEdit(index, field, !value)}
                        disabled={isExcluded}
                        className="w-4 h-4 pointer-events-none"
                      />
                    </td>
                  );
                };

                // Helper para selects (campos con opciones limitadas)
                const SelectCell = ({ field, options, maxWidth = '110px' }: { field: string; options: readonly string[] | readonly { id: string; nombre: string }[]; maxWidth?: string }) => {
                  const value = row.mappedData[field as keyof typeof row.mappedData];
                  const isEditing = editingCell?.row === index && editingCell.field === field;
                  const displayValue = value != null ? String(value) : '';
                  
                  // Detectar si las opciones son objetos o strings
                  const isObjectOptions = options.length > 0 && typeof options[0] === 'object';
                  
                  return (
                    <td 
                      className="px-3 py-2"
                      onClick={() => !isExcluded && setEditingCell({ row: index, field })}
                    >
                      {isEditing ? (
                        <select
                          value={displayValue}
                          onChange={(e) => {
                            onCellEdit(index, field, e.target.value);
                            setEditingCell(null);
                          }}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                          className="w-full border border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700"
                        >
                          <option value="">-- Seleccionar --</option>
                          {isObjectOptions 
                            ? (options as readonly { id: string; nombre: string }[]).map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                              ))
                            : (options as readonly string[]).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))
                          }
                        </select>
                      ) : (
                        <div 
                          className="truncate cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 px-1 py-0.5 rounded"
                          style={{ maxWidth }}
                          title={displayValue}
                        >
                          {displayValue || '-'}
                        </div>
                      )}
                    </td>
                  );
                };

                return (
                  <tr 
                    key={index} 
                    className={`
                      border-t border-gray-100 dark:border-gray-700
                      ${isExcluded ? 'opacity-40 bg-gray-200 dark:bg-gray-700' : ''}
                      ${duplicateRows.has(index) && !isExcluded ? 'bg-orange-100 dark:bg-orange-900 dark:bg-opacity-20 border-l-4 border-orange-500' : ''}
                      ${hasErrors && !isExcluded && !duplicateRows.has(index) ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-10' : ''}
                      ${isSelected && !isExcluded ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20' : ''}
                      ${!isExcluded ? 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-50' : ''}
                    `}
                  >
                    {/* Checkbox selección */}
                    <td 
                      className="px-2 py-2 text-center cursor-pointer sticky left-0 bg-inherit z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowSelection(index);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(index)}
                        disabled={isExcluded}
                        className="w-4 h-4 pointer-events-none"
                      />
                    </td>

                    {/* Checkbox excluir */}
                    <td 
                      className="px-2 py-2 text-center cursor-pointer sticky left-8 bg-inherit z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExclusion(index);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        onChange={() => toggleRowExclusion(index)}
                        title={isExcluded ? "Click para incluir" : "Click para excluir de importación"}
                        className="w-4 h-4 text-red-600 pointer-events-none"
                      />
                    </td>

                    {/* Estado validación */}
                    <td 
                      className="px-2 py-2 text-center cursor-pointer sticky left-16 bg-inherit z-10"
                      onClick={() => !isExcluded && toggleRowSelection(index)}
                    >
                      {hasErrors ? (
                        <span className="text-red-600 dark:text-red-400 text-lg" title={row.validationErrors.map(e => e.message).join(', ')}>❌</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                      )}
                    </td>

                    {/* ============ CAMPOS OBLIGATORIOS ============ */}
                    <EditableCell field="numeroPedidoCliente" maxWidth="110px" />
                    <EditableCell field="cliente" maxWidth="130px" />
                    <EditableCell field="fechaEntrega" type="date" maxWidth="110px" />
                    <EditableCell field="metros" type="number" maxWidth="90px" />

                    {/* ============ PRODUCCIÓN ============ */}
                    <EditableCell field="producto" maxWidth="110px" />
                    <EditableCell field="desarrollo" maxWidth="100px" />
                    <EditableCell field="capa" maxWidth="90px" />
                    <SelectCell field="maquinaImpresion" options={MAQUINAS_IMPRESION} maxWidth="110px" />

                    {/* ============ WORKFLOW ============ */}
                    <SelectCell field="etapaActual" options={GLOBAL_FIELD_OPTIONS.etapaActual} maxWidth="110px" />
                    <td className="px-3 py-2">
                      {row.mappedData.etapaActual === Etapa.PREPARACION ? (
                        <select
                          value={row.mappedData.subEtapaActual || PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA}
                          onChange={(e) => onCellEdit(index, 'subEtapaActual', e.target.value)}
                          disabled={isExcluded}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs bg-white dark:bg-gray-700"
                        >
                          <option value={PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA}>Sin Gestión</option>
                          <option value={PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE}>Material No Disp.</option>
                          <option value={PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE}>Cliché No Disp.</option>
                          <option value={PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION}>Listo Producción</option>
                        </select>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <SelectCell field="prioridad" options={GLOBAL_FIELD_OPTIONS.prioridad} maxWidth="90px" />
                    <SelectCell field="tipoImpresion" options={GLOBAL_FIELD_OPTIONS.tipoImpresion} maxWidth="130px" />

                    {/* ============ PERSONAS ============ */}
                    <EditableCell field="vendedorNombre" maxWidth="110px" />

                    {/* ============ FECHAS ADICIONALES ============ */}
                    <EditableCell field="fechaCreacion" type="date" maxWidth="110px" />
                    <EditableCell field="nuevaFechaEntrega" type="date" maxWidth="110px" />
                    <EditableCell field="compraCliche" type="date" maxWidth="110px" />
                    <EditableCell field="recepcionCliche" type="date" maxWidth="110px" />

                    {/* ============ CLICHÉ ============ */}
                    <SelectCell field="estadoCliché" options={GLOBAL_FIELD_OPTIONS.estadoCliché} maxWidth="110px" />
                    <EditableCell field="clicheInfoAdicional" maxWidth="150px" />
                    <EditableCell field="camisa" maxWidth="90px" />
                    <CheckboxCell field="materialDisponible" />
                    <CheckboxCell field="clicheDisponible" />
                    <CheckboxCell field="horasConfirmadas" />

                    {/* ============ MEDIDAS Y TIEMPOS ============ */}
                    <EditableCell field="velocidadPosible" type="number" maxWidth="100px" />
                    <EditableCell field="tiempoProduccionDecimal" type="number" maxWidth="110px" />
                    <EditableCell field="bobinaMadre" type="number" maxWidth="100px" />
                    <EditableCell field="bobinaFinal" type="number" maxWidth="100px" />

                    {/* ============ COLORES ============ */}
                    <EditableCell field="colores" type="number" maxWidth="80px" />
                    <EditableCell field="minColor" type="number" maxWidth="90px" />
                    <EditableCell field="minAdap" type="number" maxWidth="90px" />

                    {/* ============ NÚMEROS DE COMPRA ============ */}
                    <td 
                      className="px-3 py-2"
                      onClick={() => !isExcluded && setEditingCell({ row: index, field: 'numerosCompra' })}
                    >
                      {editingCell?.row === index && editingCell.field === 'numerosCompra' ? (
                        <input
                          type="text"
                          value={Array.isArray(row.mappedData.numerosCompra) ? row.mappedData.numerosCompra.join(', ') : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const array = value.split(',').map(s => s.trim()).filter(s => s);
                            onCellEdit(index, 'numerosCompra', array);
                          }}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          placeholder="Separar con comas"
                          autoFocus
                          className="w-full border border-blue-500 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <div 
                          className="truncate cursor-text hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 px-1 py-0.5 rounded"
                          style={{ maxWidth: '130px' }}
                          title={Array.isArray(row.mappedData.numerosCompra) ? row.mappedData.numerosCompra.join(', ') : ''}
                        >
                          {Array.isArray(row.mappedData.numerosCompra) && row.mappedData.numerosCompra.length > 0
                            ? row.mappedData.numerosCompra.join(', ')
                            : '-'}
                        </div>
                      )}
                    </td>

                    {/* ============ OBSERVACIONES ============ */}
                    <EditableCell field="observaciones" maxWidth="180px" />
                    <EditableCell field="observacionesRapidas" maxWidth="150px" />
                    <EditableCell field="observacionesMaterial" maxWidth="150px" />

                    {/* ============ CHECKBOXES ============ */}
                    <CheckboxCell field="antivaho" />
                    <CheckboxCell field="antivahoRealizado" />
                    <CheckboxCell field="microperforado" />
                    <CheckboxCell field="macroperforado" />
                    <CheckboxCell field="anonimo" />
                    <EditableCell field="anonimoPostImpresion" maxWidth="130px" />
                    <CheckboxCell field="atencionObservaciones" />

                    {/* ============ COPIAR ============ */}
                    <td className="px-2 py-2 text-center sticky right-16 bg-inherit z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyFromRow(index);
                        }}
                        disabled={selectedRows.size === 0 || isExcluded}
                        title="Copiar datos de esta fila a las seleccionadas"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <CopyIcon className="w-4 h-4" />
                      </button>
                    </td>

                    {/* ============ ELIMINAR ============ */}
                    <td className="px-2 py-2 text-center sticky right-0 bg-inherit z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar el pedido "${row.mappedData.numeroPedidoCliente || 'Sin número'}"?\n\nEsta acción no se puede deshacer.`)) {
                            onDeleteRow(index);
                          }
                        }}
                        title="Eliminar esta fila permanentemente"
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 p-1 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Botones inferiores */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isImporting || isLoadingExistingNumbers}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow"
          >
            <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> Volver al Mapeo
          </button>

          <div className="flex flex-col items-end gap-2">
            {/* Mensaje de estado */}
            {isLoadingExistingNumbers && (
              <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
                Verificando números de pedido existentes...
              </div>
            )}
            {duplicateRows.size > 0 && !isLoadingExistingNumbers && (
              <div className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900 dark:bg-opacity-20 px-3 py-1.5 rounded border border-red-200 dark:border-red-700">
                ⚠️ {duplicateRows.size} pedido{duplicateRows.size === 1 ? '' : 's'} duplicado{duplicateRows.size === 1 ? '' : 's'} detectado{duplicateRows.size === 1 ? '' : 's'}. No se puede importar.
              </div>
            )}

            <button
              onClick={onImport}
              disabled={isImporting || isLoadingExistingNumbers || activeValidCount === 0 || duplicateRows.size > 0}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-all font-medium shadow-lg relative overflow-hidden"
              title={duplicateRows.size > 0 ? 'No se puede importar con pedidos duplicados' : ''}
            >
            {isImporting ? (
              <>
                <LoadingSpinnerIcon className="w-5 h-5 inline mr-2 animate-spin" />
                Importando... ({Math.round((importProgress || 0))}%)
                {/* Barra de progreso */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-green-300 transition-all duration-300"
                  style={{ width: `${importProgress || 0}%` }}
                />
              </>
            ) : (
              <>
                Importar {activeValidCount} Pedidos
                <UploadIcon className="w-5 h-5 inline ml-2" />
              </>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Panel lateral COMPLETO: Ajustes Finales (35%) */}
      <div className="w-[450px] bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 border-l border-gray-300 dark:border-gray-600 p-5 overflow-y-auto flex flex-col">
        <div className="mb-4 sticky top-0 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 pb-3 z-10">
          <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">⚙️ Ajustes Finales</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Configura valores globales y aplícalos a las filas seleccionadas. Los campos obligatorios están marcados con *.
          </p>
          
          {/* Botón aplicar a seleccionados */}
          <button
            onClick={applyGlobalToSelected}
            disabled={selectedRows.size === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-xs font-medium shadow mb-3 transition-colors"
          >
            {selectedRows.size > 0 
              ? `✨ Aplicar a ${selectedRows.size} Filas Seleccionadas` 
              : 'Selecciona filas para aplicar'}
          </button>
          
          <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700 rounded p-2 text-xs text-yellow-800 dark:text-yellow-200">
            💡 <strong>Tip:</strong> Completa aquí los campos que faltan y aplícalos masivamente a las filas seleccionadas.
          </div>
        </div>
        
        <div className="space-y-3 flex-1">
          {/* ====== SECCIÓN: CAMPOS OBLIGATORIOS ====== */}
          <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-10 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <h5 className="text-xs font-bold mb-2 text-red-700 dark:text-red-300 uppercase">⚠️ Campos Obligatorios</h5>
            
            {/* Cliente */}
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">👤 Cliente *:</label>
              <select
                value={globalFields.clienteId || ''}
                onChange={(e) => {
                  const cliente = clientes.find(c => c.id === e.target.value);
                  setGlobalFields({ 
                    ...globalFields, 
                    clienteId: e.target.value,
                    cliente: cliente?.nombre || ''
                  });
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">-- Seleccionar --</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha Entrega */}
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📅 Fecha Entrega *:</label>
              <input
                type="date"
                value={globalFields.fechaEntrega || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, fechaEntrega: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Metros */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📏 Metros *:</label>
              <input
                type="number"
                value={globalFields.metros || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, metros: Number(e.target.value) })}
                placeholder="Metros a producir"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* ====== SECCIÓN: WORKFLOW ====== */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <h5 className="text-xs font-bold mb-2 text-gray-700 dark:text-gray-300 uppercase">🔄 Workflow</h5>
            
            <div className="space-y-2">
              {/* Etapa */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📍 Etapa Inicial:</label>
                <select
                  value={globalFields.etapaActual || Etapa.PREPARACION}
                  onChange={(e) => {
                    const newEtapa = e.target.value as Etapa;
                    setGlobalFields({ 
                      ...globalFields, 
                      etapaActual: newEtapa,
                      // Si cambia a PREPARACION, asignar subetapa por defecto
                      subEtapaActual: newEtapa === Etapa.PREPARACION 
                        ? PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA 
                        : undefined
                    });
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {GLOBAL_FIELD_OPTIONS.etapaActual.map(etapa => (
                    <option key={etapa} value={etapa}>{etapa}</option>
                  ))}
                </select>
              </div>

              {/* Subetapa (solo si etapa es PREPARACION) */}
              {globalFields.etapaActual === Etapa.PREPARACION && (
                <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-10 p-2 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <label className="block text-xs font-medium mb-1 text-yellow-800 dark:text-yellow-200">
                    🎯 Subetapa de Preparación:
                  </label>
                  <select
                    value={globalFields.subEtapaActual || PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA}
                    onChange={(e) => setGlobalFields({ ...globalFields, subEtapaActual: e.target.value })}
                    className="w-full border border-yellow-300 dark:border-yellow-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value={PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA}>Sin Gestión Iniciada</option>
                    <option value={PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE}>Material No Disponible</option>
                    <option value={PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE}>Cliché No Disponible</option>
                    <option value={PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION}>Listo para Producción</option>
                  </select>
                  <p className="text-[10px] text-yellow-700 dark:text-yellow-300 mt-1">
                    ⚠️ Obligatorio para pedidos en Preparación
                  </p>
                </div>
              )}

              {/* Prioridad */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">⚡ Prioridad:</label>
                <select
                  value={globalFields.prioridad || Prioridad.NORMAL}
                  onChange={(e) => setGlobalFields({ ...globalFields, prioridad: e.target.value as Prioridad })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {GLOBAL_FIELD_OPTIONS.prioridad.map(prioridad => (
                    <option key={prioridad} value={prioridad}>{prioridad}</option>
                  ))}
                </select>
              </div>

              {/* Tipo Impresión */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🖨️ Tipo de Impresión:</label>
                <select
                  value={globalFields.tipoImpresion || TipoImpresion.SUPERFICIE}
                  onChange={(e) => setGlobalFields({ ...globalFields, tipoImpresion: e.target.value as TipoImpresion })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {GLOBAL_FIELD_OPTIONS.tipoImpresion.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ====== SECCIÓN: PRODUCCIÓN ====== */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <h5 className="text-xs font-bold mb-2 text-gray-700 dark:text-gray-300 uppercase">🏭 Producción</h5>
            
            <div className="space-y-2">
              {/* Máquina */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🏭 Máquina:</label>
                <select
                  value={globalFields.maquinaImpresion || ''}
                  onChange={(e) => setGlobalFields({ ...globalFields, maquinaImpresion: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">-- Seleccionar --</option>
                  {MAQUINAS_IMPRESION.map(maq => (
                    <option key={maq.id} value={maq.id}>{maq.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Producto */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📦 Producto:</label>
                <input
                  type="text"
                  value={globalFields.producto || ''}
                  onChange={(e) => setGlobalFields({ ...globalFields, producto: e.target.value })}
                  placeholder="Nombre del producto..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Material/Desarrollo */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🔬 Material/Desarrollo:</label>
                <input
                  type="text"
                  value={globalFields.desarrollo || ''}
                  onChange={(e) => setGlobalFields({ ...globalFields, desarrollo: e.target.value })}
                  placeholder="Ej: PE, PP, PET..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Capa */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📄 Capa:</label>
                <input
                  type="text"
                  value={globalFields.capa || ''}
                  onChange={(e) => setGlobalFields({ ...globalFields, capa: e.target.value })}
                  placeholder="Información de capa..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* ====== SECCIÓN: PERSONAS ====== */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <h5 className="text-xs font-bold mb-2 text-gray-700 dark:text-gray-300 uppercase">👥 Personas</h5>
            
            {/* Vendedor */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">💼 Vendedor:</label>
              <select
                value={globalFields.vendedorId || ''}
                onChange={(e) => {
                  const vendedor = vendedores.find(v => v.id === e.target.value);
                  setGlobalFields({ 
                    ...globalFields, 
                    vendedorId: e.target.value,
                    vendedorNombre: vendedor?.nombre || ''
                  });
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">-- Seleccionar --</option>
                {vendedores.map(vendedor => (
                  <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ====== SECCIÓN: FECHAS ====== */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <h5 className="text-xs font-bold mb-2 text-gray-700 dark:text-gray-300 uppercase">📅 Fechas</h5>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🕐 F. Creación:</label>
                  <input
                    type="date"
                    value={globalFields.fechaCreacion?.split('T')[0] || ''}
                    onChange={(e) => setGlobalFields({ ...globalFields, fechaCreacion: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📆 Nueva F. Entrega:</label>
                  <input
                    type="date"
                    value={globalFields.nuevaFechaEntrega || ''}
                    onChange={(e) => setGlobalFields({ ...globalFields, nuevaFechaEntrega: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🛒 F. Compra Cliché:</label>
                  <input
                    type="date"
                    value={globalFields.compraCliche || ''}
                    onChange={(e) => setGlobalFields({ ...globalFields, compraCliche: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📥 F. Recep. Cliché:</label>
                  <input
                    type="date"
                    value={globalFields.recepcionCliche || ''}
                    onChange={(e) => setGlobalFields({ ...globalFields, recepcionCliche: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ====== SECCIÓN: CLICHÉ Y PREPARACIÓN ====== */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <h5 className="text-xs font-bold mb-2 text-gray-700 dark:text-gray-300 uppercase">🎨 Cliché y Preparación</h5>
            
            <div className="space-y-2">
              {/* Estado Cliché */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Estado Cliché:</label>
                <select
                  value={globalFields.estadoCliché || ''}
                  onChange={(e) => setGlobalFields({ ...globalFields, estadoCliché: e.target.value as EstadoCliché })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">-- Seleccionar --</option>
                  {GLOBAL_FIELD_OPTIONS.estadoCliché.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>

              {/* Info Adicional Cliché */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">ℹ️ Info Adicional:</label>
                <input
                  type="text"
                  value={globalFields.clicheInfoAdicional || ''}
                  onChange={(e) => setGlobalFields({ ...globalFields, clicheInfoAdicional: e.target.value })}
                  placeholder="Info adicional del cliché..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Camisa */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🎯 Camisa:</label>
                <input
                  type="text"
                  value={globalFields.camisa || ''}
                  onChange={(e) => setGlobalFields({ ...globalFields, camisa: e.target.value })}
                  placeholder="Información de camisa..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Checkboxes de preparación */}
              <div className="space-y-1.5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalFields.materialDisponible || false}
                    onChange={(e) => setGlobalFields({ ...globalFields, materialDisponible: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">📦 Material Disponible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalFields.clicheDisponible || false}
                    onChange={(e) => setGlobalFields({ ...globalFields, clicheDisponible: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">🎨 Cliché Disponible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalFields.horasConfirmadas || false}
                    onChange={(e) => setGlobalFields({ ...globalFields, horasConfirmadas: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">⏰ Horas Confirmadas</span>
                </label>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📝 Observaciones:</label>
            <textarea
              value={globalFields.observaciones || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, observaciones: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[50px]"
              rows={2}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🕐 F. Creación:</label>
              <input
                type="date"
                value={globalFields.fechaCreacion?.split('T')[0] || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, fechaCreacion: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📅 F. Entrega:</label>
              <input
                type="date"
                value={globalFields.fechaEntrega || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, fechaEntrega: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🛒 F. Compra Cliché:</label>
              <input
                type="date"
                value={globalFields.compraCliche || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, compraCliche: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📥 F. Recep. Cliché:</label>
              <input
                type="date"
                value={globalFields.recepcionCliche || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, recepcionCliche: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Bobinas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🔵 B.Madre:</label>
              <input
                type="number"
                value={globalFields.bobinaMadre || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, bobinaMadre: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🟢 B.Final:</label>
              <input
                type="number"
                value={globalFields.bobinaFinal || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, bobinaFinal: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Colores */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">🎨 Colores:</label>
              <input
                type="number"
                value={globalFields.colores || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, colores: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">⏰ Min/Color:</label>
              <input
                type="number"
                value={globalFields.minColor || ''}
                onChange={(e) => setGlobalFields({ ...globalFields, minColor: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Checkboxes - Post-impresión y Especiales */}
          <div className="space-y-1.5 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.antivaho || false}
                onChange={(e) => setGlobalFields({ ...globalFields, antivaho: e.target.checked })}
                className="w-3.5 h-3.5 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">💨 Antivaho</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.antivahoRealizado || false}
                onChange={(e) => setGlobalFields({ ...globalFields, antivahoRealizado: e.target.checked })}
                className="w-3.5 h-3.5 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">✅ Antivaho Realizado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.microperforado || false}
                onChange={(e) => setGlobalFields({ ...globalFields, microperforado: e.target.checked })}
                className="w-3.5 h-3.5 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">🔘 Microperforado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.macroperforado || false}
                onChange={(e) => setGlobalFields({ ...globalFields, macroperforado: e.target.checked })}
                className="w-3.5 h-3.5 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">⚫ Macroperforado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.anonimo || false}
                onChange={(e) => setGlobalFields({ ...globalFields, anonimo: e.target.checked })}
                className="w-3.5 h-3.5 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">👤 Anónimo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalFields.atencionObservaciones || false}
                onChange={(e) => setGlobalFields({ ...globalFields, atencionObservaciones: e.target.checked })}
                className="w-3.5 h-3.5 text-blue-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">⚠️ Atención Observaciones</span>
            </label>
          </div>

          {/* Campo de Post-Impresión para Anónimos */}
          <div className="mt-2">
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">📋 Post-Impresión Anónimo:</label>
            <input
              type="text"
              value={globalFields.anonimoPostImpresion || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, anonimoPostImpresion: e.target.value })}
              placeholder="Tipo de post-impresión para anónimos..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Recordatorio */}
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1 text-xs">⚠️ Recordatorio</h5>
          <ul className="text-[10px] text-yellow-700 dark:text-yellow-300 space-y-0.5">
            <li>• Doble clic en celdas para editar</li>
            <li>• Selecciona filas y aplica valores globales</li>
            <li>• Marca checkbox rojo para excluir pedidos</li>
            <li>• Solo se importarán pedidos sin errores</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
