

import { Pedido, EtapaInfo, Etapa } from '../types';
import { ETAPAS, KANBAN_FUNNELS } from '../constants';
import { formatDateDDMMYYYY } from './date';

// To satisfy TypeScript since jspdf and jspdf-autotable are loaded from script tags
declare global {
    interface Window {
        jspdf: any;
    }
}


const ETAPAS_PRODUCCION = [
    Etapa.IMPRESION_WM1,
    Etapa.IMPRESION_GIAVE,
    Etapa.IMPRESION_WM3,
    Etapa.IMPRESION_ANON,
    Etapa.POST_LAMINACION_SL2,
    Etapa.POST_LAMINACION_NEXUS,
    Etapa.POST_REBOBINADO_S2DT,
    Etapa.POST_REBOBINADO_PROSLIT,
    Etapa.POST_PERFORACION_MIC,
    Etapa.POST_PERFORACION_MAC,
    Etapa.POST_REBOBINADO_TEMAC,
];

/**
 * Parses a time string in HH:mm format to total minutes.
 * @param timeStr The time string, e.g., "04:30".
 * @returns Total minutes.
 */
export const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
        return 0;
    }
    return hours * 60 + minutes;
};

/**
 * Formats total minutes into a HH:mm string format.
 * @param totalMinutes The total minutes.
 * @returns A string in HH:mm format.
 */
export const formatMinutesToHHMM = (totalMinutes: number): string => {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};


/**
 * Calculates the total real production time in minutes for an order.
 * It sums the time spent in production stages based on the `etapasSecuencia` timeline.
 * If the order is currently in a production stage, it calculates the time up to now.
 * @param pedido The order object.
 * @returns Total production time in minutes.
 */
export const calcularTiempoRealProduccion = (pedido: Pedido): number => {
    let totalMinutes = 0;
    const sortedTimeline = [...pedido.etapasSecuencia].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    for (let i = 0; i < sortedTimeline.length; i++) {
        const currentStageInfo = sortedTimeline[i];
        
        // Only calculate time for production stages
        if (ETAPAS_PRODUCCION.includes(currentStageInfo.etapa)) {
            const startTime = new Date(currentStageInfo.fecha).getTime();
            let endTime: number;

            // Find the next stage to determine the end time
            const nextStageInfo = sortedTimeline[i + 1];

            if (nextStageInfo) {
                endTime = new Date(nextStageInfo.fecha).getTime();
            } else {
                // If it's the last stage in the timeline and it's a production one,
                // it means the order is currently in this stage. Calculate up to now.
                endTime = new Date().getTime();
            }

            const durationMillis = endTime - startTime;
            totalMinutes += durationMillis / (1000 * 60);
        }
    }

    return Math.round(totalMinutes);
};

/**
 * Calculates the total time between two dates and formats it as a string.
 * @param startDate The start date in ISO format.
 * @param endDate The end date in ISO format.
 * @returns A string in "X día(s), Y hora(s)" format.
 */
export const calculateTotalProductionTime = (startDate: string, endDate: string): string => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 'N/A';
    
    const durationMillis = end - start;
    const totalHours = durationMillis / (1000 * 60 * 60);
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);
    
    return `${days} día(s), ${hours} hora(s)`;
};

// --- PDF Generation ---

// Palette of corporate, less pastel colors for client-based row coloring.
const CLIENT_COLOR_PALETTE: number[][] = [
    [191, 219, 254], // blue-200
    [165, 243, 252], // cyan-200
    [203, 213, 225], // slate-200
    [167, 243, 208], // emerald-200
    [199, 210, 254], // indigo-200
    [229, 231, 235], // gray-200
];

const getNextStageTitle = (pedido: Pedido): string => {
    const { etapaActual, secuenciaTrabajo } = pedido;
    
    if (!secuenciaTrabajo) return 'N/A';

    const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual);
    const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual);

    if (isPrinting && secuenciaTrabajo.length > 0) {
        return ETAPAS[secuenciaTrabajo[0]].title;
    }

    if (isPostPrinting) {
        const currentIndex = secuenciaTrabajo.indexOf(etapaActual);
        if (currentIndex > -1 && currentIndex < secuenciaTrabajo.length - 1) {
            return ETAPAS[secuenciaTrabajo[currentIndex + 1]].title;
        }
        if (currentIndex === secuenciaTrabajo.length - 1) {
            return ETAPAS[Etapa.COMPLETADO].title;
        }
    }
    
    return 'N/A';
};


export const generatePedidosPDF = (pedidos: Pedido[]) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4'); // 'p' for portrait (vertical orientation) - A4 portrait = 595x842 pt

    // --- HEADER ---
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('PIGMEA S.L.', 20, 28);

    // --- Document Title & Dynamic Subtitle ---
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    const mainSubtitle = 'Planificación semanal';
    let tableStartY = 50; // Adjusted start Y for the table
    doc.text(mainSubtitle, 20, 42);

    // Dynamic subtitle part based on stages present in the exported list
    const printingMachines = new Set<string>();
    const postPrintingStages = new Set<string>();

    pedidos.forEach(p => {
        if (KANBAN_FUNNELS.IMPRESION.stages.includes(p.etapaActual)) {
            printingMachines.add(ETAPAS[p.etapaActual].title);
        } else if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(p.etapaActual)) {
            postPrintingStages.add(ETAPAS[p.etapaActual].title);
        }
    });
    
    const subtitleParts: string[] = [];
    if (printingMachines.size > 0) {
        subtitleParts.push(`Impresión: ${Array.from(printingMachines).join(', ')}`);
    }
    if (postPrintingStages.size > 0) {
        subtitleParts.push(`Post-Impresión: ${Array.from(postPrintingStages).join(', ')}`);
    }
    const dynamicSubtitle = subtitleParts.join(' | ');

    if (dynamicSubtitle) {
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(dynamicSubtitle, 20, 52, { 
            maxWidth: 595 - 20 - 20, // Page width (portrait: 595pt) - margins
        });
        tableStartY = 60; 
    }
    
    // Date
    const today = new Date();
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0); 
    doc.text(formatDateDDMMYYYY(today), 575, 28, { align: 'right' });

    // Table
    const tableColumn = [
        "Des.",
        "Cliente / # Pedido",
        "Metros",
        "Tipo",
        "Capa",
        "Camisa",
        "Antiv.",
        "Láser",
        "Sig. Etapa",
        "Observaciones",
        "Creación"
    ];
    
    const tableRows = pedidos.map(p => {
        // Combinar observaciones rápidas y observaciones normales
        const obsRapidas = p.observacionesRapidas ? p.observacionesRapidas.split(' | ').filter(Boolean).join(' • ') : '';
        const obsNormal = p.observaciones || '';
        const observacionesCombinadas = [obsRapidas, obsNormal].filter(Boolean).join('\n') || '-';
        
        // Formatear metros con separador de miles
        const formattedMetros = p.metros ? p.metros.toLocaleString('es-ES') : '0';
        
        return [
            p.desarrollo || '-',
            { content: `${p.cliente}\n${p.numeroPedidoCliente}`, styles: { fontStyle: 'bold' }},
            formattedMetros,
            p.tipoImpresion.replace(' (SUP)', '').replace(' (TTE)', ''),
            p.capa,
            p.camisa || '-',
            p.antivaho ? 'Sí' : 'No',
            p.microperforado ? 'Sí' : 'No',
            getNextStageTitle(p),
            observacionesCombinadas,
            formatDateDDMMYYYY(p.fechaCreacion),
        ];
    });
    
    doc.autoTable({
        startY: tableStartY,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        margin: { left: 14, right: 14, top: 14, bottom: 14 }, // Márgenes reducidos (aproximadamente 5mm)
        styles: {
            fontSize: 6, // Reduced font size for content
            cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 }, // Minimal padding
            valign: 'middle',
            textColor: [31, 41, 55],
            overflow: 'linebreak',
            halign: 'center', // Default center alignment
        },
        headStyles: {
            fillColor: [45, 55, 72], 
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 6.5, // Reduced header font size
            cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
        },
        columnStyles: {
            0: { cellWidth: 35 }, // Des.
            1: { cellWidth: 80, halign: 'left' }, // Cliente y # Pedido
            2: { cellWidth: 35 }, // Metros
            3: { cellWidth: 38 }, // Tipo
            4: { cellWidth: 24 }, // Capa
            5: { cellWidth: 32 }, // Camisa
            6: { cellWidth: 24 }, // Antiv.
            7: { cellWidth: 24 }, // Láser
            8: { cellWidth: 55 }, // Sig. Etapa
            9: { cellWidth: 120, halign: 'left' }, // Observaciones
            10: { cellWidth: 38 }, // Creación
        },
        didParseCell: (data) => {
            const pedido = pedidos[data.row.index];
            if (pedido && data.section === 'body') {
                // Color red text for "Cliente / # Pedido" column when priority is urgent
                if (data.column.index === 1 && pedido.prioridad === 'Urgente') { // "Cliente / # Pedido" column
                    data.cell.styles.textColor = [139, 0, 0]; // Dark red color
                }

                // Highlight 'Capa' cell if layer is 3 or more
                if (data.column.index === 4) { // "Capa" column
                    const capaValue = pedido.capa;
                    const numericCapa = parseInt(capaValue, 10);
                    if (!isNaN(numericCapa) && numericCapa >= 3) {
                        data.cell.styles.fillColor = [254, 202, 202]; // light red (red-200)
                    }
                }

                // Highlight 'Láser' cell if microperforado is active
                if (data.column.index === 7 && pedido.microperforado) { // "Láser" column
                    data.cell.styles.fillColor = [196, 181, 253]; // light purple (purple-300)
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = [76, 29, 149]; // dark purple (purple-900)
                }
            }
        },
    });

    // Save
    const dateStr = today.toISOString().split('T')[0];
    doc.save(`planificacion_semanal_${dateStr}.pdf`);
}