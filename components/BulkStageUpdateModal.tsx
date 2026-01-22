import React, { useMemo, useState } from 'react';
import { Etapa, Pedido } from '../types';
import { ETAPAS, KANBAN_FUNNELS, PREPARACION_COLUMNS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';

interface BulkStageUpdateModalProps {
    isOpen: boolean;
    pedidos: Pedido[];
    onConfirm: (etapa: Etapa, subEtapa?: string | null) => Promise<void>;
    onCancel: () => void;
}

const StagePill = ({ label }: { label: string }) => (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 rounded-full">
        {label}
    </span>
);

const stageGroups: { title: string; stages: Etapa[] }[] = [
    { title: 'Preparación', stages: [Etapa.PREPARACION] },
    { title: 'Impresión', stages: [...KANBAN_FUNNELS.IMPRESION.stages] },
    { title: 'Post-Impresión', stages: [...KANBAN_FUNNELS.POST_IMPRESION.stages] },
    { title: 'Final', stages: [Etapa.COMPLETADO] },
];

const BulkStageUpdateModal: React.FC<BulkStageUpdateModalProps> = ({ isOpen, pedidos, onConfirm, onCancel }) => {
    const [selectedStage, setSelectedStage] = useState<Etapa | ''>('');
    const [selectedSubStage, setSelectedSubStage] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const uniqueStages = useMemo(() => {
        const stages = new Set(pedidos.map(p => p.etapaActual));
        return Array.from(stages).map(stage => ETAPAS[stage]?.title || stage);
    }, [pedidos]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedStage || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selectedStage as Etapa, selectedStage === Etapa.PREPARACION ? selectedSubStage || null : null);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-emerald-500 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        Cambio masivo de etapa
                        <StagePill label={`${pedidos.length} seleccionado${pedidos.length !== 1 ? 's' : ''}`} />
                    </h2>
                    <p className="text-sm text-emerald-100 mt-1">Mueve todos los pedidos seleccionados a una etapa común.</p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Etapa actual (resumen)</p>
                            <div className="flex flex-wrap gap-2">
                                {uniqueStages.length === 0 ? (
                                    <span className="text-gray-500 text-sm">Sin datos</span>
                                ) : (
                                    uniqueStages.map(stage => <StagePill key={stage} label={stage} />)
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Nueva etapa</label>
                            <div className="space-y-3">
                                <select
                                    value={selectedStage}
                                    onChange={(e) => setSelectedStage(e.target.value as Etapa)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" disabled>Selecciona una etapa</option>
                                    {stageGroups.map(group => (
                                        <optgroup key={group.title} label={group.title}>
                                            {group.stages.map(stage => (
                                                <option key={stage} value={stage}>
                                                    {ETAPAS[stage]?.title || stage}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                {selectedStage === Etapa.PREPARACION && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Sub-etapa de preparación</label>
                                        <select
                                            value={selectedSubStage}
                                            onChange={(e) => setSelectedSubStage(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Sin cambiar sub-etapa</option>
                                            {PREPARACION_COLUMNS.map(col => (
                                                <option key={col.id} value={col.id}>{col.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    No se incluye Archivado aquí; usa la acción de Archivar para ese propósito.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Pedidos afectados</p>
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                {pedidos.map(p => (
                                    <li key={p.id} className="px-3 py-2 flex items-center gap-2">
                                        <span className="font-semibold text-gray-900 dark:text-white">{p.numeroPedidoCliente}</span>
                                        <span className="text-gray-600 dark:text-gray-400 truncate">{p.cliente}</span>
                                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">{ETAPAS[p.etapaActual]?.title || p.etapaActual}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedStage || isSubmitting}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Moviendo...
                            </>
                        ) : (
                            <>Mover a etapa</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkStageUpdateModal;
