import React, { useEffect, useState } from 'react';
import { Pedido } from '../types';

interface SeccionDatosTecnicosProps {
    formData: Partial<Pedido>;
    onDataChange: (field: keyof Pedido, value: any) => void;
    isReadOnly?: boolean;
    handleChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const SeccionDatosTecnicosDeMaterial: React.FC<SeccionDatosTecnicosProps> = ({ 
    formData, 
    onDataChange, 
    isReadOnly = false,
    handleChange 
}) => {
    // Estado local para mantener el texto de densidad mientras se edita
    const [densidadTexts, setDensidadTexts] = useState<{ [key: number]: string }>({});

    // Verificar si todos los materiales están recibidos
    const checkAllMaterialsReceived = () => {
        if (!formData.materialConsumoCantidad) {
            return false;
        }
        
        const materialConsumo = formData.materialConsumo || [];
        
        // Verificar que todos los materiales tengan recibido === true
        for (let i = 0; i < formData.materialConsumoCantidad; i++) {
            if (!materialConsumo[i]?.recibido) {
                return false;
            }
        }
        
        return true;
    };

    // Efecto para sincronizar materialDisponible cuando todos los checkboxes están marcados
    useEffect(() => {
        const allReceived = checkAllMaterialsReceived();
        
        // Solo actualizar si hay cambio
        if (allReceived && !formData.materialDisponible) {
            onDataChange('materialDisponible', true);
        } else if (!allReceived && formData.materialDisponible && formData.materialConsumoCantidad && formData.materialConsumoCantidad > 0) {
            // Solo desmarcar si hay materiales definidos y no todos están recibidos
            onDataChange('materialDisponible', false);
        }
    }, [formData.materialConsumo, formData.materialConsumoCantidad]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let parsedValue: string | number | null = value;

        if (e.target.type === 'number') {
            parsedValue = value === '' ? null : parseFloat(value);
        }

        onDataChange(name as keyof Pedido, parsedValue);
    };

    const handleNestedArrayChange = (
        arrayName: 'materialCapas' | 'materialConsumo',
        index: number,
        field: string,
        value: string | boolean
    ) => {
        const array = formData[arrayName] ? [...(formData[arrayName] as any[])] : [];
        let parsedValue: string | number | boolean | null;

        if (field === 'recibido' && typeof value === 'boolean') {
            parsedValue = value;
        } else if (field === 'recibido') {
            parsedValue = value === 'true' || value === true;
        } else if (field === 'densidad') {
            // Para densidad, permitir entrada libre con decimales
            const stringValue = value as string;
            
            // Si está vacío, guardar null
            if (stringValue === '') {
                parsedValue = null;
            } else {
                // Permitir números con punto o coma como separador decimal
                // Validar formato: permite números como: 0, 0., 0.9, 0,03, 123.456, etc.
                const isValidFormat = /^-?\d*[.,]?\d*$/.test(stringValue);
                
                if (isValidFormat) {
                    // Reemplazar coma por punto para el almacenamiento
                    const normalizedValue = stringValue.replace(',', '.');
                    
                    // Si termina en punto o es solo un guión, guardar como está (estado intermedio)
                    if (normalizedValue.endsWith('.') || normalizedValue === '-' || normalizedValue === '') {
                        parsedValue = null; // Temporalmente null hasta que complete el número
                    } else {
                        const parsed = parseFloat(normalizedValue);
                        parsedValue = isNaN(parsed) ? null : parsed;
                    }
                } else {
                    // Si el formato no es válido, no actualizar
                    return;
                }
            }
        } else if (field === 'micras' || field === 'necesario') {
            // Para micras y necesario, parsear como número
            parsedValue = value === '' ? null : parseFloat(value as string);
        } else {
            parsedValue = value === '' ? null : parseFloat(value as string);
        }

        if (!array[index]) array[index] = {};
        array[index][field] = parsedValue;

        // Notificar el cambio del array completo
        onDataChange(arrayName, array);
    };

    const handleNumeroCompraChange = (index: number, value: string) => {
        const numerosCompra = formData.numerosCompra ? [...formData.numerosCompra] : [];
        
        // Asegurarse de que el array tiene el tamaño correcto
        while (numerosCompra.length <= index) {
            numerosCompra.push('');
        }
        
        numerosCompra[index] = value;
        
        onDataChange('numerosCompra', numerosCompra);
    };

    // Handler especial para densidad que mantiene el texto durante la edición
    const handleDensidadChange = (index: number, value: string) => {
        // Validar que solo contenga números, punto o coma
        const isValidInput = /^-?\d*[.,]?\d*$/.test(value) || value === '';
        
        if (!isValidInput) {
            return; // No permitir caracteres inválidos
        }
        
        // Actualizar el estado local con el texto exacto
        setDensidadTexts(prev => ({
            ...prev,
            [index]: value
        }));
    };

    // Handler para cuando se pierde el foco del campo densidad
    const handleDensidadBlur = (index: number) => {
        const textValue = densidadTexts[index];
        
        if (!textValue || textValue === '') {
            // Si está vacío, actualizar como null
            handleNestedArrayChange('materialConsumo', index, 'densidad', '');
            return;
        }
        
        // Normalizar el valor (reemplazar coma por punto)
        const normalizedValue = textValue.replace(',', '.');
        const parsed = parseFloat(normalizedValue);
        
        if (!isNaN(parsed)) {
            // Actualizar el formData con el valor parseado
            const array = formData.materialConsumo ? [...formData.materialConsumo] : [];
            if (!array[index]) array[index] = {};
            array[index].densidad = parsed;
            onDataChange('materialConsumo', array);
            
            // Limpiar el estado local para este índice
            setDensidadTexts(prev => {
                const newState = { ...prev };
                delete newState[index];
                return newState;
            });
        }
    };

    // Obtener el valor a mostrar en el input de densidad
    const getDensidadDisplayValue = (index: number): string => {
        // Si hay un valor en edición, mostrarlo
        if (densidadTexts[index] !== undefined) {
            return densidadTexts[index];
        }
        
        // Si no, mostrar el valor del formData
        const densidadValue = formData.materialConsumo?.[index]?.densidad;
        return densidadValue !== null && densidadValue !== undefined ? String(densidadValue) : '';
    };

    // Handler para Material Disponible que marca/desmarca todos los checkboxes
    const handleMaterialDisponibleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        
        // Actualizar materialDisponible
        onDataChange('materialDisponible', isChecked);
        
        // Si se marca, marcar todos los checkboxes de material recibido
        if (isChecked && formData.materialConsumoCantidad && formData.materialConsumoCantidad > 0) {
            const updatedMaterialConsumo = formData.materialConsumo ? [...formData.materialConsumo] : [];
            
            for (let i = 0; i < formData.materialConsumoCantidad; i++) {
                if (!updatedMaterialConsumo[i]) {
                    updatedMaterialConsumo[i] = { necesario: null, recibido: true };
                } else {
                    updatedMaterialConsumo[i] = { ...updatedMaterialConsumo[i], recibido: true };
                }
            }
            
            onDataChange('materialConsumo', updatedMaterialConsumo);
        }
        // Si se desmarca, NO desmarcar automáticamente los checkboxes individuales
        // El usuario debe desmarcarlos manualmente si lo desea
    };

    const renderValidationMessage = (value: number | null | undefined) => {
        if (value !== null && value !== undefined && value < 0) {
            return <p className="text-xs text-red-500 mt-1">El valor no puede ser negativo.</p>;
        }
        return null;
    };

    return (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* Título de la sección - siempre visible */}
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
                📦 Datos Técnicos de Material
            </h3>

            <div className="space-y-8">{/* Contenedor principal con espaciado consistente */}
                
                {/* SECCIÓN 1: Producto */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <label htmlFor="producto" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        🏷️ Producto
                    </label>
                    <input 
                        type="text" 
                        id="producto" 
                        name="producto" 
                        value={formData.producto || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ingrese el nombre del producto"
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        disabled={isReadOnly} 
                    />
                </div>

                {/* SECCIÓN 2: Material (Suministro) + Láminas FUSIONADOS */}
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-5 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                            🛒 Material de Suministro y Compras
                        </h4>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Cantidad de materiales:
                            </label>
                            <select
                                name="materialConsumoCantidad"
                                value={formData.materialConsumoCantidad || ''}
                                onChange={handleInputChange}
                                disabled={isReadOnly}
                                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">0</option>
                                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {formData.materialConsumoCantidad && formData.materialConsumoCantidad > 0 ? (
                        <div className="space-y-4">
                            {Array.from({ length: formData.materialConsumoCantidad }).map((_, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                            Material {index + 1}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Número de Compra */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📋 N° de Compra
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={`Ej: OC-2025-${(index + 1).toString().padStart(3, '0')}`}
                                                value={formData.numerosCompra?.[index] || ''}
                                                onChange={(e) => handleNumeroCompraChange(index, e.target.value)}
                                                disabled={isReadOnly}
                                                maxLength={50}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            />
                                        </div>
                                        
                                        {/* Cantidad Necesaria */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📊 Cantidad Necesaria
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Ej: 1000"
                                                value={formData.materialConsumo?.[index]?.necesario || ''}
                                                onChange={(e) => handleNestedArrayChange('materialConsumo', index, 'necesario', e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            />
                                            {renderValidationMessage(formData.materialConsumo?.[index]?.necesario)}
                                        </div>
                                        
                                        {/* Micras */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📏 Micras (µm)
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Ej: 12"
                                                value={formData.materialConsumo?.[index]?.micras || ''}
                                                onChange={(e) => handleNestedArrayChange('materialConsumo', index, 'micras', e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            />
                                            {renderValidationMessage(formData.materialConsumo?.[index]?.micras)}
                                        </div>
                                        
                                        {/* Densidad */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                ⚖️ Densidad (g/cm³)
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Ej: 0.92 o 0,03"
                                                value={getDensidadDisplayValue(index)}
                                                onChange={(e) => handleDensidadChange(index, e.target.value)}
                                                onBlur={() => handleDensidadBlur(index)}
                                                disabled={isReadOnly}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Material Recibido - Checkbox separado con mejor visibilidad */}
                                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        
                                        {/* Cantidad Recibida - Ahora es un checkbox */}
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`material-recibido-${index}`}
                                                checked={!!formData.materialConsumo?.[index]?.recibido}
                                                onChange={(e) => handleNestedArrayChange('materialConsumo', index, 'recibido', e.target.checked)}
                                                disabled={isReadOnly}
                                                className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50 cursor-pointer"
                                            />
                                            <label 
                                                htmlFor={`material-recibido-${index}`}
                                                className={`ml-3 text-sm font-semibold cursor-pointer transition-colors ${
                                                    formData.materialConsumo?.[index]?.recibido
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                            >
                                                {formData.materialConsumo?.[index]?.recibido ? '✅ Material Recibido' : '⏳ Pendiente de Recibir'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                            Seleccione la cantidad de materiales para comenzar
                        </div>
                    )}

                    {/* Estado de Material - Sección de Control */}
                    <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-700">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <span className="text-2xl">📦</span>
                                    Estado del Material
                                </h5>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        id="materialDisponible" 
                                        name="materialDisponible" 
                                        checked={!!formData.materialDisponible} 
                                        onChange={handleMaterialDisponibleChange}
                                        disabled={isReadOnly}
                                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50 cursor-pointer" 
                                    />
                                    <label 
                                        htmlFor="materialDisponible" 
                                        className={`text-sm font-semibold cursor-pointer transition-colors ${
                                            formData.materialDisponible 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        {formData.materialDisponible ? '✓ Material Disponible' : 'Material Pendiente'}
                                    </label>
                                </div>
                            </div>

                            {/* Indicador visual del estado */}
                            <div className={`p-3 rounded-lg border-2 transition-all ${
                                formData.materialDisponible
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                            }`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">
                                        {formData.materialDisponible ? '✅' : '⏳'}
                                    </span>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${
                                            formData.materialDisponible
                                                ? 'text-green-800 dark:text-green-300'
                                                : 'text-yellow-800 dark:text-yellow-300'
                                        }`}>
                                            {formData.materialDisponible 
                                                ? 'Material listo para producción' 
                                                : 'Esperando disponibilidad de material'
                                            }
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {formData.materialDisponible
                                                ? 'El pedido puede avanzar a producción cuando el cliché también esté disponible.'
                                                : 'Marque esta opción cuando todo el material necesario haya sido recibido y esté disponible.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Observaciones del Material */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    📝 Observaciones de Material
                                </label>
                                <textarea
                                    name="observacionesMaterial"
                                    value={formData.observacionesMaterial || ''}
                                    onChange={(e) => onDataChange('observacionesMaterial', e.target.value)}
                                    placeholder="Notas sobre el material: proveedor, fecha de recepción esperada, problemas, etc."
                                    rows={3}
                                    disabled={isReadOnly}
                                    maxLength={500}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none"
                                />
                                {formData.observacionesMaterial && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.observacionesMaterial.length}/500 caracteres
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 3: Datos Técnicos (Bobinas, Minutos, Colores) */}
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-5 border-2 border-green-200 dark:border-green-800">
                    <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">
                        ⚙️ Especificaciones Técnicas de Producción
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Columna 1: Bobina Madre */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                🎯 Bobina Madre (mm)
                            </label>
                            <input 
                                type="number" 
                                name="bobinaMadre" 
                                placeholder="Ej: 1350"
                                value={formData.bobinaMadre || ''} 
                                onChange={handleInputChange} 
                                disabled={isReadOnly} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50" 
                            />
                            {renderValidationMessage(formData.bobinaMadre)}
                        </div>
                        
                        {/* Columna 2: Desarrollo */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                🔰 Desarrollo
                            </label>
                            <input 
                                type="text" 
                                name="desarrollo" 
                                placeholder="Ej: 300x200"
                                value={formData.desarrollo || ''} 
                                onChange={handleInputChange} 
                                disabled={isReadOnly} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50" 
                            />
                        </div>
                        
                        {/* Columna 3: Min. por Color */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                🎨 Min. por Color
                            </label>
                            <input 
                                type="number" 
                                name="minColor" 
                                placeholder="Ej: 5"
                                value={formData.minColor || ''} 
                                onChange={handleInputChange} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50" 
                                disabled={isReadOnly} 
                            />
                        </div>
                        
                        {/* Columna 1: Bobina Final */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                🎯 Bobina Final (mm)
                            </label>
                            <input 
                                type="number" 
                                name="bobinaFinal" 
                                placeholder="Ej: 450"
                                value={formData.bobinaFinal || ''} 
                                onChange={handleInputChange} 
                                disabled={isReadOnly} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50" 
                            />
                            {renderValidationMessage(formData.bobinaFinal)}
                        </div>
                        
                        {/* Columna 2: Min. Adaptación */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                ⏱️ Min. Adaptación
                            </label>
                            <input 
                                type="number" 
                                name="minAdap" 
                                placeholder="Ej: 15"
                                value={formData.minAdap || ''} 
                                onChange={handleInputChange} 
                                disabled={isReadOnly} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50" 
                            />
                            {renderValidationMessage(formData.minAdap)}
                        </div>
                        
                        {/* Columna 3: Cantidad de Colores */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                🌈 Cantidad de Colores
                            </label>
                            <input 
                                type="number" 
                                name="colores" 
                                placeholder="Ej: 4"
                                value={formData.colores || ''} 
                                onChange={handleInputChange} 
                                disabled={isReadOnly} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 disabled:opacity-50" 
                            />
                            {renderValidationMessage(formData.colores)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeccionDatosTecnicosDeMaterial;
