import React, { useState } from 'react';
import { Pedido } from '../types';
import { ChevronDownIcon, ChevronUpIcon } from './Icons.tsx'; // Suponiendo que tienes iconos de flecha

interface SeccionDatosTecnicosProps {
    formData: Partial<Pedido>;
    onDataChange: (field: keyof Pedido, value: any) => void;
    isReadOnly?: boolean;
}

const SeccionDatosTecnicosDeMaterial: React.FC<SeccionDatosTecnicosProps> = ({ formData, onDataChange, isReadOnly = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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
        value: string
    ) => {
        const array = formData[arrayName] ? [...(formData[arrayName] as any[])] : [];
        let parsedValue: string | number | null;

        if (field === 'recibido') {
            parsedValue = value;
        } else {
            parsedValue = value === '' ? null : parseFloat(value);
        }

        // Guardar el valor anterior para la auditoría
        const previousValue = array[index]?.[field];

        if (!array[index]) array[index] = {};
        array[index][field] = parsedValue;

        // Notificar el cambio del array completo
        onDataChange(arrayName, array);

        // Si el valor cambió, generar un campo específico para la auditoría con nombre descriptivo
        if (JSON.stringify(previousValue) !== JSON.stringify(parsedValue)) {
            const fieldDisplayName = arrayName === 'materialCapas' 
                ? `Lámina ${index + 1} - ${field === 'micras' ? 'Micras' : 'Densidad'}`
                : `Material ${index + 1} - ${field === 'necesario' ? 'Necesario' : 'Recibido'}`;
            
            // Crear un campo virtual para la auditoría
            const auditFieldName = `${arrayName}_${index}_${field}`;
            onDataChange(auditFieldName as any, parsedValue);
        }
    };

    const renderValidationMessage = (value: number | null | undefined) => {
        if (value !== null && value !== undefined && value < 0) {
            return <p className="text-xs text-red-500 mt-1">El valor no puede ser negativo.</p>;
        }
        return null;
    };

    return (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-lg font-semibold mb-2 text-left"
            >
                Datos Técnicos de Material
                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Columna Izquierda */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="producto" className="block text-sm font-medium mb-1">Producto</label>
                            <input type="text" id="producto" name="producto" value={formData.producto || ''} onChange={handleInputChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" disabled={isReadOnly} />
                        </div>

                        {/* Grupo A: Material Capas */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Material (Láminas)</label>
                                    <select
                                        name="materialCapasCantidad"
                                        value={formData.materialCapasCantidad || ''}
                                        onChange={handleInputChange}
                                        disabled={isReadOnly}
                                        className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                    >
                                        <option value="">0</option>
                                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2 grid grid-cols-1 gap-3">
                                    {formData.materialCapasCantidad && Array.from({ length: formData.materialCapasCantidad }).map((_, index) => (
                                        <div key={index}>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Lámina {index + 1}</label>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <div>
                                                    <input
                                                        type="number"
                                                        placeholder="Micras"
                                                        value={formData.materialCapas?.[index]?.micras || ''}
                                                        onChange={(e) => handleNestedArrayChange('materialCapas', index, 'micras', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                                                    />
                                                    {renderValidationMessage(formData.materialCapas?.[index]?.micras)}
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Densidad"
                                                        value={formData.materialCapas?.[index]?.densidad || ''}
                                                        onChange={(e) => handleNestedArrayChange('materialCapas', index, 'densidad', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Grupo B: Material Consumo */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Material (Suministro)</label>
                                    <select
                                        name="materialConsumoCantidad"
                                        value={formData.materialConsumoCantidad || ''}
                                        onChange={handleInputChange}
                                        disabled={isReadOnly}
                                        className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                    >
                                        <option value="">0</option>
                                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2 grid grid-cols-1 gap-3">
                                    {formData.materialConsumoCantidad && Array.from({ length: formData.materialConsumoCantidad }).map((_, index) => (
                                        <div key={index}>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Material {index + 1}</label>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <div>
                                                    <input
                                                        type="number"
                                                        placeholder="Necesario"
                                                        value={formData.materialConsumo?.[index]?.necesario || ''}
                                                        onChange={(e) => handleNestedArrayChange('materialConsumo', index, 'necesario', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                                                    />
                                                    {renderValidationMessage(formData.materialConsumo?.[index]?.necesario)}
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Recibido"
                                                        value={formData.materialConsumo?.[index]?.recibido || ''}
                                                        onChange={(e) => handleNestedArrayChange('materialConsumo', index, 'recibido', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha */}
                    <div className="flex flex-col gap-4">
                        {/* Bobinas, Minutos, Colores */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Bobina Madre</label>
                                <input type="number" name="bobinaMadre" value={formData.bobinaMadre || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                                {renderValidationMessage(formData.bobinaMadre)}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Bobina Final</label>
                                <input type="number" name="bobinaFinal" value={formData.bobinaFinal || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                                {renderValidationMessage(formData.bobinaFinal)}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Min. Adap</label>
                                <input type="number" name="minAdap" value={formData.minAdap || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                                {renderValidationMessage(formData.minAdap)}
                            </div>
                            <div>
                                <label htmlFor="minColor" className="block text-sm font-medium mb-1">Min. Color</label>
                                <input type="number" name="minColor" value={formData.minColor || ''} onChange={handleInputChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" disabled={isReadOnly} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Colores</label>
                                <input type="number" name="colores" value={formData.colores || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                                {renderValidationMessage(formData.colores)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeccionDatosTecnicosDeMaterial;
