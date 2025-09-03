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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl p-6 w-full max-w-5xl max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            🔄 Reordenar Secuencia de Trabajo
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Pedido: <span className="font-semibold">{pedido.numeroPedidoCliente}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                        &times;
                    </button>
                </div>

                <div className="mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-500 text-white p-2 rounded-full flex-shrink-0">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                    Pedido Fuera de Secuencia
                                </h3>
                                <p className="text-blue-700 dark:text-blue-300 text-sm">
                                    Este pedido está en <strong>{ETAPAS[pedido.etapaActual].title}</strong>, 
                                    pero no sigue la secuencia definida. Puede reordenar y continuar.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Secuencia Original - más compacta */}
                        <div>
                            <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                Secuencia Original
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                {pedido.secuenciaTrabajo && pedido.secuenciaTrabajo.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {pedido.secuenciaTrabajo.map((etapa, index) => (
                                            <div 
                                                key={etapa} 
                                                className={`flex items-center px-3 py-1 rounded-full text-sm border ${
                                                    etapa === pedido.etapaActual 
                                                        ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 font-bold' 
                                                        : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                <span className="mr-1">{index + 1}.</span>
                                                {ETAPAS[etapa].title}
                                                {etapa === pedido.etapaActual && (
                                                    <span className="ml-2 text-xs bg-blue-600 dark:bg-blue-500 text-white px-2 py-0.5 rounded">
                                                        ACTUAL
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No hay secuencia definida</p>
                                )}
                            </div>
                        </div>

                        {/* Nueva Secuencia - más espacio y prominente */}
                        <div>
                            <h4 className="font-semibold mb-3 text-lg text-gray-800 dark:text-gray-200">
                                📝 Redefinir Nueva Secuencia
                            </h4>
                            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
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
                    <div className="mb-8">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <label className="block mb-3 text-lg font-semibold text-green-800 dark:text-green-200">
                                🎯 ¿A qué etapa quiere continuar?
                            </label>
                            <select 
                                value={continueToStage} 
                                onChange={(e) => setContinueToStage(e.target.value as Etapa | '')} 
                                className="w-full bg-white dark:bg-gray-700 border border-green-300 dark:border-green-600 rounded-lg p-3 text-lg font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                            >
                                <option value="">Seleccione una etapa...</option>
                                {continueOptions.map(etapa => (
                                    <option key={etapa} value={etapa}>
                                        {ETAPAS[etapa].title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                                <span>💡</span>
                                Solo se muestran las etapas que pueden seguir según la nueva secuencia.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-500 hover:bg-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={!continueToStage || newSequence.length === 0}
                        >
                            <span>✅</span>
                            Aplicar Nueva Secuencia y Continuar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SequenceReorderModal;
