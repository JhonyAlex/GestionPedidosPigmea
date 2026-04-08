import { Etapa, Prioridad, KanbanEtapa, EstadoCliché } from './types';

export const ETAPAS: Record<Etapa, KanbanEtapa> = {
    [Etapa.PREPARACION]: { id: Etapa.PREPARACION, title: 'Preparación', color: 'bg-yellow-500' },
    [Etapa.PENDIENTE]: { id: Etapa.PENDIENTE, title: 'Pendiente', color: 'bg-gray-500' },

    // Colores para el embudo de Impresión (tonos Cian/Azul)
    [Etapa.IMPRESION_WM1]: { id: Etapa.IMPRESION_WM1, title: 'Windmöller 1', color: 'bg-cyan-600' },
    [Etapa.IMPRESION_GIAVE]: { id: Etapa.IMPRESION_GIAVE, title: 'GIAVE', color: 'bg-cyan-700' },
    [Etapa.IMPRESION_WM3]: { id: Etapa.IMPRESION_WM3, title: 'Windmöller 3', color: 'bg-cyan-800' },

    // Colores para el embudo de Post-Impresión (tonos variados: Indigo, Púrpura, Rosa, Gris)
    [Etapa.POST_DNT]: { id: Etapa.POST_DNT, title: 'DNT', color: 'bg-teal-700' },
    [Etapa.POST_LAMINACION_SL2]: { id: Etapa.POST_LAMINACION_SL2, title: 'SL2', color: 'bg-indigo-500' },
    [Etapa.POST_LAMINACION_NEXUS]: { id: Etapa.POST_LAMINACION_NEXUS, title: 'NEXUS', color: 'bg-indigo-600' },
    [Etapa.POST_LAMINACION_SL2_EVO]: { id: Etapa.POST_LAMINACION_SL2_EVO, title: 'SL2 EVO', color: 'bg-indigo-700' },
    [Etapa.POST_ECCONVERT_21]: { id: Etapa.POST_ECCONVERT_21, title: 'Ec-convert 21', color: 'bg-gray-600' },
    [Etapa.POST_ECCONVERT_22]: { id: Etapa.POST_ECCONVERT_22, title: 'Ec-convert 22', color: 'bg-gray-700' },
    [Etapa.POST_REBOBINADO_S2DT]: { id: Etapa.POST_REBOBINADO_S2DT, title: 'S2DT', color: 'bg-purple-500' },
    [Etapa.POST_REBOBINADO_PROSLIT]: { id: Etapa.POST_REBOBINADO_PROSLIT, title: 'PROSLIT', color: 'bg-purple-600' },
    [Etapa.POST_PERFORACION_MIC]: { id: Etapa.POST_PERFORACION_MIC, title: 'Microperforadora', color: 'bg-pink-500' },
    [Etapa.POST_PERFORACION_MAC]: { id: Etapa.POST_PERFORACION_MAC, title: 'Macroperforadora 1', color: 'bg-pink-600' },
    [Etapa.POST_PERFORACION_MAC2]: { id: Etapa.POST_PERFORACION_MAC2, title: 'Macroperforadora 2', color: 'bg-pink-700' },

    [Etapa.COMPLETADO]: { id: Etapa.COMPLETADO, title: 'Completado', color: 'bg-green-600' },
    [Etapa.ARCHIVADO]: { id: Etapa.ARCHIVADO, title: 'Archivado', color: 'bg-red-800' },
};

// Columnas para la nueva vista de Preparación
export const PREPARACION_SUB_ETAPAS_IDS = {
    GESTION_NO_INICIADA: 'GESTION_NO_INICIADA',
    MATERIAL_NO_DISPONIBLE: 'MATERIAL_NO_DISPONIBLE',
    CLICHE_NO_DISPONIBLE: 'CLICHE_NO_DISPONIBLE',
    LISTO_PARA_PRODUCCION: 'LISTO_PARA_PRODUCCION',
} as const;


export const PREPARACION_COLUMNS = [
    // FILA 1: Gestión Suministros (3 columnas)
    { id: PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA, title: 'Sin Gestión Iniciada', color: 'bg-gray-500' },
    { id: PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE, title: 'Material No Disponible', color: 'bg-red-500' },
    { id: PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE, title: 'Cliché no disponible', color: 'bg-yellow-600' },

    // FILA 2: Listos para Fabricación (1 columna)
    { id: PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION, title: 'Listo para Producción', color: 'bg-green-500' },
];

export const KANBAN_FUNNELS = {
    IMPRESION: {
        title: 'Impresión',
        stages: [
            Etapa.IMPRESION_WM1,
            Etapa.IMPRESION_GIAVE,
            Etapa.IMPRESION_WM3,

        ],
    },
    POST_IMPRESION: {
        title: 'Post-Impresión',
        stages: [
            Etapa.POST_DNT,
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_NEXUS,
            Etapa.POST_LAMINACION_SL2_EVO,
            Etapa.POST_ECCONVERT_21,
            Etapa.POST_ECCONVERT_22,
            Etapa.POST_REBOBINADO_S2DT,
            Etapa.POST_REBOBINADO_PROSLIT,
            Etapa.POST_PERFORACION_MIC,
            Etapa.POST_PERFORACION_MAC,
            Etapa.POST_PERFORACION_MAC2,
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

        ],
    },
    DNT: {
        title: 'DNT',
        stages: [
            Etapa.POST_DNT,
        ],
    },
    LAMINACION: {
        title: 'Laminación',
        stages: [
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_NEXUS,
            Etapa.POST_LAMINACION_SL2_EVO,
        ],
    },
    REBOBINADO: {
        title: 'Rebobinado',
        stages: [
            Etapa.POST_REBOBINADO_S2DT,
            Etapa.POST_REBOBINADO_PROSLIT,
            Etapa.POST_ECCONVERT_21,
            Etapa.POST_ECCONVERT_22,
        ],
    },
    PERFORACION: {
        title: 'Perforación',
        stages: [
            Etapa.POST_PERFORACION_MAC,
            Etapa.POST_PERFORACION_MAC2,
            Etapa.POST_PERFORACION_MIC,
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

export const KANBAN_VISUAL_LAYOUT = {
    topRow: [
        Etapa.IMPRESION_WM1,
        Etapa.IMPRESION_GIAVE,
        Etapa.IMPRESION_WM3,
        Etapa.POST_DNT,
    ],
    postImpresionRows: [
        { title: 'Laminación', stages: [Etapa.POST_LAMINACION_SL2, Etapa.POST_LAMINACION_NEXUS, Etapa.POST_LAMINACION_SL2_EVO] },
        { title: 'Rebobinado', stages: [Etapa.POST_REBOBINADO_S2DT, Etapa.POST_REBOBINADO_PROSLIT, Etapa.POST_ECCONVERT_21, Etapa.POST_ECCONVERT_22] },
        { title: 'Perforación', stages: [Etapa.POST_PERFORACION_MAC, Etapa.POST_PERFORACION_MAC2, Etapa.POST_PERFORACION_MIC] },
    ],
} as const;


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

// Máquinas de impresión disponibles (usando los títulos tal como se guardan en maquinaImpresion)
export const MAQUINAS_IMPRESION = [
    { id: 'Windmöller 1', nombre: 'Windmöller 1' },
    { id: 'GIAVE', nombre: 'GIAVE' },
    { id: 'Windmöller 3', nombre: 'Windmöller 3' },
    { id: 'Anónimo', nombre: 'Anónimo' },

] as const;