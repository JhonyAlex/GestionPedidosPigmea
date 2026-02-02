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
  { value: 'nuevaFechaEntrega', label: '📆 Nueva Fecha Entrega' },
  { value: 'compraCliche', label: '🛒 Fecha Compra Cliché' },
  { value: 'recepcionCliche', label: '📥 Fecha Recepción Cliché' },
  
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
];

// Valores por defecto para campos globales
const GLOBAL_FIELD_OPTIONS = {
  prioridad: Object.values(Prioridad),
  tipoImpresion: Object.values(TipoImpresion),
  etapaActual: Object.values(Etapa),
  estadoCliché: Object.values(EstadoCliché)
};

export default function BulkImportModalV2({ onClose, onImportComplete }: BulkImportModalV2Props) {
  // Estados principales
  const [currentPhase, setCurrentPhase] = useState<'input' | 'mapping' | 'importing'>('input');
  const [pastedText, setPastedText] = useState('');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [globalFields, setGlobalFields] = useState<Partial<Pedido>>({
    etapaActual: Etapa.PREPARACION,
    prioridad: Prioridad.NORMAL,
    tipoImpresion: TipoImpresion.SUPERFICIE
  });
  
  // Estados de importación
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  // Hooks para datos
  const { clientes } = useClientesManager();
  const { vendedores } = useVendedoresManager();

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
  const setupInitialMappings = useCallback((headerRowIndex: number) => {
    if (!rawData.length || headerRowIndex >= rawData.length) return;

    const headers = rawData[headerRowIndex] || [];
    const initialMappings: ColumnMapping[] = headers.map((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Mapeo automático inteligente
      let dbField: keyof Pedido | 'ignore' = 'ignore';
      
      if (normalizedHeader.includes('pedido') || normalizedHeader.includes('nº') || normalizedHeader.includes('n°')) {
        dbField = 'numeroPedidoCliente';
      } else if (normalizedHeader.includes('cliente')) {
        dbField = 'cliente';
      } else if (normalizedHeader.includes('fecha') && normalizedHeader.includes('entrega')) {
        dbField = 'fechaEntrega';
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
      
      return {
        excelColumn: header,
        dbField,
        transform: ['fechaEntrega', 'nuevaFechaEntrega', 'compraCliche', 'recepcionCliche'].includes(dbField as string) ? 'date' : 
                   ['metros', 'velocidadPosible', 'tiempoProduccionDecimal', 'bobinaMadre', 'bobinaFinal', 'minAdap', 'colores', 'minColor'].includes(dbField as string) ? 'number' : 
                   'text'
      };
    });
    
    setColumnMappings(initialMappings);
  }, [rawData]);

  // Actualizar mapeos cuando cambia la fila de encabezado seleccionada
  React.useEffect(() => {
    if (currentPhase === 'mapping' && rawData.length > 0) {
      setupInitialMappings(selectedHeaderRow);
    }
  }, [currentPhase, rawData, selectedHeaderRow, setupInitialMappings]);

  // Procesar datos para importación (Paso 2 -> 3)
  const processImportData = useCallback(() => {
    if (!rawData.length) return;

    const dataRows = rawData.slice(selectedHeaderRow + 1);
    const headers = rawData[selectedHeaderRow] || [];
    
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
    setCurrentPhase('importing');
  }, [rawData, selectedHeaderRow, columnMappings, globalFields, clientes, vendedores]);

  // Ejecutar importación
  const executeImport = useCallback(async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const validRows = importRows.filter(row => row.validationErrors.length === 0);
      const batchSize = 50;
      let processedCount = 0;
      const results = [];
      
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        
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
        
        const result = await response.json();
        results.push(result);
        
        processedCount += batch.length;
        setImportProgress((processedCount / validRows.length) * 100);
        
        if (!response.ok) {
          throw new Error(result.error || 'Error en el servidor');
        }
      }
      
      setImportResults(results);
      onImportComplete?.(results);
      
    } catch (error) {
      console.error('Error durante la importación:', error);
      alert(`Error durante la importación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsImporting(false);
    }
  }, [importRows, globalFields, isImporting, onImportComplete]);

  // Editar valor de celda individual
  const handleCellEdit = useCallback((rowIndex: number, field: string, value: any) => {
    setImportRows(prev => prev.map((row, index) => {
      if (index === rowIndex) {
        const updatedMappedData = { ...row.mappedData, [field]: value };
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
            />
          )}

          {currentPhase === 'mapping' && (
            <MappingPhaseV2
              rawData={rawData}
              selectedHeaderRow={selectedHeaderRow}
              setSelectedHeaderRow={setSelectedHeaderRow}
              columnMappings={columnMappings}
              setColumnMappings={setColumnMappings}
              globalFields={globalFields}
              setGlobalFields={setGlobalFields}
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
              onImport={executeImport}
              onBack={() => setCurrentPhase('mapping')}
              isImporting={isImporting}
              importResults={importResults}
              globalFields={globalFields}
              setGlobalFields={setGlobalFields}
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
}

function InputPhaseV2({ pastedText, setPastedText, onNext, rawData, selectedHeaderRow, setSelectedHeaderRow }: InputPhaseV2Props) {
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
          </ul>
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
        
        {showPreview && previewLines.length > 0 && (
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
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!pastedText.trim() || previewLines.length < 2}
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
  selectedHeaderRow: number;
  setSelectedHeaderRow: (row: number) => void;
  columnMappings: ColumnMapping[];
  setColumnMappings: (mappings: ColumnMapping[]) => void;
  globalFields: Partial<Pedido>;
  setGlobalFields: (fields: Partial<Pedido>) => void;
  onNext: () => void;
  onBack: () => void;
}

function MappingPhaseV2({
  rawData,
  selectedHeaderRow,
  setSelectedHeaderRow,
  columnMappings,
  setColumnMappings,
  globalFields,
  setGlobalFields,
  onNext,
  onBack
}: MappingPhaseV2Props) {
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

  const headers = rawData[selectedHeaderRow] || [];
  const previewRows = rawData.slice(selectedHeaderRow + 1, selectedHeaderRow + 4); // Mostrar 3 filas

  return (
    <div className="h-full flex">
      {/* Área principal: Grid de Datos (70%) */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">🔗 Mapear Columnas del Excel</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Seleccione qué campo de base de datos corresponde a cada columna del Excel. Los campos con * son obligatorios.
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
          📊 Vista previa de {previewRows.length} filas • Total: {rawData.length - selectedHeaderRow - 1} pedidos
        </div>
      </div>

      {/* Panel lateral: Valores Globales (30%) */}
      <div className="w-[380px] bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 border-l border-gray-300 dark:border-gray-600 p-6 overflow-y-auto flex flex-col">
        <div className="mb-4">
          <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">⚙️ Datos para Toda la Importación</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Estos valores se aplicarán a <strong>todos</strong> los pedidos importados (a menos que el Excel especifique otro valor):
          </p>
        </div>
        
        <div className="space-y-5 flex-1">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📍 Etapa Inicial:</label>
            <select
              value={globalFields.etapaActual || Etapa.PREPARACION}
              onChange={(e) => setGlobalFields({ ...globalFields, etapaActual: e.target.value as Etapa })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {GLOBAL_FIELD_OPTIONS.etapaActual.map(etapa => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">⚡ Prioridad:</label>
            <select
              value={globalFields.prioridad || Prioridad.NORMAL}
              onChange={(e) => setGlobalFields({ ...globalFields, prioridad: e.target.value as Prioridad })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {GLOBAL_FIELD_OPTIONS.prioridad.map(prioridad => (
                <option key={prioridad} value={prioridad}>{prioridad}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">🖨️ Tipo de Impresión:</label>
            <select
              value={globalFields.tipoImpresion || TipoImpresion.SUPERFICIE}
              onChange={(e) => setGlobalFields({ ...globalFields, tipoImpresion: e.target.value as TipoImpresion })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {GLOBAL_FIELD_OPTIONS.tipoImpresion.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">🏭 Máquina de Impresión:</label>
            <input
              type="text"
              value={globalFields.maquinaImpresion || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, maquinaImpresion: e.target.value })}
              placeholder="Ej: WM1, GIAVE, WM3..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📝 Observaciones Generales:</label>
            <textarea
              value={globalFields.observaciones || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, observaciones: e.target.value })}
              placeholder="Observaciones que se aplicarán a todos los pedidos..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">🔬 Material/Desarrollo:</label>
            <input
              type="text"
              value={globalFields.desarrollo || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, desarrollo: e.target.value })}
              placeholder="Ej: PE, PP, PET..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📄 Capa:</label>
            <input
              type="text"
              value={globalFields.capa || ''}
              onChange={(e) => setGlobalFields({ ...globalFields, capa: e.target.value })}
              placeholder="Información de capa..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium shadow"
          >
            <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> Volver
          </button>
          <button
            onClick={onNext}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg transition-all text-sm font-medium shadow-lg"
          >
            Revisar <ArrowRightIcon className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================== FASE 3: REVISIÓN E IMPORTACIÓN CON EDICIÓN INDIVIDUAL ========================
interface ImportingPhaseV2Props {
  importRows: ImportRow[];
  validationStats: { total: number; valid: number; errors: number };
  onCellEdit: (rowIndex: number, field: string, value: any) => void;
  onCopyToSelected: (sourceIndex: number, targetIndices: number[]) => void;
  onImport: () => void;
  onBack: () => void;
  isImporting: boolean;
  importResults: any;
  globalFields: Partial<Pedido>;
  setGlobalFields: (fields: Partial<Pedido>) => void;
}

function ImportingPhaseV2({
  importRows,
  validationStats,
  onCellEdit,
  onCopyToSelected,
  onImport,
  onBack,
  isImporting,
  importResults,
  globalFields,
  setGlobalFields
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

  const handleCopyFromRow = (sourceRow: number) => {
    if (selectedRows.size === 0) {
      alert('Seleccione al menos una fila destino para copiar.');
      return;
    }
    onCopyToSelected(sourceRow, Array.from(selectedRows));
    setSelectedRows(new Set());
  };

  if (importResults) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center max-w-lg bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
          <div className="text-7xl mb-4 animate-bounce">✅</div>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3">¡Importación Completada!</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            Se procesaron <strong className="text-green-600 dark:text-green-400">{validationStats.valid}</strong> pedidos correctamente.
          </p>
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
      {/* Tabla principal de revisión (70%) */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">✅ Revisar Datos Antes de Importar</h3>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">
              ✅ {validationStats.valid} filas válidas
            </span>
            {validationStats.errors > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                ❌ {validationStats.errors} con errores
              </span>
            )}
            {selectedRows.size > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                📋 {selectedRows.size} seleccionadas
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Haz doble clic en cualquier celda para editarla. Selecciona filas para copiar valores masivamente.
          </p>
        </div>

        {/* Tabla scrolleable */}
        <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg shadow-inner bg-white dark:bg-gray-800">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 sticky top-0 z-10 shadow">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(importRows.map((_, i) => i)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">N° Pedido *</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Cliente *</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Fecha *</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Metros *</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Observaciones</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {importRows.map((row, index) => (
                <tr 
                  key={index} 
                  className={`
                    border-t border-gray-100 dark:border-gray-700 
                    ${row.validationErrors.length > 0 ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-10' : ''}
                    ${selectedRows.has(index) ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20' : ''}
                    hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-50
                  `}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(index)}
                      onChange={() => toggleRowSelection(index)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    {row.validationErrors.length === 0 ? (
                      <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-xl" title={row.validationErrors.map(e => e.message).join(', ')}>❌</span>
                    )}
                  </td>
                  <td className="px-4 py-2" onDoubleClick={() => setEditingCell({ row: index, field: 'numeroPedidoCliente' })}>
                    {editingCell?.row === index && editingCell.field === 'numeroPedidoCliente' ? (
                      <input
                        type="text"
                        value={row.mappedData.numeroPedidoCliente || ''}
                        onChange={(e) => onCellEdit(index, 'numeroPedidoCliente', e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full border border-blue-500 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300">{row.mappedData.numeroPedidoCliente || '-'}</div>
                    )}
                  </td>
                  <td className="px-4 py-2" onDoubleClick={() => setEditingCell({ row: index, field: 'cliente' })}>
                    {editingCell?.row === index && editingCell.field === 'cliente' ? (
                      <input
                        type="text"
                        value={row.mappedData.cliente || ''}
                        onChange={(e) => onCellEdit(index, 'cliente', e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full border border-blue-500 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300">{row.mappedData.cliente || '-'}</div>
                    )}
                  </td>
                  <td className="px-4 py-2" onDoubleClick={() => setEditingCell({ row: index, field: 'fechaEntrega' })}>
                    {editingCell?.row === index && editingCell.field === 'fechaEntrega' ? (
                      <input
                        type="date"
                        value={row.mappedData.fechaEntrega || ''}
                        onChange={(e) => onCellEdit(index, 'fechaEntrega', e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full border border-blue-500 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300">{row.mappedData.fechaEntrega || '-'}</div>
                    )}
                  </td>
                  <td className="px-4 py-2" onDoubleClick={() => setEditingCell({ row: index, field: 'metros' })}>
                    {editingCell?.row === index && editingCell.field === 'metros' ? (
                      <input
                        type="number"
                        value={row.mappedData.metros || ''}
                        onChange={(e) => onCellEdit(index, 'metros', Number(e.target.value))}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full border border-blue-500 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300">{row.mappedData.metros || '-'}</div>
                    )}
                  </td>
                  <td className="px-4 py-2" onDoubleClick={() => setEditingCell({ row: index, field: 'producto' })}>
                    {editingCell?.row === index && editingCell.field === 'producto' ? (
                      <input
                        type="text"
                        value={row.mappedData.producto || ''}
                        onChange={(e) => onCellEdit(index, 'producto', e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full border border-blue-500 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={row.mappedData.producto || ''}>
                        {row.mappedData.producto || '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2" onDoubleClick={() => setEditingCell({ row: index, field: 'observaciones' })}>
                    {editingCell?.row === index && editingCell.field === 'observaciones' ? (
                      <input
                        type="text"
                        value={row.mappedData.observaciones || ''}
                        onChange={(e) => onCellEdit(index, 'observaciones', e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full border border-blue-500 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={row.mappedData.observaciones || ''}>
                        {row.mappedData.observaciones || '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleCopyFromRow(index)}
                      disabled={selectedRows.size === 0}
                      title="Copiar datos de esta fila a las seleccionadas"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <CopyIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isImporting}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow"
          >
            <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> Volver al Mapeo
          </button>

          <button
            onClick={onImport}
            disabled={isImporting || validationStats.valid === 0}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-all font-medium shadow-lg"
          >
            {isImporting ? (
              <>
                <LoadingSpinnerIcon className="w-5 h-5 inline mr-2" />
                Importando...
              </>
            ) : (
              <>
                Importar {validationStats.valid} Pedidos
                <UploadIcon className="w-5 h-5 inline ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panel lateral para ajustes finales (30%) */}
      <div className="w-[350px] bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 border-l border-gray-300 dark:border-gray-600 p-6 overflow-y-auto">
        <h4 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">⚙️ Ajustes Finales</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Modifica los valores globales si es necesario antes de importar:
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📍 Etapa Inicial:</label>
            <select
              value={globalFields.etapaActual || Etapa.PREPARACION}
              onChange={(e) => setGlobalFields({ ...globalFields, etapaActual: e.target.value as Etapa })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700"
            >
              {GLOBAL_FIELD_OPTIONS.etapaActual.map(etapa => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">⚡ Prioridad:</label>
            <select
              value={globalFields.prioridad || Prioridad.NORMAL}
              onChange={(e) => setGlobalFields({ ...globalFields, prioridad: e.target.value as Prioridad })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700"
            >
              {GLOBAL_FIELD_OPTIONS.prioridad.map(prioridad => (
                <option key={prioridad} value={prioridad}>{prioridad}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">🖨️ Tipo de Impresión:</label>
            <select
              value={globalFields.tipoImpresion || TipoImpresion.SUPERFICIE}
              onChange={(e) => setGlobalFields({ ...globalFields, tipoImpresion: e.target.value as TipoImpresion })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700"
            >
              {GLOBAL_FIELD_OPTIONS.tipoImpresion.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Recordatorio</h5>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Verifica que todos los datos sean correctos</li>
            <li>• Los pedidos con errores no se importarán</li>
            <li>• Puedes editar cualquier celda con doble clic</li>
            <li>• Usa el botón de copiar para replicar datos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
