import { Etapa, Prioridad, KanbanEtapa, EstadoCliché } from './types';

export const ETAPAS: Record<Etapa, KanbanEtapa> = {
    [Etapa.PREPARACION]: { id: Etapa.PREPARACION, title: 'Preparación', color: 'bg-yellow-500' },
    [Etapa.PENDIENTE]: { id: Etapa.PENDIENTE, title: 'Pendiente', color: 'bg-gray-500' },
    
    // Colores para el embudo de Impresión (tonos Cian/Azul)
    [Etapa.IMPRESION_WM1]: { id: Etapa.IMPRESION_WM1, title: 'Windmöller 1', color: 'bg-cyan-600' },
    [Etapa.IMPRESION_GIAVE]: { id: Etapa.IMPRESION_GIAVE, title: 'GIAVE', color: 'bg-cyan-700' },
    [Etapa.IMPRESION_WM3]: { id: Etapa.IMPRESION_WM3, title: 'Windmöller 3', color: 'bg-cyan-800' },
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

// Columnas para la nueva vista de Preparación
export const PREPARACION_SUB_ETAPAS_IDS = {
  MATERIAL_NO_DISPONIBLE: 'MATERIAL_NO_DISPONIBLE',
  CLICHE_NO_DISPONIBLE: 'CLICHE_NO_DISPONIBLE',
  CLICHE_PENDIENTE: 'CLICHE_PENDIENTE',
  CLICHE_REPETICION: 'CLICHE_REPETICION',
  CLICHE_NUEVO: 'CLICHE_NUEVO',
  LISTO_PARA_PRODUCCION: 'LISTO_PARA_PRODUCCION',
} as const;


export const PREPARACION_COLUMNS = [
    { id: PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE, title: 'Material No Disponible', color: 'bg-red-500' },
    { id: PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE, title: 'Cliché no disponible', color: 'bg-yellow-600' },
    { id: PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE, title: 'Cliché: Pendiente Cliente', color: 'bg-blue-500' },
    { id: PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION, title: 'Cliché: Repetición/Cambio', color: 'bg-indigo-500' },
    { id: PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO, title: 'Cliché: Nuevo', color: 'bg-purple-500' },
    { id: PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION, title: 'Listo para Producción', color: 'bg-green-500' },
];

export const KANBAN_FUNNELS = {
    IMPRESION: {
        title: 'Impresión',
        stages: [
            Etapa.IMPRESION_WM1,
            Etapa.IMPRESION_GIAVE,
            Etapa.IMPRESION_WM3,
            Etapa.IMPRESION_ANON,
        ],
    },
    POST_IMPRESION: {
        title: 'Post-Impresión',
        stages: [
            Etapa.POST_LAMINACION_SL2,      // Fila 1
            Etapa.POST_LAMINACION_NEXUS,    // Fila 1
            Etapa.POST_REBOBINADO_S2DT,     // Fila 1
            Etapa.POST_REBOBINADO_PROSLIT,  // Fila 1
            Etapa.POST_REBOBINADO_TEMAC,    // Fila 1
            Etapa.POST_PERFORACION_MIC,     // Fila 2
            Etapa.POST_PERFORACION_MAC,     // Fila 2
        ],
    },
};

// Agrupaciones específicas para los filtros visuales
export const STAGE_GROUPS = {
    IMPRESION: {
        title: 'Impresión',
        stages: [
            Etapa.IMPRESION_WM1,
            Etapa.IMPRESION_GIAVE,
            Etapa.IMPRESION_WM3,
            Etapa.IMPRESION_ANON,
        ],
    },
    LAMINACION: {
        title: 'Laminación',
        stages: [
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_NEXUS,
        ],
    },
    REBOBINADO_Y_PERFORACION: {
        title: 'Rebobinado y Perforación',
        stages: [
            Etapa.POST_REBOBINADO_S2DT,
            Etapa.POST_REBOBINADO_PROSLIT,
            Etapa.POST_PERFORACION_MIC,
            Etapa.POST_PERFORACION_MAC,
            Etapa.POST_REBOBINADO_TEMAC,
        ],
    },
    OTROS: {
        title: 'Estado Final',
        stages: [
            Etapa.COMPLETADO,
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