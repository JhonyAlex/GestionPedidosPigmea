import React, { useState } from 'react';
import { Pedido, Etapa } from '../types';
import { KANBAN_FUNNELS, ETAPAS } from '../constants';
import SequenceBuilder from './SequenceBuilder';

interface EnviarAImpresionModalProps {
    pedido: Pedido;
    onClose: () => void;
    onConfirm: (
        pedido: Pedido,
        impresionEtapa: Etapa,
        postImpresionSequence: Etapa[]
    ) => void;
}

const EnviarAImpresionModal: React.FC<EnviarAImpresionModalProps> = ({ pedido, onClose, onConfirm }) => {
    const [impresionEtapa, setImpresionEtapa] = useState<Etapa>(KANBAN_FUNNELS.IMPRESION.stages[0]);
    const [postImpresionSequence, setPostImpresionSequence] = useState<Etapa[]>(pedido.secuenciaTrabajo || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(pedido, impresionEtapa, postImpresionSequence);
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Enviar a Impresión</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none">&times;</button>
                </div>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Configura la etapa inicial de impresión y la secuencia de post-impresión para el pedido <span className="font-bold">{pedido.numeroPedidoCliente}</span>.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Máquina de Impresión (Etapa Inicial)</label>
                             <select 
                                value={impresionEtapa} 
                                onChange={(e) => setImpresionEtapa(e.target.value as Etapa)} 
                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                required
                            >
                                {KANBAN_FUNNELS.IMPRESION.stages.map(stageId => (
                                    <option key={stageId} value={stageId}>
                                        {ETAPAS[stageId].title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Secuencia de Post-Impresión</h3>
                            <SequenceBuilder 
                                sequence={postImpresionSequence} 
                                onChange={setPostImpresionSequence} 
                                isReadOnly={false} 
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded transition-colors duration-200">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                            Confirmar y Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnviarAImpresionModal;
