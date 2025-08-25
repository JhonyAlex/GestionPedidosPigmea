import React from 'react';
import { Etapa } from '../types';
import { ETAPAS, KANBAN_FUNNELS } from '../constants';

interface SequenceBuilderProps {
    sequence: Etapa[];
    onChange: (newSequence: Etapa[]) => void;
    isReadOnly: boolean;
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
const UpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>;
const DownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>;

const SequenceBuilder: React.FC<SequenceBuilderProps> = ({ sequence, onChange, isReadOnly }) => {
    const availableStages = KANBAN_FUNNELS.POST_IMPRESION.stages.filter(
        stage => !sequence.includes(stage)
    );

    const handleAdd = (stage: Etapa) => {
        if (isReadOnly) return;
        onChange([...sequence, stage]);
    };

    const handleRemove = (stage: Etapa) => {
        if (isReadOnly) return;
        onChange(sequence.filter(s => s !== stage));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (isReadOnly) return;
        const newSequence = [...sequence];
        const to = direction === 'up' ? index - 1 : index + 1;
        if (to < 0 || to >= newSequence.length) return;
        [newSequence[index], newSequence[to]] = [newSequence[to], newSequence[index]]; // Swap
        onChange(newSequence);
    };

    const StageButton = ({ stage, onClick, icon, disabled, title }: { stage: Etapa, onClick: () => void, icon: React.ReactNode, disabled: boolean, title: string }) => (
        <li key={stage} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            <span className="text-sm font-medium">{ETAPAS[stage].title}</span>
            {!isReadOnly && (
                <div className="flex items-center gap-1">
                    {title === 'reorder' && (
                        <>
                            <button type="button" onClick={() => handleMove(sequence.indexOf(stage), 'up')} disabled={sequence.indexOf(stage) === 0} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Mover arriba"><UpIcon/></button>
                            <button type="button" onClick={() => handleMove(sequence.indexOf(stage), 'down')} disabled={sequence.indexOf(stage) === sequence.length - 1} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Mover abajo"><DownIcon/></button>
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
                                <StageButton key={stage} stage={stage} onClick={() => handleAdd(stage)} icon={<PlusIcon />} disabled={isReadOnly} title="Añadir a secuencia" />
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
                             {sequence.map(stage => (
                                <StageButton key={stage} stage={stage} onClick={() => handleRemove(stage)} icon={<MinusIcon />} disabled={isReadOnly} title="reorder"/>
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
