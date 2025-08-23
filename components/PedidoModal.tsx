
import React, { useState, useEffect, useMemo } from 'react';
import { Pedido, Prioridad, Etapa, UserRole } from '../types';
import { calcularTiempoRealProduccion, parseTimeToMinutes, formatMinutesToHHMM } from '../utils/kpi';

interface PedidoModalProps {
    pedido: Pedido;
    onClose: () => void;
    onSave: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    currentUserRole: UserRole;
}

const PedidoModal: React.FC<PedidoModalProps> = ({ pedido, onClose, onSave, onArchiveToggle, currentUserRole }) => {
    const [formData, setFormData] = useState<Pedido>(pedido);
    const isReadOnly = currentUserRole === 'Operador';

    useEffect(() => {
        setFormData(pedido);
    }, [pedido]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const handleArchiveClick = () => {
        onArchiveToggle(pedido);
    };

    const performanceData = useMemo(() => {
        const tiempoRealMin = calcularTiempoRealProduccion(pedido);
        const tiempoPlanificadoMin = parseTimeToMinutes(pedido.tiempoProduccionPlanificado);
        const desviacionMin = tiempoRealMin - tiempoPlanificadoMin;

        return {
            real: formatMinutesToHHMM(tiempoRealMin),
            planificado: pedido.tiempoProduccionPlanificado,
            desviacion: desviacionMin,
            desviacionColor: desviacionMin <= 0 ? 'text-green-400' : 'text-red-400',
        }
    }, [pedido]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">Detalles del Pedido: {pedido.numeroPedido}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-indigo-300 mb-3">Análisis de Rendimiento</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-sm text-gray-400">T. Planificado</div>
                            <div className="text-2xl font-bold">{performanceData.planificado}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">T. Real</div>
                            <div className="text-2xl font-bold">{performanceData.real}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">Desviación (min)</div>
                            <div className={`text-2xl font-bold ${performanceData.desviacionColor}`}>{performanceData.desviacion}</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isReadOnly}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Columna Izquierda */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">Cliente</label>
                                <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"/>
                                
                                <label className="block mt-4 mb-2 text-sm font-medium text-gray-300">Máquina de Impresión</label>
                                <input type="text" name="maquinaImpresion" value={formData.maquinaImpresion} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>

                                <label className="block mt-4 mb-2 text-sm font-medium text-gray-300">Tipo de Impresión</label>
                                <input type="text" name="tipoImpresion" value={formData.tipoImpresion} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                            </div>
                            {/* Columna Derecha */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">Prioridad</label>
                                <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:opacity-50">
                                    {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-300">Metros</label>
                                        <input type="number" name="metros" value={formData.metros} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-300">Tiempo Prod. (HH:mm)</label>
                                        <input type="text" name="tiempoProduccionPlanificado" value={formData.tiempoProduccionPlanificado} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                                    </div>
                                </div>

                                 <label className="block mt-4 mb-2 text-sm font-medium text-gray-300">Fecha</label>
                                <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block mb-2 text-sm font-medium text-gray-300">Observaciones</label>
                            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 disabled:opacity-50"></textarea>
                        </div>
                    </fieldset>

                    <div className="mt-8 flex justify-between items-center">
                        {isReadOnly ? (
                            <span className="text-sm text-gray-500">Modo de solo lectura para Operador.</span>
                        ) : (
                             <button type="button" onClick={handleArchiveClick} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                                {pedido.etapaActual === Etapa.ARCHIVADO ? 'Desarchivar' : 'Archivar'}
                            </button>
                        )}
                       
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200">Cancelar</button>
                             {!isReadOnly && (
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">Guardar Cambios</button>
                             )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PedidoModal;
