
import { Pedido, Prioridad, Etapa, TipoImpresion, EstadoCliché, UserRole } from '../types';

const adminUser: UserRole = 'Administrador';

export const initialPedidos: Pedido[] = [
     {
        id: '0',
        secuenciaPedido: 100,
        orden: 100,
        numeroRegistro: 'REG-20240717-0800-100',
        numeroPedidoCliente: 'PREP-001',
        cliente: 'Cliente de Prueba',
        maquinaImpresion: '',
        metros: 500,
        fechaCreacion: '2024-07-17T08:00:00Z',
        fechaEntrega: '2024-07-25',
        etapaActual: Etapa.PREPARACION,
        etapasSecuencia: [{ etapa: Etapa.PREPARACION, fecha: '2024-07-17T08:00:00Z' }],
        prioridad: Prioridad.NORMAL,
        tipoImpresion: TipoImpresion.SUPERFICIE,
        desarrollo: '400',
        capa: 1,
        tiempoProduccionPlanificado: '08:00',
        secuenciaTrabajo: [],
        observaciones: 'Pedido en preparación, material no disponible.',
        historial: [{ timestamp: '2024-07-17T08:00:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado en Preparación.' }],
        materialDisponible: false,
        estadoCliché: EstadoCliché.PENDIENTE_CLIENTE,
    },
    {
        id: '1',
        secuenciaPedido: 101,
        orden: 101,
        numeroRegistro: 'REG-20240718-0900-101',
        numeroPedidoCliente: 'GV-2024-789',
        cliente: 'Graficas Veloz',
        maquinaImpresion: 'Windmöller 1',
        metros: 150,
        fechaCreacion: '2024-07-18T09:00:00Z',
        fechaEntrega: '2024-07-20',
        etapaActual: Etapa.IMPRESION_WM1,
        etapasSecuencia: [
            { etapa: Etapa.PREPARACION, fecha: '2024-07-18T09:00:00Z'},
            { etapa: Etapa.IMPRESION_WM1, fecha: '2024-07-20T10:00:00Z' }
        ],
        prioridad: Prioridad.URGENTE,
        tipoImpresion: TipoImpresion.SUPERFICIE,
        desarrollo: '540',
        capa: 1,
        tiempoProduccionPlanificado: '04:30',
        secuenciaTrabajo: [Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT, Etapa.POST_PERFORACION_MIC],
        observaciones: 'Cliente necesita entrega antes del mediodía.',
        historial: [
            { timestamp: '2024-07-18T09:00:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado.' },
            { timestamp: '2024-07-20T10:00:00Z', usuario: adminUser, accion: 'Cambio de Etapa', detalles: 'Movido a Windmöller 1.' }
        ],
        materialDisponible: true,
        estadoCliché: EstadoCliché.NUEVO,
    },
    {
        id: '2',
        secuenciaPedido: 102,
        orden: 102,
        numeroRegistro: 'REG-20240719-1130-102',
        numeroPedidoCliente: 'PE-2024-112',
        cliente: 'PubliExpress',
        maquinaImpresion: 'GIAVE',
        metros: 75,
        fechaCreacion: '2024-07-19T11:30:00Z',
        fechaEntrega: '2024-07-21',
        etapaActual: Etapa.IMPRESION_GIAVE,
        etapasSecuencia: [
            { etapa: Etapa.PREPARACION, fecha: '2024-07-19T11:30:00Z' },
            { etapa: Etapa.IMPRESION_GIAVE, fecha: '2024-07-21T09:15:00Z' }
        ],
        prioridad: Prioridad.ALTA,
        tipoImpresion: TipoImpresion.TRANSPARENCIA,
        desarrollo: '620',
        capa: 2,
        tiempoProduccionPlanificado: '02:00',
        secuenciaTrabajo: [Etapa.POST_LAMINACION_NEXUS],
        observaciones: 'Verificar colores corporativos. Pantone 286 C.',
        historial: [
            { timestamp: '2024-07-19T11:30:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado.' },
            { timestamp: '2024-07-21T09:15:00Z', usuario: adminUser, accion: 'Cambio de Etapa', detalles: 'Movido a GIAVE.' }
        ],
        materialDisponible: true,
        estadoCliché: EstadoCliché.REPETICION_CAMBIO,
    },
     {
        id: '2.5',
        secuenciaPedido: 115,
        orden: 115,
        numeroRegistro: 'REG-20240723-1000-115',
        numeroPedidoCliente: 'PREP-002',
        cliente: 'Marketing Visual',
        maquinaImpresion: '',
        metros: 1200,
        fechaCreacion: '2024-07-23T10:00:00Z',
        fechaEntrega: '2024-07-30',
        etapaActual: Etapa.PREPARACION,
        etapasSecuencia: [{ etapa: Etapa.PREPARACION, fecha: '2024-07-23T10:00:00Z' }],
        prioridad: Prioridad.ALTA,
        tipoImpresion: TipoImpresion.SUPERFICIE,
        desarrollo: '800',
        capa: 1,
        tiempoProduccionPlanificado: '12:00',
        secuenciaTrabajo: [],
        observaciones: 'Material disponible, esperando cliché del cliente.',
        historial: [{ timestamp: '2024-07-23T10:00:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado en Preparación.' }],
        materialDisponible: true,
        estadoCliché: EstadoCliché.PENDIENTE_CLIENTE,
    },
    {
        id: '3',
        secuenciaPedido: 103,
        orden: 103,
        numeroRegistro: 'REG-20240720-1400-103',
        numeroPedidoCliente: 'MV-2024-331',
        cliente: 'Marketing Visual',
        maquinaImpresion: 'Windmöller 3',
        metros: 200,
        fechaCreacion: '2024-07-20T14:00:00Z',
        fechaEntrega: '2024-07-22',
        etapaActual: Etapa.POST_LAMINACION_SL2,
        etapasSecuencia: [
            { etapa: Etapa.PREPARACION, fecha: '2024-07-20T14:00:00Z' },
            { etapa: Etapa.IMPRESION_WM3, fecha: '2024-07-22T11:00:00Z' },
            { etapa: Etapa.POST_LAMINACION_SL2, fecha: '2024-07-22T15:30:00Z' },
        ],
        prioridad: Prioridad.NORMAL,
        tipoImpresion: TipoImpresion.SUPERFICIE,
        desarrollo: 'N/A',
        capa: 1,
        tiempoProduccionPlanificado: '06:00',
        secuenciaTrabajo: [Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_TEMAC],
        observaciones: 'Laminado mate.',
        historial: [
            { timestamp: '2024-07-20T14:00:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado.' },
            { timestamp: '2024-07-22T15:30:00Z', usuario: adminUser, accion: 'Cambio de Etapa', detalles: 'Movido a Laminación SL2.' }
        ],
        materialDisponible: true,
        estadoCliché: EstadoCliché.NUEVO,
    },
    {
        id: '4',
        secuenciaPedido: 104,
        orden: 104,
        numeroRegistro: 'REG-20240720-1600-104',
        numeroPedidoCliente: 'EG-2024-505',
        cliente: 'Eventos Globales',
        maquinaImpresion: 'ANON',
        metros: 300,
        fechaCreacion: '2024-07-20T16:00:00Z',
        fechaEntrega: '2024-07-22',
        etapaActual: Etapa.POST_REBOBINADO_S2DT,
        etapasSecuencia: [
            { etapa: Etapa.PREPARACION, fecha: '2024-07-20T16:00:00Z' },
            { etapa: Etapa.IMPRESION_ANON, fecha: '2024-07-22T08:00:00Z' },
            { etapa: Etapa.POST_LAMINACION_NEXUS, fecha: '2024-07-22T12:00:00Z' },
            { etapa: Etapa.POST_REBOBINADO_S2DT, fecha: '2024-07-22T16:00:00Z' },
        ],
        prioridad: Prioridad.ALTA,
        tipoImpresion: TipoImpresion.TRANSPARENCIA,
        desarrollo: '780',
        capa: 3,
        tiempoProduccionPlanificado: '08:00',
        secuenciaTrabajo: [Etapa.POST_LAMINACION_NEXUS, Etapa.POST_REBOBINADO_S2DT, Etapa.POST_PERFORACION_MAC],
        observaciones: 'Corte preciso para cajas de luz.',
        historial: [
             { timestamp: '2024-07-20T16:00:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado.' },
             { timestamp: '2024-07-22T16:00:00Z', usuario: adminUser, accion: 'Cambio de Etapa', detalles: 'Movido a Rebobinado S2DT.' }
        ],
        materialDisponible: true,
        estadoCliché: EstadoCliché.REPETICION_CAMBIO,
    },
    {
        id: '5',
        secuenciaPedido: 105,
        orden: 105,
        numeroRegistro: 'REG-20240721-0800-105',
        numeroPedidoCliente: 'FA-2024-023',
        cliente: 'Feria Anual',
        maquinaImpresion: 'Windmöller 1',
        metros: 50,
        fechaCreacion: '2024-07-21T08:00:00Z',
        fechaEntrega: '2024-07-23',
        etapaActual: Etapa.COMPLETADO,
        etapasSecuencia: [
            { etapa: Etapa.PREPARACION, fecha: '2024-07-21T08:00:00Z' },
            { etapa: Etapa.IMPRESION_WM1, fecha: '2024-07-23T09:00:00Z' },
            { etapa: Etapa.POST_PERFORACION_MIC, fecha: '2024-07-23T11:00:00Z' },
            { etapa: Etapa.COMPLETADO, fecha: '2024-07-23T12:00:00Z' },
        ],
        fechaFinalizacion: '2024-07-23T12:00:00Z',
        tiempoTotalProduccion: '2 día(s), 4 hora(s)',
        prioridad: Prioridad.NORMAL,
        tipoImpresion: TipoImpresion.SUPERFICIE,
        desarrollo: '320',
        capa: 1,
        tiempoProduccionPlanificado: '03:00',
        secuenciaTrabajo: [Etapa.POST_PERFORACION_MIC],
        observaciones: 'Listo para recoger.',
        historial: [
            { timestamp: '2024-07-21T08:00:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado.' },
            { timestamp: '2024-07-23T12:00:00Z', usuario: adminUser, accion: 'Cambio de Etapa', detalles: 'Pedido completado.' }
        ],
        materialDisponible: true,
        estadoCliché: EstadoCliché.NUEVO,
    },
    {
        id: '6',
        secuenciaPedido: 106,
        orden: 106,
        numeroRegistro: 'REG-20240718-1000-106',
        numeroPedidoCliente: 'TS-2024-451',
        cliente: 'Tiendas del Sur',
        maquinaImpresion: 'Windmöller 1',
        metros: 120,
        fechaCreacion: '2024-07-18T10:00:00Z',
        fechaEntrega: '2024-07-20',
        etapaActual: Etapa.ARCHIVADO,
        etapasSecuencia: [
            { etapa: Etapa.PREPARACION, fecha: '2024-07-18T10:00:00Z' },
            { etapa: Etapa.IMPRESION_WM1, fecha: '2024-07-20T14:00:00Z' },
            { etapa: Etapa.COMPLETADO, fecha: '2024-07-20T18:00:00Z' },
            { etapa: Etapa.ARCHIVADO, fecha: '2024-07-21T10:00:00Z' },
        ],
        fechaFinalizacion: '2024-07-20T18:00:00Z',
        tiempoTotalProduccion: '2 día(s), 8 hora(s)',
        prioridad: Prioridad.BAJA,
        tipoImpresion: TipoImpresion.TRANSPARENCIA,
        desarrollo: '450',
        capa: 2,
        tiempoProduccionPlanificado: '05:00',
        secuenciaTrabajo: [],
        observaciones: 'Entregado y facturado.',
        historial: [
            { timestamp: '2024-07-18T10:00:00Z', usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado.' },
            { timestamp: '2024-07-21T10:00:00Z', usuario: adminUser, accion: 'Archivado', detalles: 'Pedido archivado.' }
        ],
        materialDisponible: true,
        estadoCliché: EstadoCliché.REPETICION_CAMBIO,
    },
    ...Array.from({ length: 14 }, (_, i) => {
        const id = (i + 7).toString();
        const secuencia = 106 + i + 1;
        const randomDay = (i % 10) + 20;
        const fechaCreacion = new Date(`2024-07-${randomDay - Math.floor(Math.random()*3+1)}T12:00:00Z`);
        
        const numeroRegistro = `REG-${fechaCreacion.toISOString().slice(0,10).replace(/-/g,'')}-${secuencia}`;
        const numeroPedidoCliente = `PO-${Math.floor(Math.random() * 900) + 100}`;
        
        const clientes = ['Innovación Gráfica', 'Imprenta Rápida', 'Diseño Total', 'Comunica Visual'];
        const maquinas = ['HP Latex 800W', 'Roland VG2-640', 'Epson SureColor S80600'];
        const tipos = Object.values(TipoImpresion);
        const prioridades = Object.values(Prioridad);
        const etapas = [
            Etapa.IMPRESION_WM1, Etapa.IMPRESION_GIAVE, Etapa.POST_LAMINACION_NEXUS, Etapa.POST_REBOBINADO_PROSLIT, 
            Etapa.POST_PERFORACION_MAC, Etapa.COMPLETADO
        ];
        
        const etapaActual = etapas[i % etapas.length];
        const fechaEntrega = `2024-07-${randomDay}`;

        const postImpresionStages = [Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT, Etapa.POST_PERFORACION_MIC, Etapa.POST_REBOBINADO_TEMAC];

        return {
            id: id,
            secuenciaPedido: secuencia,
            orden: secuencia,
            numeroRegistro,
            numeroPedidoCliente,
            cliente: clientes[i % clientes.length],
            maquinaImpresion: maquinas[i % maquinas.length],
            metros: Math.floor(Math.random() * 200) + 20,
            fechaCreacion: fechaCreacion.toISOString(),
            fechaEntrega: fechaEntrega,
            etapaActual: etapaActual,
            etapasSecuencia: [{ etapa: Etapa.PREPARACION, fecha: fechaCreacion.toISOString() }, { etapa: etapaActual, fecha: new Date().toISOString() }],
            prioridad: prioridades[i % prioridades.length],
            tipoImpresion: tipos[i % tipos.length],
            desarrollo: `${Math.floor(Math.random() * 500) + 300}`,
            capa: Math.floor(Math.random() * 3) + 1,
            tiempoProduccionPlanificado: `${(i % 5) + 2}:00`,
            secuenciaTrabajo: postImpresionStages.slice(i % 2, i % 2 + 2),
            observaciones: `Observación de prueba para pedido ${numeroPedidoCliente}.`,
            historial: [{ timestamp: fechaCreacion.toISOString(), usuario: adminUser, accion: 'Creación', detalles: 'Pedido creado por sistema de prueba.' }],
            materialDisponible: true,
            estadoCliché: Object.values(EstadoCliché)[i % Object.values(EstadoCliché).length],
        };
    }),
];
