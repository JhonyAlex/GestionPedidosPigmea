import { Etapa, Prioridad, KanbanEtapa } from './types';

export const ETAPAS: Record<Etapa, KanbanEtapa> = {
    [Etapa.PENDIENTE]: { id: Etapa.PENDIENTE, title: 'Pendiente', color: 'bg-gray-500' },
    
    // Colores para el embudo de Impresión (tonos Cian/Azul)
    [Etapa.IMPRESION_WM1]: { id: Etapa.IMPRESION_WM1, title: 'WM1', color: 'bg-cyan-600' },
    [Etapa.IMPRESION_GIAVE]: { id: Etapa.IMPRESION_GIAVE, title: 'GIAVE', color: 'bg-cyan-700' },
    [Etapa.IMPRESION_WM2]: { id: Etapa.IMPRESION_WM2, title: 'WM2', color: 'bg-cyan-800' },
    [Etapa.IMPRESION_ANON]: { id: Etapa.IMPRESION_ANON, title: 'ANON', color: 'bg-cyan-900' },

    // Colores para el embudo de Post-Impresión (tonos variados: Indigo, Púrpura, Rosa)
    [Etapa.POST_LAMINACION_SL2]: { id: Etapa.POST_LAMINACION_SL2, title: 'Laminación SL2', color: 'bg-indigo-500' },
    [Etapa.POST_LAMINACION_NEXUS]: { id: Etapa.POST_LAMINACION_NEXUS, title: 'Laminación NEXUS', color: 'bg-indigo-600' },
    [Etapa.POST_REBOBINADO_S2DT]: { id: Etapa.POST_REBOBINADO_S2DT, title: 'Rebobinado S2DT', color: 'bg-purple-500' },
    [Etapa.POST_REBOBINADO_PROSLIT]: { id: Etapa.POST_REBOBINADO_PROSLIT, title: 'Rebobinado PROSLIT', color: 'bg-purple-600' },
    [Etapa.POST_PERFORACION_MIC]: { id: Etapa.POST_PERFORACION_MIC, title: 'Perforación MIC', color: 'bg-pink-500' },
    [Etapa.POST_PERFORACION_MAC]: { id: Etapa.POST_PERFORACION_MAC, title: 'Perforación MAC', color: 'bg-pink-600' },
    [Etapa.POST_REBOBINADO_TEMAC]: { id: Etapa.POST_REBOBINADO_TEMAC, title: 'Rebobinado TEMAC', color: 'bg-purple-700' },

    [Etapa.COMPLETADO]: { id: Etapa.COMPLETADO, title: 'Completado', color: 'bg-green-600' },
    [Etapa.ARCHIVADO]: { id: Etapa.ARCHIVADO, title: 'Archivado', color: 'bg-red-800' },
};

export const KANBAN_FUNNELS = {
    IMPRESION: {
        title: 'Impresión',
        stages: [
            Etapa.IMPRESION_WM1,
            Etapa.IMPRESION_GIAVE,
            Etapa.IMPRESION_WM2,
            Etapa.IMPRESION_ANON,
        ],
    },
    POST_IMPRESION: {
        title: 'Post-Impresión',
        stages: [
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_NEXUS,
            Etapa.POST_REBOBINADO_S2DT,
            Etapa.POST_REBOBINADO_PROSLIT,
            Etapa.POST_PERFORACION_MIC,
            Etapa.POST_PERFORACION_MAC,
            Etapa.POST_REBOBINADO_TEMAC,
        ],
    },
};

// Etapas a mostrar en el Kanban y filtros (excluye Pendiente y Archivado)
export const ETAPAS_KANBAN: Etapa[] = [
    ...KANBAN_FUNNELS.IMPRESION.stages,
    ...KANBAN_FUNNELS.POST_IMPRESION.stages,
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