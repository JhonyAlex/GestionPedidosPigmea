
import { Etapa, Prioridad, KanbanEtapa } from './types';

export const ETAPAS: Record<Etapa, KanbanEtapa> = {
    [Etapa.PENDIENTE]: { id: Etapa.PENDIENTE, title: 'Pendiente', color: 'bg-gray-500' },
    [Etapa.IMPRESION]: { id: Etapa.IMPRESION, title: 'Impresión', color: 'bg-blue-600' },
    [Etapa.LAMINADO]: { id: Etapa.LAMINADO, title: 'Laminado', color: 'bg-purple-600' },
    [Etapa.CORTE]: { id: Etapa.CORTE, title: 'Corte', color: 'bg-yellow-600' },
    [Etapa.ENTREGA]: { id: Etapa.ENTREGA, title: 'Entrega', color: 'bg-teal-600' },
    [Etapa.COMPLETADO]: { id: Etapa.COMPLETADO, title: 'Completado', color: 'bg-green-600' },
    [Etapa.ARCHIVADO]: { id: Etapa.ARCHIVADO, title: 'Archivado', color: 'bg-red-800' },
};

// Etapas a mostrar en el Kanban (excluye Pendiente y Archivado)
export const ETAPAS_KANBAN: Etapa[] = [
    Etapa.IMPRESION,
    Etapa.LAMINADO,
    Etapa.CORTE,
    // Etapa.ENTREGA,
    Etapa.COMPLETADO,
];

export const PRIORIDAD_ORDEN: Record<Prioridad, number> = {
    [Prioridad.URGENTE]: 1,
    [Prioridad.ALTA]: 2,
    [Prioridad.NORMAL]: 3,
    [Prioridad.BAJA]: 4,
};

export const PRIORIDAD_COLORS: Record<Prioridad, string> = {
    [Prioridad.URGENTE]: 'border-red-500',
    [Prioridad.ALTA]: 'border-orange-500',
    [Prioridad.NORMAL]: 'border-blue-500',
    [Prioridad.BAJA]: 'border-gray-500',
}
