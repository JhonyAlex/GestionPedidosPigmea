import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Pedido } from '../types';
import { useClientesManager } from '../hooks/useClientesManager';
import { useVendedoresManager } from '../hooks/useVendedoresManager';

// ============================================================================
// TYPES
// ============================================================================

interface PdfImportConfig {
  id: string;
  name: string;
  description?: string;
  extractionRules: Record<string, ExtractionRule>;
  fieldMappings: Record<string, string>;
  clienteId?: string;
  clienteNombre?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface ExtractionRule {
  type: 'regex' | 'delimiter' | 'line_contains' | 'position';
  pattern?: string;
  startMarker?: string;
  endMarker?: string;
  contains?: string;
  offset?: number;
  extractPattern?: string;
  lineIndex?: number;
  startChar?: number;
  endChar?: number;
  group?: number;
}

interface ExtractedData {
  text: string;
  lines: string[];
  numPages: number;
  filename: string;
}

interface PdfImportModalProps {
  onClose: () => void;
  onImportComplete?: (result: any) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('pigmea_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return {
        'Content-Type': 'application/json',
        'x-user-id': String(user.id),
        'x-user-role': user.role || 'OPERATOR',
        'x-user-permissions': JSON.stringify(user.permissions || [])
      };
    }
  }
  return { 'Content-Type': 'application/json' };
};

// Campos del sistema disponibles para mapeo
const SYSTEM_FIELDS = [
  { value: 'ignore', label: '-- Ignorar --' },
  { value: 'numeroPedidoCliente', label: '🔢 Número de Pedido *', required: true },
  { value: 'cliente', label: '👤 Cliente *', required: true },
  { value: 'fechaEntrega', label: '📅 Fecha de Entrega *', required: true },
  { value: 'metros', label: '📏 Metros *', required: true },
  { value: 'ancho', label: '↔️ Ancho' },
  { value: 'nombreProducto', label: '📦 Nombre Producto' },
  { value: 'observaciones', label: '📝 Observaciones' },
  { value: 'vendedor', label: '💼 Vendedor' },
  { value: 'prioridad', label: '⚡ Prioridad' },
  { value: 'tipoImpresion', label: '🖨️ Tipo Impresión' },
  { value: 'numeroColores', label: '🎨 Número Colores' },
  { value: 'tratado', label: '✅ Tratado' },
  { value: 'solapa', label: '📐 Solapa' },
  { value: 'fuelle', label: '📦 Fuelle' },
  { value: 'confeccion', label: '🧵 Confección' },
  { value: 'perforado', label: '🔘 Perforado' },
];

// ============================================================================
// ICONS
// ============================================================================

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

const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

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

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
  </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

type Phase = 'upload' | 'mapping' | 'preview';

const PdfImportModal: React.FC<PdfImportModalProps> = ({ onClose, onImportComplete }) => {
  // State
  const [phase, setPhase] = useState<Phase>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PDF Data
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Configs
  const [savedConfigs, setSavedConfigs] = useState<PdfImportConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [isNewConfig, setIsNewConfig] = useState(true);
  
  // Extraction Rules & Mappings
  const [extractionRules, setExtractionRules] = useState<Record<string, ExtractionRule>>({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [extractedFields, setExtractedFields] = useState<Record<string, string>>({});
  
  // Preview Data
  const [previewData, setPreviewData] = useState<Partial<Pedido> | null>(null);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] }>({
    isValid: false,
    errors: [],
    warnings: []
  });
  
  // Config saving
  const [showSaveConfigModal, setShowSaveConfigModal] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigDescription, setNewConfigDescription] = useState('');
  
  // Import result
  const [importResult, setImportResult] = useState<any>(null);
  
  // Hooks
  const { clientes } = useClientesManager();
  const { vendedores } = useVendedoresManager();
  
  // ========================================================================
  // LOAD SAVED CONFIGS
  // ========================================================================
  
  useEffect(() => {
    loadSavedConfigs();
  }, []);
  
  const loadSavedConfigs = async () => {
    try {
      const response = await fetch('/api/pdf/configs', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSavedConfigs(data.configs || []);
      }
    } catch (err) {
      console.error('Error loading PDF configs:', err);
    }
  };
  
  // ========================================================================
  // FILE UPLOAD HANDLERS
  // ========================================================================
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      uploadPdf(files[0]);
    } else {
      setError('Por favor, sube un archivo PDF válido');
    }
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadPdf(files[0]);
    }
  }, []);
  
  const uploadPdf = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      // Get auth headers without Content-Type (FormData sets it automatically)
      const authHeaders: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('pigmea_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          authHeaders['x-user-id'] = String(user.id);
          authHeaders['x-user-role'] = user.role || 'OPERATOR';
          authHeaders['x-user-permissions'] = JSON.stringify(user.permissions || []);
        }
      }
      
      const response = await fetch('/api/pdf/upload', {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el PDF');
      }
      
      const data = await response.json();
      
      setExtractedData({
        text: data.text,
        lines: data.lines,
        numPages: data.numPages,
        filename: data.filename
      });
      
      // If a config is selected, apply it automatically
      if (selectedConfigId && !isNewConfig) {
        const config = savedConfigs.find(c => c.id === selectedConfigId);
        if (config) {
          setExtractionRules(config.extractionRules);
          setFieldMappings(config.fieldMappings);
          // Auto-extract with saved rules
          await applyRulesAndExtract(data.text, data.lines, config.extractionRules, config.fieldMappings);
        }
      }
      
      setPhase('mapping');
      
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ========================================================================
  // EXTRACTION & MAPPING
  // ========================================================================
  
  const applyRulesAndExtract = async (
    text: string, 
    lines: string[], 
    rules: Record<string, ExtractionRule>,
    mappings: Record<string, string>
  ) => {
    try {
      const response = await fetch('/api/pdf/preview', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text, lines, rules, fieldMappings: mappings })
      });
      
      if (response.ok) {
        const data = await response.json();
        setExtractedFields(data.extracted);
        setPreviewData(data.pedidoData);
        setValidation(data.validation);
      }
    } catch (err) {
      console.error('Error applying rules:', err);
    }
  };
  
  const handleAddRule = (fieldName: string) => {
    setExtractionRules(prev => ({
      ...prev,
      [fieldName]: {
        type: 'line_contains',
        contains: '',
        offset: 0
      }
    }));
    setFieldMappings(prev => ({
      ...prev,
      [fieldName]: 'ignore'
    }));
  };
  
  const handleUpdateRule = (fieldName: string, rule: ExtractionRule) => {
    setExtractionRules(prev => ({
      ...prev,
      [fieldName]: rule
    }));
  };
  
  const handleUpdateMapping = (fieldName: string, systemField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldName]: systemField
    }));
  };
  
  const handleRemoveRule = (fieldName: string) => {
    setExtractionRules(prev => {
      const newRules = { ...prev };
      delete newRules[fieldName];
      return newRules;
    });
    setFieldMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[fieldName];
      return newMappings;
    });
    setExtractedFields(prev => {
      const newFields = { ...prev };
      delete newFields[fieldName];
      return newFields;
    });
  };
  
  const handleTestExtraction = async () => {
    if (!extractedData) return;
    
    setIsLoading(true);
    try {
      await applyRulesAndExtract(
        extractedData.text,
        extractedData.lines,
        extractionRules,
        fieldMappings
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // ========================================================================
  // CONFIG SAVE/LOAD
  // ========================================================================
  
  const handleSelectConfig = (configId: string) => {
    setSelectedConfigId(configId);
    if (configId === '') {
      setIsNewConfig(true);
      setExtractionRules({});
      setFieldMappings({});
    } else {
      setIsNewConfig(false);
      const config = savedConfigs.find(c => c.id === configId);
      if (config) {
        setExtractionRules(config.extractionRules);
        setFieldMappings(config.fieldMappings);
      }
    }
  };
  
  const handleSaveConfig = async () => {
    if (!newConfigName.trim()) {
      setError('El nombre de la configuración es requerido');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/pdf/configs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newConfigName.trim(),
          description: newConfigDescription.trim(),
          extractionRules,
          fieldMappings
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedConfigs(prev => [...prev, data.config]);
        setSelectedConfigId(data.config.id);
        setIsNewConfig(false);
        setShowSaveConfigModal(false);
        setNewConfigName('');
        setNewConfigDescription('');
      } else {
        throw new Error('Error al guardar la configuración');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta configuración?')) return;
    
    try {
      const response = await fetch(`/api/pdf/configs/${configId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setSavedConfigs(prev => prev.filter(c => c.id !== configId));
        if (selectedConfigId === configId) {
          setSelectedConfigId('');
          setIsNewConfig(true);
        }
      }
    } catch (err) {
      console.error('Error deleting config:', err);
    }
  };
  
  // ========================================================================
  // IMPORT
  // ========================================================================
  
  const handleImport = async () => {
    if (!previewData || !validation.isValid) {
      setError('Los datos no son válidos para importar');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Crear pedido usando el endpoint existente de import-batch
      const importRow = {
        originalData: extractedFields,
        mappedData: previewData,
        validationErrors: [],
        rowIndex: 0,
        status: 'pending' as const
      };
      
      const response = await fetch('/api/pedidos/import-batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          rows: [importRow],
          globalFields: {},
          options: { createMissingClients: true }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al importar el pedido');
      }
      
      const result = await response.json();
      
      // Incrementar uso de config si se usó una guardada
      if (selectedConfigId) {
        fetch(`/api/pdf/configs/${selectedConfigId}/use`, {
          method: 'POST',
          headers: getAuthHeaders()
        }).catch(() => {});
      }
      
      setImportResult(result);
      setPhase('preview');
      
      if (onImportComplete) {
        onImportComplete(result);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al importar');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ========================================================================
  // RENDER HELPERS
  // ========================================================================
  
  const renderUploadPhase = () => (
    <div className="p-6 space-y-6">
      {/* Config selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Configuración de Mapeo
        </label>
        <div className="flex gap-2">
          <select
            value={selectedConfigId}
            onChange={(e) => handleSelectConfig(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Nueva configuración --</option>
            {savedConfigs.map(config => (
              <option key={config.id} value={config.id}>
                {config.name} {config.usageCount > 0 ? `(${config.usageCount} usos)` : ''}
              </option>
            ))}
          </select>
          {selectedConfigId && (
            <button
              onClick={() => handleDeleteConfig(selectedConfigId)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Eliminar configuración"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        {!isNewConfig && selectedConfigId && (
          <p className="mt-1 text-sm text-gray-500">
            ✓ Se aplicará automáticamente al subir el PDF
          </p>
        )}
      </div>
      
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <DocumentIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        
        <p className="text-lg font-medium text-gray-700 mb-2">
          Arrastra un archivo PDF aquí
        </p>
        <p className="text-sm text-gray-500 mb-4">
          o haz clic para seleccionar un archivo
        </p>
        
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UploadIcon className="w-5 h-5" />
          Seleccionar PDF
        </button>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <LoadingSpinner />
          <span>Procesando PDF...</span>
        </div>
      )}
    </div>
  );
  
  const renderMappingPhase = () => (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <div className="px-6 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Archivo: </span>
            <span className="font-medium">{extractedData?.filename}</span>
            <span className="text-sm text-gray-500 ml-2">({extractedData?.numPages} páginas, {extractedData?.lines.length} líneas)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveConfigModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <SaveIcon className="w-4 h-4" />
              Guardar Config
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content - split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - PDF text */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="px-4 py-2 bg-gray-100 border-b">
            <h3 className="font-medium text-gray-700">Texto del PDF</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 leading-relaxed">
              {extractedData?.lines.map((line, i) => (
                <div key={i} className="hover:bg-yellow-100 px-1">
                  <span className="text-gray-400 select-none mr-2">{String(i + 1).padStart(3, ' ')}:</span>
                  {line}
                </div>
              ))}
            </pre>
          </div>
        </div>
        
        {/* Right panel - Field mapping */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-2 bg-gray-100 border-b flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Reglas de Extracción</h3>
            <button
              onClick={() => handleAddRule(`campo_${Object.keys(extractionRules).length + 1}`)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusIcon className="w-3 h-3" />
              Añadir Campo
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {Object.entries(extractionRules).map(([fieldName, rule]) => (
              <div key={fieldName} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const newRules = { ...extractionRules };
                      const newMappings = { ...fieldMappings };
                      delete newRules[fieldName];
                      delete newMappings[fieldName];
                      newRules[newName] = rule;
                      newMappings[newName] = fieldMappings[fieldName] || 'ignore';
                      setExtractionRules(newRules);
                      setFieldMappings(newMappings);
                    }}
                    className="font-medium text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                    placeholder="Nombre del campo"
                  />
                  <button
                    onClick={() => handleRemoveRule(fieldName)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Rule type selector */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <select
                    value={rule.type}
                    onChange={(e) => handleUpdateRule(fieldName, { ...rule, type: e.target.value as ExtractionRule['type'] })}
                    className="rounded border border-gray-300 px-2 py-1"
                  >
                    <option value="line_contains">Línea contiene...</option>
                    <option value="regex">Expresión Regular</option>
                    <option value="delimiter">Entre delimitadores</option>
                    <option value="position">Por posición</option>
                  </select>
                  
                  <select
                    value={fieldMappings[fieldName] || 'ignore'}
                    onChange={(e) => handleUpdateMapping(fieldName, e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1"
                  >
                    {SYSTEM_FIELDS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Rule-specific inputs */}
                {rule.type === 'line_contains' && (
                  <div className="space-y-1 text-xs">
                    <input
                      type="text"
                      value={rule.contains || ''}
                      onChange={(e) => handleUpdateRule(fieldName, { ...rule, contains: e.target.value })}
                      placeholder="Texto que contiene la línea (ej: 'Pedido:')"
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={rule.offset || 0}
                        onChange={(e) => handleUpdateRule(fieldName, { ...rule, offset: parseInt(e.target.value) || 0 })}
                        placeholder="Offset"
                        className="w-20 rounded border border-gray-300 px-2 py-1"
                      />
                      <span className="text-gray-500 self-center">líneas después</span>
                    </div>
                  </div>
                )}
                
                {rule.type === 'regex' && (
                  <input
                    type="text"
                    value={rule.pattern || ''}
                    onChange={(e) => handleUpdateRule(fieldName, { ...rule, pattern: e.target.value })}
                    placeholder="Patrón regex (ej: 'Pedido:\s*(\d+)')"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                  />
                )}
                
                {rule.type === 'delimiter' && (
                  <div className="space-y-1 text-xs">
                    <input
                      type="text"
                      value={rule.startMarker || ''}
                      onChange={(e) => handleUpdateRule(fieldName, { ...rule, startMarker: e.target.value })}
                      placeholder="Texto inicial (ej: 'Cliente:')"
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                    <input
                      type="text"
                      value={rule.endMarker || ''}
                      onChange={(e) => handleUpdateRule(fieldName, { ...rule, endMarker: e.target.value })}
                      placeholder="Texto final (opcional, ej: 'Fecha:')"
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </div>
                )}
                
                {rule.type === 'position' && (
                  <div className="flex gap-2 text-xs">
                    <input
                      type="number"
                      value={rule.lineIndex || 0}
                      onChange={(e) => handleUpdateRule(fieldName, { ...rule, lineIndex: parseInt(e.target.value) || 0 })}
                      placeholder="Línea"
                      className="w-16 rounded border border-gray-300 px-2 py-1"
                    />
                    <input
                      type="number"
                      value={rule.startChar || 0}
                      onChange={(e) => handleUpdateRule(fieldName, { ...rule, startChar: parseInt(e.target.value) || 0 })}
                      placeholder="Desde"
                      className="w-16 rounded border border-gray-300 px-2 py-1"
                    />
                    <input
                      type="number"
                      value={rule.endChar || ''}
                      onChange={(e) => handleUpdateRule(fieldName, { ...rule, endChar: parseInt(e.target.value) || undefined })}
                      placeholder="Hasta"
                      className="w-16 rounded border border-gray-300 px-2 py-1"
                    />
                  </div>
                )}
                
                {/* Extracted value preview */}
                {extractedFields[fieldName] && (
                  <div className="mt-2 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
                    <span className="text-green-700">Valor: </span>
                    <span className="font-medium text-green-800">{extractedFields[fieldName]}</span>
                  </div>
                )}
              </div>
            ))}
            
            {Object.keys(extractionRules).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay reglas de extracción configuradas.</p>
                <p className="text-sm mt-1">Haz clic en "Añadir Campo" para comenzar.</p>
              </div>
            )}
          </div>
          
          {/* Test extraction button */}
          <div className="px-4 py-3 border-t bg-gray-50">
            <button
              onClick={handleTestExtraction}
              disabled={isLoading || Object.keys(extractionRules).length === 0}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isLoading ? <LoadingSpinner className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
              Probar Extracción
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview section */}
      {previewData && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="font-medium text-gray-700 mb-3">Vista Previa del Pedido</h4>
          
          {/* Validation messages */}
          {validation.errors.length > 0 && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-700 text-sm">Errores:</p>
              <ul className="list-disc list-inside text-sm text-red-600">
                {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-medium text-yellow-700 text-sm">Advertencias:</p>
              <ul className="list-disc list-inside text-sm text-yellow-600">
                {validation.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
              </ul>
            </div>
          )}
          
          {/* Preview table */}
          <div className="grid grid-cols-4 gap-3 text-sm">
            {Object.entries(previewData).map(([key, value]) => (
              <div key={key} className="bg-white p-2 rounded border">
                <span className="text-gray-500 text-xs">{key}:</span>
                <p className="font-medium truncate">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const renderPreviewPhase = () => (
    <div className="p-6 text-center">
      {importResult ? (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">¡Importación Exitosa!</h3>
          <p className="text-gray-600">
            Se ha importado {importResult.created || 1} pedido correctamente.
          </p>
          {importResult.results && importResult.results[0] && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-sm text-gray-600">Número de pedido:</p>
              <p className="font-semibold text-lg">{importResult.results[0].numeroPedidoCliente}</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <div className="py-8">
          <LoadingSpinner className="w-12 h-12 mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Importando pedido...</p>
        </div>
      )}
    </div>
  );
  
  // ========================================================================
  // MAIN RENDER
  // ========================================================================
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Importar Pedido desde PDF</h2>
          </div>
          
          {/* Phase indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${phase === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              1. Subir
            </span>
            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            <span className={`px-3 py-1 rounded-full ${phase === 'mapping' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              2. Mapear
            </span>
            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            <span className={`px-3 py-1 rounded-full ${phase === 'preview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              3. Importar
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {phase === 'upload' && renderUploadPhase()}
          {phase === 'mapping' && renderMappingPhase()}
          {phase === 'preview' && renderPreviewPhase()}
        </div>
        
        {/* Footer */}
        {phase !== 'preview' && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <button
              onClick={() => phase === 'mapping' ? setPhase('upload') : onClose}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {phase === 'mapping' ? 'Volver' : 'Cancelar'}
            </button>
            
            {phase === 'mapping' && (
              <button
                onClick={handleImport}
                disabled={isLoading || !validation.isValid}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isLoading ? <LoadingSpinner className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
                Importar Pedido
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Save Config Modal */}
      {showSaveConfigModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Guardar Configuración</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  placeholder="Ej: Formato Cliente X"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  placeholder="Descripción opcional..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveConfigModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={isLoading || !newConfigName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? <LoadingSpinner className="w-4 h-4" /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfImportModal;
