import React, { useState } from 'react';
import { Pedido, Prioridad, TipoImpresion, Etapa, EstadoCliché } from '../types';
import { KANBAN_FUNNELS, ETAPAS } from '../constants';
import SequenceBuilder from './SequenceBuilder';

interface AddPedidoModalProps {
    onClose: () => void;
    onAdd: (data: {
        pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'etapaActual' | 'maquinaImpresion' | 'secuenciaTrabajo' | 'orden' | 'historial'>;
        secuenciaTrabajo: Etapa[];
    }) => void;
}

const initialFormData = {
    cliente: '',
    numeroPedidoCliente: '',
    metros: 0,
    fechaEntrega: '',
    prioridad: Prioridad.NORMAL,
    tipoImpresion: TipoImpresion.SUPERFICIE,
    desarrollo: '',
    capa: 1,
    tiempoProduccionPlanificado: '00:00',
    observaciones: '',
    materialDisponible: false,
    estadoCliché: EstadoCliché.PENDIENTE_CLIENTE,
    camisa: '',
};

const AddPedidoModal: React.FC<AddPedidoModalProps> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [secuenciaTrabajo, setSecuenciaTrabajo] = useState<Etapa[]>([]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            const valueToSet = type === 'number' ? parseInt(value, 10) || 0 : value;
            setFormData(prev => ({ ...prev, [name]: valueToSet }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.cliente.trim() || !formData.numeroPedidoCliente.trim() || !formData.fechaEntrega || formData.metros <= 0) {
            alert('Por favor, complete todos los campos obligatorios (Cliente, N° Pedido Cliente, Fecha Entrega, Metros).');
            return;
        }
        onAdd({ pedidoData: formData, secuenciaTrabajo });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">Crear Nuevo Pedido</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna Izquierda */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Cliente</label>
                            <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" required />
                            
                            <label className="block mt-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Número de Pedido Cliente</label>
                            <input type="text" name="numeroPedidoCliente" value={formData.numeroPedidoCliente} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" required />

                             <label className="block mt-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Estado del Cliché</label>
                             <select name="estadoCliché" value={formData.estadoCliché} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5">
                                {Object.values(EstadoCliché).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <label className="block mt-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tipo de Impresión</label>
                            <select name="tipoImpresion" value={formData.tipoImpresion} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5">
                                {Object.values(TipoImpresion).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            
                        </div>
                        {/* Columna Derecha */}
                        <div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Desarrollo</label>
                                    <input type="text" name="desarrollo" value={formData.desarrollo} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"/>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Capa</label>
                                    <input type="number" name="capa" value={formData.capa} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" step="1" min="1"/>
                                </div>
                            </div>

                            <label className="block mt-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Prioridad</label>
                            <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5">
                                {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Metros</label>
                                    <input type="number" name="metros" value={formData.metros} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" min="1" required/>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tiempo Prod. (HH:mm)</label>
                                    <input type="text" name="tiempoProduccionPlanificado" value={formData.tiempoProduccionPlanificado} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" placeholder="HH:mm" pattern="[0-9]{2}:[0-9]{2}" />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4 mt-4 items-center">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de Entrega</label>
                                    <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" required/>
                                </div>
                                 <div className="flex items-center justify-start pt-6">
                                    <input type="checkbox" id="materialDisponible" name="materialDisponible" checked={formData.materialDisponible} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <label htmlFor="materialDisponible" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Material Disponible</label>
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-xl font-semibold mb-4">Secuencia de Post-Impresión</h3>
                        <SequenceBuilder sequence={secuenciaTrabajo} onChange={setSecuenciaTrabajo} isReadOnly={false} />
                    </div>

                    <div className="mt-6">
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Observaciones</label>
                        <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={3} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"></textarea>
                    </div>

                    <div className="mt-6">
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Camisa</label>
                        <input type="text" name="camisa" value={formData.camisa} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"/>
                    </div>

                    <div className="mt-8 flex justify-end items-center">
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded transition-colors duration-200">Cancelar</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">Crear Pedido</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPedidoModal;