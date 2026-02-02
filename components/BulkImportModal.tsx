import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

// Iconos necesarios para el componente
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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="animate-spin"></path>
  </svg>
);

interface BulkImportModalProps {
  onClose: () => void;
  onImportComplete?: (result: any) => void;
}

// Campos disponibles para mapear desde Excel
const AVAILABLE_FIELDS = [
  { value: 'ignore', label: '-- Ignorar columna --' },
  { value: 'numeroPedidoCliente', label: 'Número de Pedido Cliente *', required: true },
  { value: 'cliente', label: 'Cliente *', required: true },
  { value: 'fechaEntrega', label: 'Fecha de Entrega *', required: true },
  { value: 'metros', label: 'Metros *', required: true },
  { value: 'producto', label: 'Producto' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'capa', label: 'Capa' },
  { value: 'observaciones', label: 'Observaciones' },
  { value: 'maquinaImpresion', label: 'Máquina de Impresión' },
  { value: 'vendedorNombre', label: 'Vendedor' }
];

// Valores por defecto para campos globales
const GLOBAL_FIELD_OPTIONS = {
  prioridad: Object.values(Prioridad),
  tipoImpresion: Object.values(TipoImpresion),
  etapaActual: Object.values(Etapa),
  estadoCliché: Object.values(EstadoCliché)
};

export default function BulkImportModal({ onClose, onImportComplete }: BulkImportModalProps) {
  // Estados principales
  const [currentPhase, setCurrentPhase] = useState<'input' | 'mapping' | 'importing'>('input');
  const [pastedText, setPastedText] = useState('');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headerRow, setHeaderRow] = useState(0);
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

  // Procesar datos pegados
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
    setHeaderRow(detectedHeader);
    
    // Crear mapeos iniciales basados en la fila de encabezados
    const headers = parsed[detectedHeader] || [];
    const initialMappings: ColumnMapping[] = headers.map((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Mapeo automático inteligente
      let dbField: keyof Pedido | 'ignore' = 'ignore';
      
      if (normalizedHeader.includes('pedido') || normalizedHeader.includes('nº')) {
        dbField = 'numeroPedidoCliente';
      } else if (normalizedHeader.includes('cliente')) {
        dbField = 'cliente';
      } else if (normalizedHeader.includes('fecha') && normalizedHeader.includes('entrega')) {
        dbField = 'fechaEntrega';
      } else if (normalizedHeader.includes('metro') || normalizedHeader === 'c') {
        dbField = 'metros';
      } else if (normalizedHeader.includes('producto')) {
        dbField = 'producto';
      } else if (normalizedHeader.includes('material')) {
        dbField = 'desarrollo';
      } else if (normalizedHeader.includes('observ')) {
        dbField = 'observaciones';
      } else if (normalizedHeader.includes('vendedor')) {
        dbField = 'vendedorNombre';
      }
      
      return {
        excelColumn: header,
        dbField,
        transform: dbField === 'fechaEntrega' ? 'date' : dbField === 'metros' ? 'number' : 'text'
      };
    });
    
    setColumnMappings(initialMappings);
    setCurrentPhase('mapping');
  }, [pastedText]);

  // Procesar datos para importación
  const processImportData = useCallback(() => {
    if (!rawData.length) return;

    const dataRows = rawData.slice(headerRow + 1);
    const headers = rawData[headerRow] || [];
    
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
  }, [rawData, headerRow, columnMappings, globalFields, clientes, vendedores]);

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

  // Editar valor de celda
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

  // Estadísticas de validación
  const validationStats = useMemo(() => {
    const total = importRows.length;
    const valid = importRows.filter(row => row.validationErrors.length === 0).length;
    const errors = total - valid;
    return { total, valid, errors };
  }, [importRows]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Importación Masiva de Pedidos</h2>
            <p className="text-gray-600 mt-1">
              {currentPhase === 'input' && 'Paso 1 de 3: Pegar datos del Excel'}
              {currentPhase === 'mapping' && 'Paso 2 de 3: Mapear columnas y configurar campos'}
              {currentPhase === 'importing' && 'Paso 3 de 3: Revisar e importar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isImporting}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
              <span className="text-sm text-gray-600 min-w-16">
                {Math.round(importProgress)}%
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentPhase === 'input' && (
            <InputPhase
              pastedText={pastedText}
              setPastedText={setPastedText}
              onNext={handleProcessPastedData}
            />
          )}

          {currentPhase === 'mapping' && (
            <MappingPhase
              rawData={rawData}
              headerRow={headerRow}
              setHeaderRow={setHeaderRow}
              columnMappings={columnMappings}
              setColumnMappings={setColumnMappings}
              globalFields={globalFields}
              setGlobalFields={setGlobalFields}
              onNext={processImportData}
              onBack={() => setCurrentPhase('input')}
            />
          )}

          {currentPhase === 'importing' && (
            <ImportingPhase
              importRows={importRows}
              validationStats={validationStats}
              onCellEdit={handleCellEdit}
              onImport={executeImport}
              onBack={() => setCurrentPhase('mapping')}
              isImporting={isImporting}
              importResults={importResults}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ======================== FASE 1: INGESTA ========================
interface InputPhaseProps {
  pastedText: string;
  setPastedText: (text: string) => void;
  onNext: () => void;
}

function InputPhase({ pastedText, setPastedText, onNext }: InputPhaseProps) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Pegar datos del Excel</h3>
        <p className="text-gray-600 mb-4">
          Copie los datos del Excel (incluidos los encabezados) y péguelos en el área de texto. 
          El sistema detectará automáticamente el formato y las columnas.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 Consejos:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Seleccione todo el rango en Excel (incluidos encabezados) y cópielo (Ctrl+C)</li>
            <li>• El sistema reconoce formatos de fecha como "02/abr", "30/may"</li>
            <li>• Los números pueden usar punto para miles (10.000) y coma para decimales (0,914)</li>
            <li>• Si hay múltiples filas de encabezado, podrá seleccionar cuál usar en el siguiente paso</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Datos del Excel (Tab-separated):
        </label>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Pegue aquí los datos copiados del Excel..."
          className="flex-1 w-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={15}
        />
        
        {pastedText && (
          <div className="mt-4 text-sm text-gray-600">
            <strong>Vista previa:</strong> {pastedText.split('\n').length} filas detectadas
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!pastedText.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Procesar Datos <ArrowRightIcon className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </div>
  );
}

// ======================== FASE 2: MAPEO ========================
interface MappingPhaseProps {
  rawData: string[][];
  headerRow: number;
  setHeaderRow: (row: number) => void;
  columnMappings: ColumnMapping[];
  setColumnMappings: (mappings: ColumnMapping[]) => void;
  globalFields: Partial<Pedido>;
  setGlobalFields: (fields: Partial<Pedido>) => void;
  onNext: () => void;
  onBack: () => void;
}

function MappingPhase({
  rawData,
  headerRow,
  setHeaderRow,
  columnMappings,
  setColumnMappings,
  globalFields,
  setGlobalFields,
  onNext,
  onBack
}: MappingPhaseProps) {
  const handleMappingChange = (columnIndex: number, newDbField: keyof Pedido | 'ignore') => {
    const newMappings: ColumnMapping[] = [...columnMappings];
    if (newMappings[columnIndex]) {
      newMappings[columnIndex] = {
        ...newMappings[columnIndex],
        dbField: newDbField,
        transform: newDbField === 'fechaEntrega' ? 'date' : newDbField === 'metros' ? 'number' : 'text'
      };
    }
    setColumnMappings(newMappings);
  };

  const previewRows = rawData.slice(headerRow + 1, headerRow + 6); // Mostrar 5 filas

  return (
    <div className="p-6 h-full flex">
      {/* Área principal de mapeo */}
      <div className="flex-1 flex flex-col mr-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Mapear Columnas</h3>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium">Fila de encabezados:</label>
            <select
              value={headerRow}
              onChange={(e) => setHeaderRow(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {rawData.slice(0, 5).map((_, index) => (
                <option key={index} value={index}>
                  Fila {index + 1}: {rawData[index]?.slice(0, 3).join(', ')}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de mapeo */}
        <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {rawData[headerRow]?.map((header, index) => (
                  <th key={index} className="px-4 py-3 text-left">
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-gray-900">{header}</div>
                      <select
                        value={columnMappings[index]?.dbField || 'ignore'}
                        onChange={(e) => handleMappingChange(index, e.target.value as any)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
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
                <tr key={rowIndex} className="border-t border-gray-100">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 text-sm text-gray-600">
                      <div className="max-w-32 truncate" title={cell}>
                        {cell}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Vista previa de las primeras {previewRows.length} filas de {rawData.length - headerRow - 1} totales
        </div>
      </div>

      {/* Panel lateral de campos globales */}
      <div className="w-80 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-4">Campos Globales</h4>
        <p className="text-sm text-gray-600 mb-4">
          Establezca valores que se aplicarán a todas las filas importadas:
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Etapa Inicial:</label>
            <select
              value={globalFields.etapaActual || Etapa.PREPARACION}
              onChange={(e) => {
                const newFields: Partial<Pedido> = { ...globalFields, etapaActual: e.target.value as Etapa };
                setGlobalFields(newFields);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {GLOBAL_FIELD_OPTIONS.etapaActual.map(etapa => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prioridad:</label>
            <select
              value={globalFields.prioridad || Prioridad.NORMAL}
              onChange={(e) => {
                const newFields: Partial<Pedido> = { ...globalFields, prioridad: e.target.value as Prioridad };
                setGlobalFields(newFields);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {GLOBAL_FIELD_OPTIONS.prioridad.map(prioridad => (
                <option key={prioridad} value={prioridad}>{prioridad}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Impresión:</label>
            <select
              value={globalFields.tipoImpresion || TipoImpresion.SUPERFICIE}
              onChange={(e) => {
                const newFields: Partial<Pedido> = { ...globalFields, tipoImpresion: e.target.value as TipoImpresion };
                setGlobalFields(newFields);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {GLOBAL_FIELD_OPTIONS.tipoImpresion.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Máquina de Impresión:</label>
            <input
              type="text"
              value={globalFields.maquinaImpresion || ''}
              onChange={(e) => {
                const newFields: Partial<Pedido> = { ...globalFields, maquinaImpresion: e.target.value };
                setGlobalFields(newFields);
              }}
              placeholder="Ej: WM1, GIAVE..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> Atrás
          </button>
          <button
            onClick={onNext}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Continuar <ArrowRightIcon className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================== FASE 3: IMPORTACIÓN ========================
interface ImportingPhaseProps {
  importRows: ImportRow[];
  validationStats: { total: number; valid: number; errors: number };
  onCellEdit: (rowIndex: number, field: string, value: any) => void;
  onImport: () => void;
  onBack: () => void;
  isImporting: boolean;
  importResults: any;
}

function ImportingPhase({
  importRows,
  validationStats,
  onCellEdit,
  onImport,
  onBack,
  isImporting,
  importResults
}: ImportingPhaseProps) {
  if (importResults) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">¡Importación Completada!</h3>
          <p className="text-gray-600 mb-4">
            Se procesaron {validationStats.valid} pedidos correctamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Ver Pedidos Importados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Revisar e Importar</h3>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-green-600">✅ {validationStats.valid} filas válidas</span>
          {validationStats.errors > 0 && (
            <span className="text-red-600">❌ {validationStats.errors} con errores</span>
          )}
        </div>
      </div>

      {/* Tabla de revisión */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metros</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errores</th>
            </tr>
          </thead>
          <tbody>
            {importRows.map((row, index) => (
              <tr key={index} className={`border-t border-gray-100 ${row.validationErrors.length > 0 ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2">
                  {row.validationErrors.length === 0 ? (
                    <span className="text-green-600">✅</span>
                  ) : (
                    <span className="text-red-600">❌</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.mappedData.numeroPedidoCliente || ''}
                    onChange={(e) => onCellEdit(index, 'numeroPedidoCliente', e.target.value)}
                    className="w-full border-none bg-transparent text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.mappedData.cliente || ''}
                    onChange={(e) => onCellEdit(index, 'cliente', e.target.value)}
                    className="w-full border-none bg-transparent text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="date"
                    value={row.mappedData.fechaEntrega || ''}
                    onChange={(e) => onCellEdit(index, 'fechaEntrega', e.target.value)}
                    className="w-full border-none bg-transparent text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={row.mappedData.metros || ''}
                    onChange={(e) => onCellEdit(index, 'metros', Number(e.target.value))}
                    className="w-full border-none bg-transparent text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  {row.validationErrors.map((error, errorIndex) => (
                    <div key={errorIndex} className="text-xs text-red-600">
                      {error.message}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={onBack}
          disabled={isImporting}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> Atrás
        </button>

        <button
          onClick={onImport}
          disabled={isImporting || validationStats.valid === 0}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isImporting ? (
            <>
              <LoadingSpinnerIcon className="w-4 h-4 inline mr-2" />
              Importando...
            </>
          ) : (
            <>
              Importar {validationStats.valid} Pedidos
              <UploadIcon className="w-4 h-4 inline ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}