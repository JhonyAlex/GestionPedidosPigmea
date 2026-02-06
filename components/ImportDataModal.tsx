import React, { useState } from 'react';
import { Pedido } from '../types';

interface ImportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedPedidos: Pedido[]) => void;
}

interface DateGroup {
    fecha: string;
    count: number;
    pedidos: Pedido[];
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [allPedidos, setAllPedidos] = useState<Pedido[]>([]);
    const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Función helper para extraer fecha sin problemas de zona horaria
    const extractFechaFromPedido = (pedido: Pedido): string => {
        if (!pedido.fechaCreacion) return 'Sin fecha';
        
        // Si la fecha ya está en formato YYYY-MM-DD, usarla directamente
        if (typeof pedido.fechaCreacion === 'string' && /^\d{4}-\d{2}-\d{2}/.test(pedido.fechaCreacion)) {
            return pedido.fechaCreacion.split('T')[0];
        }
        
        // Si no, crear Date y extraer componentes locales sin conversión UTC
        const date = new Date(pedido.fechaCreacion);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("El contenido del archivo no es texto.");
                
                const importedPedidos: Pedido[] = JSON.parse(text);
                if (!Array.isArray(importedPedidos) || !importedPedidos.every(p => p.id && p.numeroPedidoCliente)) {
                    throw new Error("Formato JSON inválido. Se esperaba un array de pedidos.");
                }

                // Agrupar por fecha de creación
                const groups: { [key: string]: Pedido[] } = {};
                importedPedidos.forEach(pedido => {
                    const fecha = extractFechaFromPedido(pedido);
                    if (!groups[fecha]) {
                        groups[fecha] = [];
                    }
                    groups[fecha].push(pedido);
                });

                // Convertir a array y ordenar por fecha descendente
                const groupsArray: DateGroup[] = Object.entries(groups)
                    .map(([fecha, pedidos]) => ({
                        fecha,
                        count: pedidos.length,
                        pedidos: pedidos.sort((a, b) => b.orden - a.orden)
                    }))
                    .sort((a, b) => {
                        if (a.fecha === 'Sin fecha') return 1;
                        if (b.fecha === 'Sin fecha') return -1;
                        return b.fecha.localeCompare(a.fecha);
                    });

                setAllPedidos(importedPedidos);
                setDateGroups(groupsArray);
                // Seleccionar todas las fechas por defecto
                setSelectedDates(new Set(groupsArray.map(g => g.fecha)));
                setIsLoading(false);
            } catch (error) {
                console.error("Error al leer el archivo:", error);
                alert(`Error al leer el archivo: ${(error as Error).message}`);
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const toggleDate = (fecha: string) => {
        const newSelected = new Set(selectedDates);
        if (newSelected.has(fecha)) {
            newSelected.delete(fecha);
        } else {
            newSelected.add(fecha);
        }
        setSelectedDates(newSelected);
    };

    const toggleAll = () => {
        if (selectedDates.size === dateGroups.length) {
            setSelectedDates(new Set());
        } else {
            setSelectedDates(new Set(dateGroups.map(g => g.fecha)));
        }
    };

    const getSelectedPedidos = (): Pedido[] => {
        return allPedidos.filter(pedido => {
            const fecha = extractFechaFromPedido(pedido);
            return selectedDates.has(fecha);
        });
    };

    const handleConfirm = () => {
        const selected = getSelectedPedidos();
        if (selected.length === 0) {
            alert('Debe seleccionar al menos una fecha para importar.');
            return;
        }
        
        if (window.confirm(`¿Confirmar importación de ${selected.length} pedidos? ESTA ACCIÓN BORRARÁ TODOS LOS DATOS ACTUALES.`)) {
            onConfirm(selected);
            handleClose();
        }
    };

    const handleClose = () => {
        setAllPedidos([]);
        setDateGroups([]);
        setSelectedDates(new Set());
        onClose();
    };

    const formatFecha = (fecha: string): string => {
        if (fecha === 'Sin fecha') return fecha;
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Importar Pedidos - Selección por Fecha
                    </h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {dateGroups.length === 0 ? (
                        <div className="text-center py-8">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="import-file-input"
                            />
                            <label
                                htmlFor="import-file-input"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                            >
                                📁 Seleccionar archivo JSON
                            </label>
                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                Selecciona un archivo de backup para ver las opciones de importación
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Selección de fechas */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Seleccionar fechas a importar
                                    </h3>
                                    <button
                                        onClick={toggleAll}
                                        className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                                    >
                                        {selectedDates.size === dateGroups.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    {dateGroups.map((group) => (
                                        <label
                                            key={group.fecha}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDates.has(group.fecha)}
                                                    onChange={() => toggleDate(group.fecha)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {formatFecha(group.fecha)}
                                                </span>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                                {group.count} {group.count === 1 ? 'pedido' : 'pedidos'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            {selectedDates.size > 0 && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                        Vista previa ({getSelectedPedidos().length} pedidos seleccionados)
                                    </h3>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                                        {dateGroups
                                            .filter(group => selectedDates.has(group.fecha))
                                            .slice(0, 3)
                                            .map((group) => (
                                                <div key={group.fecha} className="mb-4 last:mb-0">
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                                        {formatFecha(group.fecha)} - Primeros {Math.min(5, group.pedidos.length)} de {group.count}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {group.pedidos.slice(0, 5).map((pedido) => (
                                                            <div
                                                                key={pedido.id}
                                                                className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"
                                                            >
                                                                <span className="font-mono text-gray-500">#{pedido.numeroPedidoCliente}</span>
                                                                <span className="truncate">{pedido.producto}</span>
                                                                <span className="text-gray-400">•</span>
                                                                <span className="text-gray-500">{pedido.cliente}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        {dateGroups.filter(group => selectedDates.has(group.fecha)).length > 3 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                                                ... y {dateGroups.filter(group => selectedDates.has(group.fecha)).length - 3} fecha(s) más
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    {dateGroups.length > 0 && (
                        <button
                            onClick={handleConfirm}
                            disabled={selectedDates.size === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            Importar {getSelectedPedidos().length} pedidos
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportDataModal;
