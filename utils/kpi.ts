

import { Pedido, EtapaInfo, Etapa, TrackingAuditEntry } from '../types';
import { ETAPAS, KANBAN_FUNNELS } from '../constants';
import { DateFilterOption, formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from './date';
import { normalizePostImpresionSequence } from './dntWorkflow';

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
 * Formats total minutes into days and minutes format.
 * @param totalMinutes The total minutes.
 * @returns A string in "X días, Y minutos" format.
 */
export const formatMinutesToDaysAndMinutes = (totalMinutes: number): string => {
    if (totalMinutes < 0) totalMinutes = 0;
    const days = Math.floor(totalMinutes / (60 * 24));
    const remainingMinutes = Math.round(totalMinutes % (60 * 24));

    if (days === 0) {
        return `${remainingMinutes} min`;
    }

    return `${days} día(s), ${remainingMinutes} min`;
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

/**
 * Calculates the total production time or returns current stage name if not in production.
 * @param pedido The order object.
 * @returns Total production time string or current stage name.
 */
export const getTiempoTotalOEtapa = (pedido: Pedido): string => {
    // Check if the order is in a production stage
    const isInProduction = ETAPAS_PRODUCCION.includes(pedido.etapaActual);

    if (!isInProduction) {
        // Return current stage name from ETAPAS constant
        return ETAPAS[pedido.etapaActual]?.title || pedido.etapaActual;
    }

    // If in production and has completion time, show it
    if (pedido.tiempoTotalProduccion) {
        return pedido.tiempoTotalProduccion;
    }

    // If currently in production, calculate time from first production stage to now
    const sortedTimeline = [...pedido.etapasSecuencia].sort((a, b) =>
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    const firstProductionStage = sortedTimeline.find(e => ETAPAS_PRODUCCION.includes(e.etapa));

    if (firstProductionStage) {
        const start = new Date(firstProductionStage.fecha).getTime();
        const now = new Date().getTime();
        const durationMillis = now - start;
        const totalHours = durationMillis / (1000 * 60 * 60);
        const days = Math.floor(totalHours / 24);
        const hours = Math.round(totalHours % 24);

        return `${days} día(s), ${hours} hora(s)`;
    }

    return 'En Progreso';
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

const PDF_TABLE_WIDTH = 525;
const PDF_FOOTER_REVISION = 'Versión 1.2 · Rev. 11/06/2026';
const PDF_FOOTER_CONFIDENTIALITY = 'Uso interno exclusivo · Pigmea S.L.';

export interface TrackingAuditPDFOptions {
    search?: string;
    stage?: string;
    dateField?: 'timestamp';
    dateFilter?: DateFilterOption;
    dateFrom?: string;
    dateTo?: string;
}

export interface TrackingAuditPDFPayload {
    actions: TrackingAuditEntry[];
    filters: TrackingAuditPDFOptions;
}

const TRACKING_AUDIT_DATE_FILTER_LABELS: Record<DateFilterOption, string> = {
    all: 'Todo el historial visible',
    'this-week': 'Esta semana',
    'last-week': 'Semana pasada',
    'next-week': 'Próxima semana',
    'this-month': 'Este mes',
    'last-month': 'Mes pasado',
    'next-month': 'Próximo mes',
    custom: 'Rango personalizado',
};

const buildPdfFooter = (doc: any, pageWidth: number, pageHeight: number, horizontalMargin: number) => {
    const totalPages = doc.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(horizontalMargin, pageHeight - 20, pageWidth - horizontalMargin, pageHeight - 20);

        doc.setFontSize(6.5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(120);
        doc.text(PDF_FOOTER_REVISION, horizontalMargin, pageHeight - 11);
        doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - 11, { align: 'center' });
        doc.text(PDF_FOOTER_CONFIDENTIALITY, pageWidth - horizontalMargin, pageHeight - 11, { align: 'right' });
    }
};

const buildTrackingAuditSubtitleLines = (filters?: TrackingAuditPDFOptions): string[] => {
    const subtitleLines: string[] = [];
    const trimmedSearch = filters?.search?.trim();
    const trimmedStage = filters?.stage?.trim();

    if (trimmedStage) {
        subtitleLines.push(`Etapa: ${trimmedStage}`);
    }

    if (trimmedSearch) {
        subtitleLines.push(`Búsqueda: ${trimmedSearch}`);
    }

    if (filters?.dateFilter && filters.dateFilter !== 'all') {
        if (filters.dateFilter === 'custom' && (filters.dateFrom || filters.dateTo)) {
            const fromLabel = filters.dateFrom ? formatDateDDMMYYYY(filters.dateFrom) : 'Inicio abierto';
            const toLabel = filters.dateTo ? formatDateDDMMYYYY(filters.dateTo) : 'Fin abierto';
            subtitleLines.push(`Registro: ${fromLabel} → ${toLabel}`);
        } else {
            subtitleLines.push(`Registro: ${TRACKING_AUDIT_DATE_FILTER_LABELS[filters.dateFilter]}`);
        }
    }

    if (subtitleLines.length === 0) {
        subtitleLines.push('Vista visible exportada desde Seguimiento de Producción');
    }

    return subtitleLines;
};

const decodeHtmlEntities = (text: string): string => {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
};

const buildTrackingAuditRowSummary = (action: TrackingAuditEntry): string => {
    const summaryParts = [action.title, action.details].filter(Boolean);
    return decodeHtmlEntities(summaryParts.join('\n'));
};

const buildTrackingAuditRowChanges = (action: TrackingAuditEntry): string => {
    if (!action.changes || action.changes.length === 0) {
        return '—';
    }

    return decodeHtmlEntities(action.changes.map((change) => `• ${change}`).join('\n'));
};

const getNextStageTitle = (pedido: Pedido): string => {
    const { etapaActual } = pedido;
    const secuenciaTrabajo = normalizePostImpresionSequence(pedido.secuenciaTrabajo, pedido.cliente);

    if (!secuenciaTrabajo) return 'N/A';

    const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual);
    const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual);

    if (isPrinting && secuenciaTrabajo.length > 0) {
        return ETAPAS[secuenciaTrabajo[0]]?.title ?? 'N/A';
    }

    if (isPostPrinting) {
        const currentIndex = secuenciaTrabajo.indexOf(etapaActual);
        if (currentIndex > -1 && currentIndex < secuenciaTrabajo.length - 1) {
            return ETAPAS[secuenciaTrabajo[currentIndex + 1]]?.title ?? 'N/A';
        }
        if (currentIndex === secuenciaTrabajo.length - 1) {
            return ETAPAS[Etapa.COMPLETADO]?.title ?? 'Completado';
        }
    }

    return 'N/A';
};

const formatMetrosForPdf = (metros: Pedido['metros']): string => {
    if (metros === null || metros === undefined || metros === '') return '0';
    const numericValue = typeof metros === 'number'
        ? metros
        : Number(String(metros).replace(/\./g, '').replace(',', '.'));

    if (!Number.isFinite(numericValue)) {
        return String(metros);
    }

    const [integerPart, decimalPart] = numericValue.toFixed(2).split('.');
    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const normalizedDecimalPart = decimalPart === '00' ? '' : `,${decimalPart.replace(/0+$/, '')}`;

    return `${formattedIntegerPart}${normalizedDecimalPart}`;
};

const formatTipoImpresionForPdf = (tipoImpresion: Pedido['tipoImpresion']): string => {
    if (tipoImpresion.includes('Transparencia')) return 'TTE';
    if (tipoImpresion.includes('Superficie')) return 'SUP';
    return tipoImpresion;
};


export const generatePedidosPDF = (
    pedidos: Pedido[], 
    listasTemporalesMap?: Record<string, string[]>,
    filtros?: { stage?: string, selectedStages?: string[] }
) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4'); // 'p' for portrait (vertical orientation) - A4 portrait = 595x842 pt
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const tableWidth = PDF_TABLE_WIDTH;
    const tableHorizontalMargin = (pageWidth - tableWidth) / 2;

    // --- HEADER ---
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('PIGMEA S.L.', 20, 28);

    // --- Document Title & Dynamic Subtitle ---
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    const mainSubtitle = 'Planificación semanal';
    let tableStartY = 50; // Adjusted start Y for the table
    doc.text(mainSubtitle, 20, 42);

    // Dynamic subtitle
    const printingMachines = new Set<string>();
    const postPrintingStages = new Set<string>();

    if (filtros && (filtros.stage !== 'all' || (filtros.selectedStages && filtros.selectedStages.length > 0))) {
        const stagesToInclude = new Set<string>();
        if (filtros.stage && filtros.stage !== 'all') {
            stagesToInclude.add(filtros.stage);
        }
        if (filtros.selectedStages) {
            filtros.selectedStages.forEach(s => stagesToInclude.add(s));
        }

        stagesToInclude.forEach(stage => {
            if (KANBAN_FUNNELS.IMPRESION.stages.includes(stage as any)) {
                const title = ETAPAS[stage as any]?.title;
                if (title) printingMachines.add(title);
            } else if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(stage as any)) {
                const title = ETAPAS[stage as any]?.title;
                if (title) postPrintingStages.add(title);
            }
        });
    } else {
        pedidos.forEach(p => {
            const listasTemporales = listasTemporalesMap?.[p.id] || [];
            if (listasTemporales.length > 0) return;

            if (KANBAN_FUNNELS.IMPRESION.stages.includes(p.etapaActual)) {
                const title = ETAPAS[p.etapaActual]?.title;
                if (title) printingMachines.add(title);
            } else if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(p.etapaActual)) {
                const title = ETAPAS[p.etapaActual]?.title;
                if (title) postPrintingStages.add(title);
            }
        });
    }

    const subtitleParts: string[] = [];
    if (printingMachines.size > 0) {
        subtitleParts.push(Array.from(printingMachines).join(', '));
    }
    if (postPrintingStages.size > 0) {
        subtitleParts.push(Array.from(postPrintingStages).join(', '));
    }
    const dynamicSubtitle = subtitleParts.join(' | ');

    if (dynamicSubtitle) {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(dynamicSubtitle, 20, 55, {
            maxWidth: 595 - 20 - 20, // Page width (portrait: 595pt) - margins
        });
        tableStartY = 65;
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
        "Colores",
        "Hecho",
        "Capa",
        "Camisa",
        "Antiv.",
        "Láser",
        "Sig. Etapa",
        "Observaciones",
        "Nva. Entrega"
    ];

    const tableRows = pedidos.map(p => {
        // Combinar observaciones rápidas y observaciones normales
        const obsRapidas = p.observacionesRapidas ? p.observacionesRapidas.split(' | ').filter(Boolean).join(' • ') : '';
        const obsNormal = p.observaciones || '';
        const observacionesCombinadas = [obsRapidas, obsNormal].filter(Boolean).join('\n') || '-';

        // Formatear metros con separador de miles consistente desde 1.000
        const formattedMetros = formatMetrosForPdf(p.metros);

        return [
            p.desarrollo || '-',
            // We pass the raw data; rendering is handled in didDrawCell to allow mixed styles (bold/normal)
            { cliente: p.cliente, pedido: p.numeroPedidoCliente },
            formattedMetros,
            formatTipoImpresionForPdf(p.tipoImpresion),
            p.colores ?? '-',
            '',
            p.capa,
            p.camisa || '-',
            p.antivaho ? 'Sí' : 'No',
            p.microperforado ? 'Sí' : 'No',
            getNextStageTitle(p),
            observacionesCombinadas,
            p.nuevaFechaEntrega ? (() => { const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']; const mes = parseInt(p.nuevaFechaEntrega!.slice(5, 7), 10) - 1; return p.nuevaFechaEntrega!.slice(8, 10) + '/' + (meses[mes] ?? ''); })() : '-',
        ];
    });

    doc.autoTable({
        startY: tableStartY,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        tableWidth,
        margin: { left: tableHorizontalMargin, right: tableHorizontalMargin, top: 14, bottom: 28 },
        styles: {
            fontSize: 8, // Increased from 6
            cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
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
            fontSize: 6.5, // Reduced from 9 (approx 30% reduction: 9 * 0.7 = 6.3)
            cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
        },
        columnStyles: {
            0: { cellWidth: 30 }, // Des.
            1: { cellWidth: 92, halign: 'center', fontSize: 6.8 }, // Cliente y # Pedido
            2: { cellWidth: 40 }, // Metros
            3: { cellWidth: 24, fontSize: 5.5 }, // Tipo
            4: { cellWidth: 28, fontSize: 5.5 }, // Colores
            5: { cellWidth: 22, fontSize: 8 }, // Hecho (checkbox)
            6: { cellWidth: 22, fontSize: 5.2 }, // Capa
            7: { cellWidth: 29, fontSize: 6 }, // Camisa
            8: { cellWidth: 22 }, // Antiv.
            9: { cellWidth: 22 }, // Láser
            10: { cellWidth: 50, fontSize: 6.8 }, // Sig. Etapa
            11: { cellWidth: 110, halign: 'left', fontSize: 6.8 }, // Observaciones
            12: { cellWidth: 34, fontSize: 5.5 }, // Nva. Entrega
        },
        willDrawCell: (data) => {
            // Prevent standard text drawing for the custom rendered column by clearing text JUST BEFORE drawing
            // This ensures row height was calculated correctly based on content in didParseCell
            if (data.section === 'body' && data.column.index === 1) {
                data.cell.text = [];
            }
        },
        didDrawCell: (data) => {
            const pedido = pedidos[data.row.index];
            if (data.section === 'body' && data.column.index === 5) {
                // Draw a real checkbox square to avoid font/symbol rendering issues in PDF viewers.
                const { x, y, width, height } = data.cell;
                const boxSize = Math.min(8, width - 6, height - 4);
                const boxX = x + (width - boxSize) / 2;
                const boxY = y + (height - boxSize) / 2;

                doc.setDrawColor(31, 41, 55);
                doc.setLineWidth(0.75);
                doc.rect(boxX, boxY, boxSize, boxSize);
            }

            if (pedido && data.section === 'body' && data.column.index === 1) {
                // Manual rendering for "Cliente / # Pedido" to mix normal and bold text
                const cell = data.cell;
                const { x, y, width } = cell;

                // Get data (it was passed as an object in the row array)
                const content = cell.raw as { cliente: string, pedido: string };
                if (!content || typeof content !== 'object') return;

                // Check for Urgent priority color
                if (pedido.prioridad === 'Urgente') {
                    doc.setTextColor(139, 0, 0); // Dark red
                } else {
                    doc.setTextColor(31, 41, 55); // Default dark gray
                }

                const fontSize = cell.styles.fontSize;
                doc.setFontSize(fontSize);

                // Draw Cliente (Normal)
                doc.setFont(undefined, 'normal');

                // We calculate Y position based on cell top + padding
                // Note: jspdf-autotable cells have padding. top padding is cell.styles.cellPadding.top
                // But accessing cell.styles inside didDrawCell is reliable.
                // Default padding we set is 2.
                const padding = 2;
                const centerX = x + (width / 2);
                const textY = y + padding + fontSize; // Approx baseline for first line

                // Use splitTextToSize to handle wrapping if client name is too long
                const clientLines = doc.splitTextToSize(content.cliente || '', width - (padding * 2));
                clientLines.forEach((line: string, index: number) => {
                    doc.text(line, centerX, textY + (index * (fontSize * 1.15)), { align: 'center' });
                });

                // Draw Pedido (Bold) below client
                doc.setFont(undefined, 'bold');
                // Calculate height of client block to offset order number
                const lineHeight = fontSize * 1.15;
                const clientBlockHeight = clientLines.length * lineHeight;

                doc.text(content.pedido || '', centerX, textY + clientBlockHeight, { align: 'center' });
            }
        },
        didParseCell: (data) => {
            const pedido = pedidos[data.row.index];
            if (data.section === 'head' && data.column.index === 5) {
                data.cell.styles.fontSize = 5;
            }

            if (pedido && data.section === 'body') {
                if (data.row.index % 2 === 1) {
                    data.cell.styles.fillColor = [248, 250, 252];
                }

                // "Cliente / # Pedido" column: Ensure text property reflects content size for row height calculation
                if (data.column.index === 1) {
                    const content = data.cell.raw as { cliente: string, pedido: string };
                    // Set text to an array of strings to simulate height.
                    // jspdf-autotable uses this to calculate row height.
                    if (content && typeof content === 'object') {
                        data.cell.text = [content.cliente, content.pedido];
                    }
                }

                // Highlight 'Des.' cell if estadoCliché is 'REPETICIÓN CON CAMBIO'
                if (data.column.index === 0 && pedido.estadoCliché === 'REPETICIÓN CON CAMBIO') {
                    data.cell.styles.fillColor = [254, 202, 202]; // light red (red-200)
                }

                // Highlight 'Capa' cell if layer is 3 or more
                if (data.column.index === 6) { // "Capa" column
                    const capaValue = pedido.capa;
                    const numericCapa = parseInt(capaValue, 10);
                    if (!isNaN(numericCapa) && numericCapa >= 3) {
                        data.cell.styles.fillColor = [254, 202, 202]; // light red (red-200)
                    }
                }

                // Highlight 'Láser' cell if microperforado is active
                if (data.column.index === 9 && pedido.microperforado) { // "Láser" column
                    data.cell.styles.fillColor = [196, 181, 253]; // light purple (purple-300)
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = [76, 29, 149]; // dark purple (purple-900)
                }
            }
        },
    });

    buildPdfFooter(doc, pageWidth, pageHeight, tableHorizontalMargin);

    // Save
    const dateStr = today.toISOString().split('T')[0];
    doc.save(`planificacion_semanal_${dateStr}.pdf`);
};

export const generateTrackingAuditPDF = (
    actions: TrackingAuditEntry[],
    filters?: TrackingAuditPDFOptions,
) => {
    if (!actions || actions.length === 0) {
        throw new Error('No hay resultados visibles para exportar.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const tableWidth = 760;
    const tableHorizontalMargin = (pageWidth - tableWidth) / 2;
    const today = new Date();

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('PIGMEA S.L.', 20, 28);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Historial y auditoría de producción', 20, 42);

    const subtitleLines = buildTrackingAuditSubtitleLines(filters);
    doc.setFontSize(8);
    doc.setTextColor(150);
    subtitleLines.forEach((line, index) => {
        doc.text(line, 20, 55 + (index * 11), { maxWidth: pageWidth - 40 });
    });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);
    doc.text(formatDateDDMMYYYY(today), pageWidth - 20, 28, { align: 'right' });

    const tableRows = actions.map((action) => [
        formatDateTimeDDMMYYYY(action.timestamp),
        [action.numeroPedidoCliente, action.cliente, action.maquinaImpresion || 'Sin máquina'].join('\n'),
        [action.userName || 'Sistema', action.source ? `Origen: ${action.source}` : 'Origen: —'].join('\n'),
        buildTrackingAuditRowSummary(action),
        buildTrackingAuditRowChanges(action),
    ]);

    doc.autoTable({
        startY: 70 + (subtitleLines.length * 11),
        head: [[
            'Registro',
            'Pedido / Contexto',
            'Actor',
            'Resumen legible',
            'Cambios destacados',
        ]],
        body: tableRows,
        theme: 'grid',
        tableWidth,
        margin: { left: tableHorizontalMargin, right: tableHorizontalMargin, top: 14, bottom: 28 },
        styles: {
            fontSize: 8,
            cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
            valign: 'top',
            textColor: [31, 41, 55],
            overflow: 'linebreak',
            halign: 'left',
            lineColor: [226, 232, 240],
            lineWidth: 0.5,
        },
        headStyles: {
            fillColor: [45, 55, 72],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left',
            fontSize: 8,
            cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        columnStyles: {
            0: { cellWidth: 82 },
            1: { cellWidth: 120 },
            2: { cellWidth: 95 },
            3: { cellWidth: 288 },
            4: { cellWidth: 175 },
        },
    });

    buildPdfFooter(doc, pageWidth, pageHeight, tableHorizontalMargin);

    const dateStr = today.toISOString().split('T')[0];
    doc.save(`tracking_audit_${dateStr}.pdf`);
};
