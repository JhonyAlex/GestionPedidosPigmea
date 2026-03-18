import React, { useEffect, useState } from 'react';
import { Pedido, Etapa } from '../types';
import { KANBAN_FUNNELS, ETAPAS } from '../constants';
import { normalizePostImpresionSequence } from '../utils/dntWorkflow';
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
    const availablePostImpresionStages = normalizePostImpresionSequence(KANBAN_FUNNELS.POST_IMPRESION.stages, pedido.cliente);

    const getInitialStage = (): Etapa => {
        if (pedido.maquinaImpresion) {
            const matchingStage = KANBAN_FUNNELS.IMPRESION.stages.find(
                stage => ETAPAS[stage].title === pedido.maquinaImpresion
            );
            if (matchingStage) return matchingStage;
        }

        return KANBAN_FUNNELS.IMPRESION.stages[0];
    };

    const [impresionEtapa, setImpresionEtapa] = useState<Etapa>(getInitialStage());
    const [postImpresionSequence, setPostImpresionSequence] = useState<Etapa[]>(
        normalizePostImpresionSequence(pedido.secuenciaTrabajo, pedido.cliente)
    );

    useEffect(() => {
        setImpresionEtapa(getInitialStage());
        setPostImpresionSequence(normalizePostImpresionSequence(pedido.secuenciaTrabajo, pedido.cliente));
    }, [pedido]);

    const handleSequenceChange = (newSequence: Etapa[]) => {
        setPostImpresionSequence(normalizePostImpresionSequence(newSequence, pedido.cliente));
    };

    // Determinar si es una reconfirmación de antivaho
    const isAntivahoReconfirmation = pedido.antivaho && !pedido.antivahoRealizado &&
        KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedSequence = normalizePostImpresionSequence(postImpresionSequence, pedido.cliente);

        // Pedidos anónimos: saltar impresión y enviar directamente a la primera etapa de post-impresión
        if (pedido.anonimo && normalizedSequence.length > 0) {
            onConfirm(pedido, normalizedSequence[0], normalizedSequence.slice(1));
            return;
        }

        // Si el pedido tiene antivaho, no se ha realizado y está en preparación, enviar directamente a post-impresión
        if (pedido.antivaho && !pedido.antivahoRealizado && pedido.etapaActual === 'PREPARACION' && normalizedSequence.length > 0) {
            onConfirm(pedido, normalizedSequence[0], normalizedSequence.slice(1));
        } else {
            onConfirm(pedido, impresionEtapa, normalizedSequence);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">
                        {isAntivahoReconfirmation
                            ? 'Reconfirmación de Antivaho'
                            : pedido.anonimo
                                ? 'Enviar a Post-Impresión (Anónimo)'
                                : 'Enviar a Impresión'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none">&times;</button>
                </div>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                    {isAntivahoReconfirmation
                        ? `El pedido ${pedido.numeroPedidoCliente} tiene antivaho activado. Seleccione la nueva etapa de destino y configure la secuencia.`
                        : pedido.anonimo
                            ? `El pedido ${pedido.numeroPedidoCliente} es anónimo y saltará directamente a post-impresión. Configure la secuencia de destino.`
                            : pedido.antivaho && !pedido.antivahoRealizado && pedido.etapaActual === 'PREPARACION'
                                ? `Este pedido tiene antivaho activado y será enviado directamente a post-impresión. Configure la secuencia para el pedido ${pedido.numeroPedidoCliente}.`
                                : `Configura la etapa inicial de impresión y la secuencia de post-impresión para el pedido ${pedido.numeroPedidoCliente}.`
                    }
                </p>

                {/* Indicaciones llamativas para características especiales */}
                <div className="mb-6 space-y-2">
                    {pedido.anonimo && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500 rounded-lg">
                            <span className="text-2xl">🕵️</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">PEDIDO ANÓNIMO — SALTA IMPRESIÓN</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                    Este pedido irá directamente a post-impresión.
                                    {pedido.anonimoPostImpresion && ` Destino indicado: ${pedido.anonimoPostImpresion}.`}
                                </p>
                            </div>
                        </div>
                    )}
                    {pedido.antivaho && (
                        <div className={`flex items-center gap-2 p-3 ${pedido.antivahoRealizado ? 'bg-green-100 dark:bg-green-900/30 border-green-500' : 'bg-blue-100 dark:bg-blue-900/30 border-blue-500'} border-2 rounded-lg`}>
                            <span className="text-2xl">{pedido.antivahoRealizado ? '✅' : '✨'}</span>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${pedido.antivahoRealizado ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>
                                    {pedido.antivahoRealizado ? 'ANTIVAHO REALIZADO' : 'ANTIVAHO ACTIVADO'}
                                </p>
                                <p className={`text-xs ${pedido.antivahoRealizado ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                    {pedido.antivahoRealizado ? 'El tratamiento antivaho ya ha sido completado. Se enviará a impresión normalmente.' : 'Este pedido requiere tratamiento antivaho'}
                                </p>
                            </div>
                        </div>
                    )}

                    {pedido.microperforado && (
                        <div className="flex items-center gap-2 p-3 bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 rounded-lg">
                            <span className="text-2xl">🔵</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-purple-800 dark:text-purple-300">MICROPERFORADO</p>
                                <p className="text-xs text-purple-700 dark:text-purple-400">Este pedido requiere microperforación</p>
                            </div>
                        </div>
                    )}
                    {pedido.macroperforado && (
                        <div className="flex items-center gap-2 p-3 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 rounded-lg">
                            <span className="text-2xl">🟠</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-orange-800 dark:text-orange-300">MACROPERFORADO</p>
                                <p className="text-xs text-orange-700 dark:text-orange-400">Este pedido requiere macroperforación</p>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Mostrar selector de máquina: no para anónimos (saltan impresión), no para antivaho sin realizar */}
                        {!pedido.anonimo && (!pedido.antivaho || pedido.antivahoRealizado || isAntivahoReconfirmation) && (
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {isAntivahoReconfirmation ? 'Etapa de Destino' : 'Máquina de Impresión (Etapa Inicial)'}
                                </label>
                                <select
                                    value={impresionEtapa}
                                    onChange={(e) => setImpresionEtapa(e.target.value as Etapa)}
                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                    required
                                >
                                    <optgroup label="Impresión">
                                        {KANBAN_FUNNELS.IMPRESION.stages.map(stageId => (
                                            <option key={stageId} value={stageId}>
                                                {ETAPAS[stageId].title}
                                            </option>
                                        ))}
                                    </optgroup>
                                    {isAntivahoReconfirmation && (
                                        <optgroup label="Post-Impresión">
                                            {availablePostImpresionStages.map(stageId => (
                                                <option key={stageId} value={stageId}>
                                                    {ETAPAS[stageId].title}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                        )}

                        <div>
                            <h3 className="text-lg font-semibold mb-2">
                                {pedido.anonimo
                                    ? 'Secuencia de Post-Impresión (Anónimo)'
                                    : pedido.antivaho
                                        ? 'Secuencia de Post-Impresión (Antivaho)'
                                        : 'Secuencia de Post-Impresión'}
                            </h3>
                            <SequenceBuilder
                                sequence={postImpresionSequence}
                                onChange={handleSequenceChange}
                                isReadOnly={false}
                                clienteName={pedido.cliente}
                            />
                            {(pedido.anonimo || pedido.antivaho) && postImpresionSequence.length === 0 && (
                                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                                    Debe definir al menos una etapa de post-impresión para este pedido.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded transition-colors duration-200">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={(pedido.anonimo || (pedido.antivaho && !pedido.antivahoRealizado && pedido.etapaActual === 'PREPARACION')) && postImpresionSequence.length === 0}
                        >
                            {isAntivahoReconfirmation
                                ? "Confirmar Cambio (Antivaho Realizado)"
                                : pedido.anonimo
                                    ? "Confirmar y Enviar a Post-Impresión"
                                    : pedido.antivaho && !pedido.antivahoRealizado && pedido.etapaActual === 'PREPARACION'
                                        ? "Confirmar y Enviar a Post-Impresión"
                                        : "Confirmar y Enviar"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnviarAImpresionModal;
