import { Pedido, Prioridad, Etapa } from '../types';

export const initialPedidos: Pedido[] = [
    {
        id: '1',
        secuenciaPedido: 101,
        numeroPedido: 'PED-2024-001',
        cliente: 'Graficas Veloz',
        maquinaImpresion: 'HP Latex 800W',
        metros: 150,
        fecha: '2024-07-20',
        etapaActual: Etapa.IMPRESION_WM1,
        etapasSecuencia: [{ etapa: Etapa.IMPRESION_WM1, fecha: '2024-07-20T10:00:00Z' }],
        prioridad: Prioridad.URGENTE,
        tipoImpresion: 'Lona PVC',
        tiempoProduccionPlanificado: '04:30',
        observaciones: 'Cliente necesita entrega antes del mediodía.',
    },
    {
        id: '2',
        secuenciaPedido: 102,
        numeroPedido: 'PED-2024-002',
        cliente: 'PubliExpress',
        maquinaImpresion: 'Roland VG2-640',
        metros: 75,
        fecha: '2024-07-21',
        etapaActual: Etapa.IMPRESION_GIAVE,
        etapasSecuencia: [{ etapa: Etapa.IMPRESION_GIAVE, fecha: '2024-07-21T09:15:00Z' }],
        prioridad: Prioridad.ALTA,
        tipoImpresion: 'Vinilo Adhesivo',
        tiempoProduccionPlanificado: '02:00',
        observaciones: 'Verificar colores corporativos. Pantone 286 C.',
    },
    {
        id: '3',
        secuenciaPedido: 103,
        numeroPedido: 'PED-2024-003',
        cliente: 'Marketing Visual',
        maquinaImpresion: 'Epson SureColor S80600',
        metros: 200,
        fecha: '2024-07-22',
        etapaActual: Etapa.POST_LAMINACION_SL2,
        etapasSecuencia: [
            { etapa: Etapa.IMPRESION_WM2, fecha: '2024-07-22T11:00:00Z' },
            { etapa: Etapa.POST_LAMINACION_SL2, fecha: '2024-07-22T15:30:00Z' },
        ],
        prioridad: Prioridad.NORMAL,
        tipoImpresion: 'Papel Fotográfico',
        tiempoProduccionPlanificado: '06:00',
        observaciones: 'Laminado mate.',
    },
    {
        id: '4',
        secuenciaPedido: 104,
        numeroPedido: 'PED-2024-004',
        cliente: 'Eventos Globales',
        maquinaImpresion: 'HP Latex 800W',
        metros: 300,
        fecha: '2024-07-22',
        etapaActual: Etapa.POST_REBOBINADO_S2DT,
        etapasSecuencia: [
            { etapa: Etapa.IMPRESION_ANON, fecha: '2024-07-22T08:00:00Z' },
            { etapa: Etapa.POST_LAMINACION_NEXUS, fecha: '2024-07-22T12:00:00Z' },
            { etapa: Etapa.POST_REBOBINADO_S2DT, fecha: '2024-07-22T16:00:00Z' },
        ],
        prioridad: Prioridad.ALTA,
        tipoImpresion: 'Backlight',
        tiempoProduccionPlanificado: '08:00',
        observaciones: 'Corte preciso para cajas de luz.',
    },
    {
        id: '5',
        secuenciaPedido: 105,
        numeroPedido: 'PED-2024-005',
        cliente: 'Feria Anual',
        maquinaImpresion: 'Roland VG2-640',
        metros: 50,
        fecha: '2024-07-23',
        etapaActual: Etapa.COMPLETADO,
        etapasSecuencia: [
            { etapa: Etapa.IMPRESION_WM1, fecha: '2024-07-23T09:00:00Z' },
            { etapa: Etapa.POST_PERFORACION_MIC, fecha: '2024-07-23T11:00:00Z' },
            { etapa: Etapa.COMPLETADO, fecha: '2024-07-23T12:00:00Z' },
        ],
        prioridad: Prioridad.NORMAL,
        tipoImpresion: 'Vinilo de corte',
        tiempoProduccionPlanificado: '03:00',
        observaciones: 'Listo para recoger.',
    },
    {
        id: '6',
        secuenciaPedido: 106,
        numeroPedido: 'PED-2024-006',
        cliente: 'Tiendas del Sur',
        maquinaImpresion: 'Epson SureColor S80600',
        metros: 120,
        fecha: '2024-07-20',
        etapaActual: Etapa.ARCHIVADO,
        etapasSecuencia: [
            { etapa: Etapa.IMPRESION_WM1, fecha: '2024-07-20T14:00:00Z' },
            { etapa: Etapa.COMPLETADO, fecha: '2024-07-20T18:00:00Z' },
            { etapa: Etapa.ARCHIVADO, fecha: '2024-07-21T10:00:00Z' },
        ],
        prioridad: Prioridad.BAJA,
        tipoImpresion: 'Lienzo',
        tiempoProduccionPlanificado: '05:00',
        observaciones: 'Entregado y facturado.',
    },
    ...Array.from({ length: 14 }, (_, i) => {
        const id = (i + 7).toString();
        const secuencia = 106 + i + 1;
        const numero = `PED-2024-${(i + 7).toString().padStart(3, '0')}`;
        const clientes = ['Innovación Gráfica', 'Imprenta Rápida', 'Diseño Total', 'Comunica Visual'];
        const maquinas = ['HP Latex 800W', 'Roland VG2-640', 'Epson SureColor S80600'];
        const tipos = ['Lona PVC', 'Vinilo Adhesivo', 'Papel Fotográfico', 'Backlight', 'Lienzo'];
        const prioridades = Object.values(Prioridad);
        const etapas = [
            Etapa.IMPRESION_WM1, Etapa.IMPRESION_GIAVE, Etapa.POST_LAMINACION_NEXUS, Etapa.POST_REBOBINADO_PROSLIT, 
            Etapa.POST_PERFORACION_MAC, Etapa.COMPLETADO
        ];
        
        const etapaActual = etapas[i % etapas.length];

        return {
            id: id,
            secuenciaPedido: secuencia,
            numeroPedido: numero,
            cliente: clientes[i % clientes.length],
            maquinaImpresion: maquinas[i % maquinas.length],
            metros: Math.floor(Math.random() * 200) + 20,
            fecha: `2024-07-${(i % 10) + 20}`,
            etapaActual: etapaActual,
            etapasSecuencia: [{ etapa: etapaActual, fecha: new Date().toISOString() }],
            prioridad: prioridades[i % prioridades.length],
            tipoImpresion: tipos[i % tipos.length],
            tiempoProduccionPlanificado: `${(i % 5) + 2}:00`,
            observaciones: `Observación de prueba para pedido ${numero}.`,
        };
    }),
];