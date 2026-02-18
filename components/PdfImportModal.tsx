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

// Campos del sistema disponibles para mapeo (basados en el tipo Pedido real)
const SYSTEM_FIELDS = [
  { value: 'ignore', label: '-- Ignorar --' },
  
  // ========== CAMPOS OBLIGATORIOS ==========
  { value: 'numeroPedidoCliente', label: '🔢 Número de Pedido Cliente *', required: true },
  { value: 'cliente', label: '👤 Cliente *', required: true },
  { value: 'fechaEntrega', label: '📅 Fecha de Entrega *', required: true },
  { value: 'metros', label: '📏 Metros *', required: true },
  
  // ========== INFORMACIÓN BÁSICA ==========
  { value: 'maquinaImpresion', label: '🖨️ Máquina de Impresión' },
  { value: 'prioridad', label: '⚡ Prioridad' },
  { value: 'tipoImpresion', label: '🎨 Tipo de Impresión' },
  { value: 'desarrollo', label: '📐 Desarrollo' },
  { value: 'capa', label: '📑 Capa' },
  { value: 'producto', label: '📦 Producto' },
  { value: 'observaciones', label: '📝 Observaciones' },
  { value: 'observacionesMaterial', label: '📝 Observaciones Material' },
  { value: 'observacionesRapidas', label: '⚡ Observaciones Rápidas' },
  
  // ========== VENDEDOR ==========
  { value: 'vendedorNombre', label: '💼 Comercial' },
  
  // ========== FECHAS ==========
  { value: 'nuevaFechaEntrega', label: '📅 Nueva Fecha Entrega' },
  { value: 'compraCliche', label: '📅 Compra Cliché' },
  { value: 'recepcionCliche', label: '📅 Recepción Cliché' },
  
  // ========== MATERIAL Y PREPARACIÓN ==========
  { value: 'estadoCliché', label: '🔧 Estado Cliché' },
  { value: 'clicheInfoAdicional', label: 'ℹ️ Info Adicional Cliché' },
  { value: 'camisa', label: '👔 Camisa' },
  
  // ========== CARACTERÍSTICAS ESPECIALES ==========
  { value: 'antivaho', label: '💧 Antivaho' },
  { value: 'antivahoRealizado', label: '✅ Antivaho Realizado' },
  { value: 'anonimoPostImpresion', label: '🎭 Anónimo Post-Impresión' },
  { value: 'microperforado', label: '🔘 Microperforado' },
  { value: 'macroperforado', label: '⚫ Macroperforado' },
  { value: 'anonimo', label: '🎭 Anónimo' },
  
  // ========== BOBINAS ==========
  { value: 'bobinaMadre', label: '⭕ Bobina Madre (mm)' },
  { value: 'bobinaFinal', label: '⚪ Bobina Final (mm)' },
  
  // ========== PRODUCCIÓN ==========
  { value: 'velocidadPosible', label: '⚡ Velocidad Posible (m/min)' },
  { value: 'tiempoProduccionDecimal', label: '⏱️ Tiempo Producción (decimal)' },
  { value: 'colores', label: '🎨 Número de Colores' },
  { value: 'minAdap', label: '⏰ Minutos Adaptación' },
  { value: 'minColor', label: '⏰ Minutos por Color' },
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
  
  // ✨ NUEVOS ESTADOS para el sistema visual de selección
  const [selectedText, setSelectedText] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  
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
  // BLOQUEAR SCROLL DEL BODY
  // ========================================================================
  
  useEffect(() => {
    // Bloquear scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    return () => {
      // Restaurar scroll al cerrar
      document.body.style.overflow = 'unset';
    };
  }, []);
  
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
  // ✨ NUEVO SISTEMA VISUAL DE SELECCIÓN
  // ========================================================================
  
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };
  
  const assignTextToField = (fieldName: string, systemField: string) => {
    if (!selectedText) {
      alert('Por favor, selecciona texto del PDF primero');
      return;
    }
    
    // Limpiar el valor según el tipo de campo
    let cleanedValue = selectedText;
    
    // Para el campo metros: eliminar punto como separador de miles
    // Ejemplo: "1.000" → "1000"
    if (fieldName === 'metros') {
      cleanedValue = selectedText.replace(/\./g, '');
    }
    
    // Guardar el texto extraído para este campo
    setExtractedFields(prev => ({
      ...prev,
      [fieldName]: cleanedValue
    }));
    
    // Actualizar el mapeo
    setFieldMappings(prev => ({
      ...prev,
      [fieldName]: systemField
    }));
    
    // Limpiar selección
    setSelectedText('');
    setActiveField(null);
    
    // Actualizar preview automáticamente si hay datos suficientes
    const updatedFields = {
      ...extractedFields,
      [fieldName]: cleanedValue
    };
    
    // Crear objeto de datos del pedido
    const pedidoData: Partial<Pedido> = {};
    Object.entries(updatedFields).forEach(([key, value]) => {
      if (value && value.trim()) {
        (pedidoData as any)[key] = value.trim();
      }
    });
    
    setPreviewData(pedidoData);
    
    // Validar
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!pedidoData.numeroPedidoCliente) errors.push('Falta el número de pedido');
    if (!pedidoData.cliente) errors.push('Falta el cliente');
    if (!pedidoData.fechaEntrega) errors.push('Falta la fecha de entrega');
    if (!pedidoData.metros) errors.push('Faltan los metros');
    
    if (Object.keys(updatedFields).length < 4) {
      warnings.push('Hay pocos campos asignados. Considera agregar más información.');
    }
    
    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  };
  
  // ========================================================================
  // EXTRACTION & MAPPING (ANTIGUO - MANTENER PARA COMPATIBILIDAD)
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
      setError('El nombre de la plantilla es requerido');
      return;
    }
    
    // Validar que haya al menos algunos campos mapeados
    if (Object.keys(extractedFields).length === 0) {
      setError('Debes asignar al menos un campo antes de guardar la plantilla');
      return;
    }
    
    setIsLoading(true);
    try {
      // Guardar solo los mappings (qué campo del PDF va a qué campo del sistema)
      // No guardamos reglas técnicas porque ahora el usuario selecciona manualmente
      const response = await fetch('/api/pdf/configs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newConfigName.trim(),
          description: newConfigDescription.trim(),
          extractionRules: {}, // Vacío porque ya no usamos reglas automáticas
          fieldMappings: fieldMappings, // Mantener los mapeos para referencia
          // Nuevo: guardar los campos que el usuario ya mapeó para pre-llenarlos
          savedFields: extractedFields
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
        alert('✅ Plantilla guardada correctamente');
      } else {
        throw new Error('Error al guardar la plantilla');
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
    <div className="p-6 space-y-6 overflow-y-auto">
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
      
      {/* Instrucciones mejoradas */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Cómo funciona el nuevo sistema:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Sube un PDF de un pedido</li>
          <li>Selecciona el texto que quieras asignar (como seleccionar texto para copiar)</li>
          <li>Haz clic en el botón "Asignar" del campo correspondiente</li>
          <li>Revisa la vista previa y confirma la importación</li>
        </ol>
        <p className="text-xs text-blue-700 mt-2 italic">
          ✨ ¡Mucho más fácil! Ya no necesitas saber de expresiones regulares ni reglas técnicas.
        </p>
      </div>
    </div>
  );
  
  const renderMappingPhase = () => (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Archivo: </span>
            <span className="font-medium">{extractedData?.filename}</span>
            <span className="text-sm text-gray-500 ml-2">({extractedData?.numPages} páginas)</span>
          </div>
          <div className="flex items-center gap-3">
            {selectedText && (
              <div className="px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded-lg text-sm">
                <span className="text-yellow-800 font-medium">✓ Texto seleccionado: </span>
                <span className="text-yellow-900">{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}</span>
              </div>
            )}
            <button
              onClick={() => setShowSaveConfigModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <SaveIcon className="w-4 h-4" />
              Guardar Plantilla
            </button>
          </div>
        </div>
        
        {/* Instrucciones */}
        <div className="mt-2 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>📌 Cómo usar:</strong> Selecciona el texto del PDF y luego haz clic en el botón "Asignar" del campo donde quieres que vaya ese dato.
          </p>
        </div>
      </div>
      
      {/* Main content - split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - PDF text */}
        <div className="w-1/2 border-r flex flex-col bg-gray-50">
          <div className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border-b">
            <h3 className="font-semibold text-gray-800">📄 Contenido del PDF</h3>
            <p className="text-xs text-gray-600 mt-1">Selecciona el texto que quieras asignar a un campo</p>
          </div>
          <div 
            className="flex-1 overflow-auto p-4"
            onMouseUp={handleTextSelection}
          >
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <pre className="text-sm whitespace-pre-wrap text-gray-800 leading-relaxed font-sans select-text">
                {extractedData?.text}
              </pre>
            </div>
          </div>
        </div>
        
        {/* Right panel - Field mapping (NUEVO DISEÑO SIMPLE) */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 border-b">
            <h3 className="font-semibold text-gray-800">🎯 Campos del Pedido</h3>
            <p className="text-xs text-gray-600 mt-1">Haz clic en "Asignar" después de seleccionar texto</p>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {/* CAMPOS OBLIGATORIOS */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Campos Obligatorios</h4>
              
              {SYSTEM_FIELDS.filter(f => f.required).map(field => (
                <div key={field.value} className="mb-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-800">{field.label}</label>
                      {extractedFields[field.value] && (
                        <div className="mt-1 px-2 py-1 bg-white border border-green-300 rounded text-xs">
                          <span className="text-green-700 font-semibold">✓ </span>
                          <span className="text-gray-800">{extractedFields[field.value]}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!selectedText) {
                          alert('⚠️ Primero selecciona el texto del PDF que quieres asignar a este campo');
                          return;
                        }
                        assignTextToField(field.value, field.value);
                      }}
                      className={`ml-3 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        selectedText 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {extractedFields[field.value] ? '✓ Reasignar' : '← Asignar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* CAMPOS OPCIONALES (COLAPSABLES) */}
            <details className="mb-4">
              <summary className="cursor-pointer text-xs font-semibold text-gray-500 uppercase mb-2 hover:text-gray-700 select-none">
                + Campos Opcionales (click para expandir)
              </summary>
              
              <div className="mt-2 space-y-2">
                {SYSTEM_FIELDS.filter(f => !f.required && f.value !== 'ignore').map(field => (
                  <div key={field.value} className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">{field.label}</label>
                        {extractedFields[field.value] && (
                          <div className="mt-1 px-2 py-1 bg-white border border-green-300 rounded text-xs">
                            <span className="text-green-700 font-semibold">✓ </span>
                            <span className="text-gray-800">{extractedFields[field.value]}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {extractedFields[field.value] && (
                          <button
                            onClick={() => {
                              const newFields = { ...extractedFields };
                              delete newFields[field.value];
                              setExtractedFields(newFields);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="Borrar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!selectedText) {
                              alert('⚠️ Primero selecciona el texto del PDF que quieres asignar a este campo');
                              return;
                            }
                            assignTextToField(field.value, field.value);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedText 
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {extractedFields[field.value] ? '↻' : '←'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
          
          {/* Test extraction button - AHORA GENERA VISTA PREVIA AUTOMÁTICA */}
          <div className="px-4 py-3 border-t bg-gradient-to-r from-green-50 to-emerald-50">
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  // Crear objeto de datos del pedido basado en los campos extraídos
                  const pedidoData: Partial<Pedido> = {};
                  
                  // Mapear cada campo extraído al campo del sistema
                  Object.entries(extractedFields).forEach(([fieldKey, value]) => {
                    if (value && value.trim()) {
                      (pedidoData as any)[fieldKey] = value.trim();
                    }
                  });
                  
                  setPreviewData(pedidoData);
                  
                  // Validar los datos
                  const errors: string[] = [];
                  const warnings: string[] = [];
                  
                  if (!pedidoData.numeroPedidoCliente) errors.push('Falta el número de pedido');
                  if (!pedidoData.cliente) errors.push('Falta el cliente');
                  if (!pedidoData.fechaEntrega) errors.push('Falta la fecha de entrega');
                  if (!pedidoData.metros) errors.push('Faltan los metros');
                  
                  if (Object.keys(extractedFields).length < 4) {
                    warnings.push('Hay pocos campos asignados. Considera agregar más información.');
                  }
                  
                  setValidation({
                    isValid: errors.length === 0,
                    errors,
                    warnings
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading || Object.keys(extractedFields).length === 0}
              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2 font-semibold shadow-lg transition-all"
            >
              {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />}
              {Object.keys(extractedFields).length > 0 ? 'Ver Vista Previa' : 'Asigna campos primero'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview section - MEJORADO */}
      {previewData && (
        <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 p-4">
          <h4 className="font-semibold text-gray-800 mb-3 text-lg">📋 Vista Previa del Pedido</h4>
          
          {/* Validation messages */}
          {validation.errors.length > 0 && (
            <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
              <p className="font-semibold text-red-700 text-sm flex items-center gap-2">
                <span className="text-xl">⚠️</span> Errores que debes corregir:
              </p>
              <ul className="list-disc list-inside text-sm text-red-600 mt-2 space-y-1">
                {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-sm">
              <p className="font-semibold text-yellow-700 text-sm flex items-center gap-2">
                <span className="text-xl">💡</span> Sugerencias:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-600 mt-2 space-y-1">
                {validation.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
              </ul>
            </div>
          )}
          
          {validation.isValid && (
            <div className="mb-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm">
              <p className="font-semibold text-green-700 text-sm flex items-center gap-2">
                <span className="text-xl">✅</span> ¡Datos válidos! Puedes importar este pedido.
              </p>
            </div>
          )}
          
          {/* Preview table - MEJORADA */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {Object.entries(previewData)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => (
                <div key={key} className="bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-all shadow-sm">
                  <span className="text-gray-500 text-xs font-medium uppercase block mb-1">{key}:</span>
                  <p className="font-semibold text-gray-900 truncate">{String(value)}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const renderPreviewPhase = () => (
    <div className="p-6 text-center overflow-y-auto">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-4 flex flex-col max-h-[calc(100vh-2rem)]">
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
            <h3 className="text-lg font-semibold mb-2">💾 Guardar Plantilla de Mapeo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Guarda los campos que has mapeado para reutilizarlos en futuros PDFs similares.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la plantilla *</label>
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  placeholder="Ej: Pedidos Cliente ABC"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  placeholder="Para qué tipo de PDFs es esta plantilla..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Mostrar resumen de campos mapeados */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Campos a guardar:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  {Object.keys(extractedFields).map(field => (
                    <li key={field} className="flex items-center gap-1">
                      <span className="text-blue-600">✓</span> {field}
                    </li>
                  ))}
                </ul>
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {isLoading ? <LoadingSpinner className="w-4 h-4" /> : <><SaveIcon className="w-4 h-4" /> Guardar Plantilla</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfImportModal;
