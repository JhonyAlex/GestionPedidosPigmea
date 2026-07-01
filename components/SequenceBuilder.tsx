import React from 'react';
import { Etapa } from '../types';
import { ETAPAS, KANBAN_FUNNELS } from '../constants';
import { isDntCliente, normalizePostImpresionSequence } from '../utils/dntWorkflow';
import { formatStageTitle } from '../utils/formatStageTitle';

interface SequenceBuilderProps {
    sequence: Etapa[];
    onChange: (newSequence: Etapa[]) => void;
    isReadOnly: boolean;
    clienteName?: string;
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
const UpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>;
const DownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>;

const SequenceBuilder: React.FC<SequenceBuilderProps> = ({ sequence: rawSequence, onChange, isReadOnly, clienteName }) => {
    // Filter: only post-impresión stages are valid in the work sequence.
    const validPostImpresionStages = KANBAN_FUNNELS.POST_IMPRESION.stages;
    const sequence = normalizePostImpresionSequence(rawSequence, clienteName).filter(stage => validPostImpresionStages.includes(stage));
    const showDntStage = isDntCliente(clienteName);

    // Phase B: All machines remain visible in the "Available" panel at all times.
    // Duplicates are allowed — each click adds another occurrence.
    const availableStages = validPostImpresionStages.filter(
        stage => showDntStage || stage !== Etapa.POST_DNT
    );

    const handleAdd = (stage: Etapa) => {
        if (isReadOnly) return;
        // Append — normalizePostImpresionSequence handles DNT logic but preserves duplicates.
        onChange(normalizePostImpresionSequence([...sequence, stage], clienteName));
    };

    // Remove ONE occurrence at the given index (not all occurrences of that stage).
    const handleRemoveAtIndex = (index: number) => {
        if (isReadOnly) return;
        const newSequence = sequence.filter((_, i) => i !== index);
        onChange(normalizePostImpresionSequence(newSequence, clienteName));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (isReadOnly) return;
        const newSequence = [...sequence];
        const to = direction === 'up' ? index - 1 : index + 1;
        if (to < 0 || to >= newSequence.length) return;
        [newSequence[index], newSequence[to]] = [newSequence[to], newSequence[index]]; // Swap
        onChange(normalizePostImpresionSequence(newSequence, clienteName));
    };

    const StageButton = ({ stage, index, onClick, icon, disabled, title, isAvailable }: {
        stage: Etapa;
        index?: number;
        onClick: () => void;
        icon: React.ReactNode;
        disabled: boolean;
        title: string;
        isAvailable?: boolean;
    }) => (
        <li
            key={isAvailable ? `avail-${stage}` : `${stage}-${index}`}
            className={`flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md ${
                !isReadOnly && isAvailable ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''
            }`}
            onClick={isAvailable && !isReadOnly ? onClick : undefined}
        >
            <span className="text-sm font-medium">{formatStageTitle(ETAPAS[stage].title)}</span>
            {!isReadOnly && (
                <div className="flex items-center gap-1" onClick={(e) => isAvailable && e.stopPropagation()}>
                    {title === 'reorder' && index != null && (
                        <>
                            <button type="button" onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Mover arriba"><UpIcon/></button>
                            <button type="button" onClick={() => handleMove(index, 'down')} disabled={index === sequence.length - 1} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Mover abajo"><DownIcon/></button>
                        </>
                    )}
                    <button type="button" onClick={onClick} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" aria-label={title}>{icon}</button>
                </div>
            )}
        </li>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna de Etapas Disponibles */}
            <div>
                <h4 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-300">Etapas de Post-Impresión Disponibles</h4>
                <div className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg h-48 overflow-y-auto">
                    {availableStages.length > 0 ? (
                        <ul className="space-y-2">
                           {availableStages.map(stage => (
                                <StageButton
                                    key={`avail-${stage}`}
                                    stage={stage}
                                    onClick={() => handleAdd(stage)}
                                    icon={<PlusIcon />}
                                    disabled={isReadOnly}
                                    title="Añadir a secuencia"
                                    isAvailable={true}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-gray-500">No hay más etapas.</div>
                    )}
                </div>
            </div>

            {/* Columna de Secuencia de Trabajo */}
            <div>
                 <h4 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-300">Secuencia de Trabajo Definida</h4>
                 <div className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg h-48 overflow-y-auto">
                    {sequence.length > 0 ? (
                        <ul className="space-y-2">
                             {sequence.map((stage, index) => (
                                <StageButton
                                    key={`${stage}-${index}`}
                                    stage={stage}
                                    index={index}
                                    onClick={() => handleRemoveAtIndex(index)}
                                    icon={<MinusIcon />}
                                    disabled={isReadOnly}
                                    title="reorder"
                                />
                            ))}
                        </ul>
                    ) : (
                         <div className="flex items-center justify-center h-full text-sm text-gray-500">Añada etapas desde la izquierda.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SequenceBuilder;
