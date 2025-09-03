import React, { useState, useMemo } from 'react';
import { Pedido, Etapa } from '../types';
import { ETAPAS, KANBAN_FUNNELS } from '../constants';
import SequenceBuilder from './SequenceBuilder';

interface SequenceReorderModalProps {
    pedido: Pedido;
    onClose: () => void;
    onConfirm: (pedido: Pedido, newSequence: Etapa[], continueTo: Etapa) => void;
}

const SequenceReorderModal: React.FC<SequenceReorderModalProps> = ({ pedido, onClose, onConfirm }) => {
    // Inicializar con la secuencia actual, incluyendo la etapa actual si no está en la secuencia
    const initializeSequence = () => {
        const currentSequence = pedido.secuenciaTrabajo || [];
        const currentEtapa = pedido.etapaActual;
        
        // Si la etapa actual no está en la secuencia y es de post-impresión, la incluimos
        if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(currentEtapa) && 
            !currentSequence.includes(currentEtapa)) {
            return [currentEtapa, ...currentSequence];
        }
        
        return currentSequence;
    };

    const [newSequence, setNewSequence] = useState<Etapa[]>(initializeSequence());
    const [continueToStage, setContinueToStage] = useState<Etapa | ''>('');

    // Determinar las opciones de "continuar hacia"
    const continueOptions = useMemo(() => {
        const currentIndex = newSequence.indexOf(pedido.etapaActual);
        
        if (currentIndex === -1) {
            // Si la etapa actual no está en la nueva secuencia, puede continuar a cualquier etapa de la secuencia
            return newSequence;
        } else {
            // Si la etapa actual está en la secuencia, puede continuar a las siguientes etapas o completado
            const remainingStages = newSequence.slice(currentIndex + 1);
            return remainingStages.length > 0 ? [...remainingStages, Etapa.COMPLETADO] : [Etapa.COMPLETADO];
        }
    }, [newSequence, pedido.etapaActual]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!continueToStage) {
            alert('Por favor seleccione a qué etapa continuar.');
            return;
        }

        onConfirm(pedido, newSequence, continueToStage as Etapa);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                        Reordenar Secuencia de Trabajo
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            Situación Actual
                        </h3>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">
                            El pedido <strong>{pedido.numeroPedidoCliente}</strong> está actualmente en{' '}
                            <strong>{ETAPAS[pedido.etapaActual].title}</strong>, pero esta etapa no sigue la secuencia 
                            de trabajo definida. Puede reordenar la secuencia y elegir cómo continuar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                Secuencia Original
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 min-h-[100px]">
                                {pedido.secuenciaTrabajo && pedido.secuenciaTrabajo.length > 0 ? (
                                    <ol className="space-y-2">
                                        {pedido.secuenciaTrabajo.map((etapa, index) => (
                                            <li 
                                                key={etapa} 
                                                className={`flex items-center text-sm ${
                                                    etapa === pedido.etapaActual 
                                                        ? 'font-bold text-blue-600 dark:text-blue-400' 
                                                        : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                            >
                                                <span className="mr-2">{index + 1}.</span>
                                                {ETAPAS[etapa].title}
                                                {etapa === pedido.etapaActual && (
                                                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                        ACTUAL
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-gray-500 text-sm">No hay secuencia definida</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                Nueva Secuencia
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <SequenceBuilder 
                                    sequence={newSequence} 
                                    onChange={setNewSequence} 
                                    isReadOnly={false} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            ¿A qué etapa quiere continuar?
                        </label>
                        <select 
                            value={continueToStage} 
                            onChange={(e) => setContinueToStage(e.target.value as Etapa | '')} 
                            className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                            required
                        >
                            <option value="">Seleccione una etapa...</option>
                            {continueOptions.map(etapa => (
                                <option key={etapa} value={etapa}>
                                    {ETAPAS[etapa].title}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Solo se muestran las etapas que pueden seguir según la nueva secuencia.
                        </p>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-500 hover:bg-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded transition-colors duration-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!continueToStage || newSequence.length === 0}
                        >
                            Aplicar Nueva Secuencia y Continuar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SequenceReorderModal;
