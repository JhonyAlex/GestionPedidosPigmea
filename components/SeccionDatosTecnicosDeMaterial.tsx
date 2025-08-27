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
        const parsedValue = value === '' ? null : parseFloat(value);

        if (!array[index]) array[index] = {};
        array[index][field] = parsedValue;

        onDataChange(arrayName, array);
    };

    const renderValidationMessage = (value: number | null | undefined) => {
        if (value !== null && value !== undefined && value < 0) {
            return <p className="text-xs text-red-500 mt-1">El valor no puede ser negativo.</p>;
        }
        return null;
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-xl font-bold text-gray-800 dark:text-gray-200 mb-4"
            >
                Datos técnicos de material
                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Producto */}
                    <div className="md:col-span-2">
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Producto</label>
                        <input
                            type="text"
                            name="producto"
                            value={formData.producto || ''}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                        />
                    </div>

                    {/* Grupo A: Material Capas */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Nº Capas Material</label>
                            <select
                                name="materialCapasCantidad"
                                value={formData.materialCapasCantidad || ''}
                                onChange={handleInputChange}
                                disabled={isReadOnly}
                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                            >
                                <option value="">Seleccionar</option>
                                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3 grid grid-cols-2 gap-4">
                            {formData.materialCapasCantidad && Array.from({ length: formData.materialCapasCantidad }).map((_, index) => (
                                <div key={index} className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 col-span-2">Capa {index + 1}</label>
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
                            ))}
                        </div>
                    </div>

                    {/* Grupo B: Material Consumo */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="md:col-span-1">
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Nº Consumibles</label>
                            <select
                                name="materialConsumoCantidad"
                                value={formData.materialConsumoCantidad || ''}
                                onChange={handleInputChange}
                                disabled={isReadOnly}
                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                            >
                                <option value="">Seleccionar</option>
                                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3 grid grid-cols-2 gap-4">
                            {formData.materialConsumoCantidad && Array.from({ length: formData.materialConsumoCantidad }).map((_, index) => (
                                <div key={index} className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 col-span-2">Consumible {index + 1}</label>
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
                            ))}
                        </div>
                    </div>

                    {/* Bobinas, Minutos, Colores */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Bobina Madre</label>
                            <input type="number" name="bobinaMadre" value={formData.bobinaMadre || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                            {renderValidationMessage(formData.bobinaMadre)}
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Bobina Final</label>
                            <input type="number" name="bobinaFinal" value={formData.bobinaFinal || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                            {renderValidationMessage(formData.bobinaFinal)}
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Min. Adaptación</label>
                            <input type="number" name="minAdap" value={formData.minAdap || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                            {renderValidationMessage(formData.minAdap)}
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Colores</label>
                            <input type="number" name="colores" value={formData.colores || ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" />
                            {renderValidationMessage(formData.colores)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeccionDatosTecnicosDeMaterial;
