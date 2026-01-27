import { AnalyticsData } from '../hooks/useAnalyticsData';
import { formatMetros } from './date';

/**
 * Convierte datos a formato CSV
 */
const convertToCSV = (data: any[], headers: string[]): string => {
    const csvRows: string[] = [];

    // Headers
    csvRows.push(headers.join(','));

    // Data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
};

/**
 * Descarga un archivo CSV
 */
const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Exporta el resumen de analytics a CSV
 */
export const exportSummaryToCSV = (data: AnalyticsData) => {
    const summaryData = [
        { metric: 'Total Pedidos', value: data.summary.total_pedidos },
        { metric: 'Pedidos Completados', value: data.summary.pedidos_completados },
        { metric: 'Metros Totales', value: formatMetros(data.summary.metros_totales) },
        { metric: 'Metros Promedio', value: formatMetros(data.summary.metros_promedio) },
        { metric: 'Horas Totales', value: data.summary.tiempo_total_horas.toFixed(2) },
        { metric: 'Horas Promedio', value: data.summary.tiempo_promedio_horas.toFixed(2) },
        { metric: 'Pedidos Urgentes', value: data.summary.pedidos_urgentes },
        { metric: 'Pedidos Atrasados', value: data.summary.pedidos_atrasados }
    ];

    const csv = convertToCSV(summaryData, ['metric', 'value']);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `resumen-analytics-${timestamp}.csv`);
};

/**
 * Exporta datos de máquinas a CSV
 */
export const exportMachinesToCSV = (data: AnalyticsData) => {
    const machineData = data.byMachine.map(m => ({
        maquina: m.maquina_impresion || 'Sin asignar',
        pedidos: m.total_pedidos,
        metros: formatMetros(m.metros_totales),
        horas: Number(m.tiempo_total_horas).toFixed(2)
    }));

    const csv = convertToCSV(machineData, ['maquina', 'pedidos', 'metros', 'horas']);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `maquinas-analytics-${timestamp}.csv`);
};

/**
 * Exporta datos de vendedores a CSV
 */
export const exportVendorsToCSV = (data: AnalyticsData) => {
    const vendorData = data.topVendors.map((v, idx) => ({
        ranking: idx + 1,
        vendedor: v.vendedor_nombre || 'Sin especificar',
        pedidos: v.total_pedidos,
        metros: formatMetros(v.metros_totales),
        horas: Number(v.tiempo_total_horas).toFixed(2)
    }));

    const csv = convertToCSV(vendorData, ['ranking', 'vendedor', 'pedidos', 'metros', 'horas']);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `vendedores-analytics-${timestamp}.csv`);
};

/**
 * Exporta datos de clientes a CSV
 */
export const exportClientsToCSV = (data: AnalyticsData) => {
    const clientData = data.topClients.map((c, idx) => ({
        ranking: idx + 1,
        cliente: c.cliente || 'Sin especificar',
        pedidos: c.total_pedidos,
        metros: formatMetros(c.metros_totales),
        horas: Number(c.tiempo_total_horas).toFixed(2)
    }));

    const csv = convertToCSV(clientData, ['ranking', 'cliente', 'pedidos', 'metros', 'horas']);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `clientes-analytics-${timestamp}.csv`);
};

/**
 * Exporta datos de etapas a CSV
 */
export const exportStagesToCSV = (data: AnalyticsData) => {
    const stageData = data.byStage.map(s => ({
        etapa: s.etapa_actual,
        pedidos: s.total_pedidos,
        metros: formatMetros(s.metros_totales),
        horas: Number(s.tiempo_total_horas).toFixed(2)
    }));

    const csv = convertToCSV(stageData, ['etapa', 'pedidos', 'metros', 'horas']);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `etapas-analytics-${timestamp}.csv`);
};

/**
 * Exporta serie temporal a CSV
 */
export const exportTimeSeriesCSV = (data: AnalyticsData) => {
    const timeSeriesData = data.timeSeries.map(t => ({
        fecha: new Date(t.fecha).toLocaleDateString('es-ES'),
        pedidos: t.total_pedidos,
        metros: formatMetros(t.metros_totales),
        horas: Number(t.tiempo_total_horas).toFixed(2)
    }));

    const csv = convertToCSV(timeSeriesData, ['fecha', 'pedidos', 'metros', 'horas']);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `tendencias-analytics-${timestamp}.csv`);
};

/**
 * Exporta TODOS los datos a un CSV completo
 */
export const exportAllToCSV = (data: AnalyticsData) => {
    let allContent = '';

    // Resumen
    allContent += 'RESUMEN GENERAL\n';
    allContent += 'Métrica,Valor\n';
    allContent += `Total Pedidos,${data.summary.total_pedidos}\n`;
    allContent += `Pedidos Completados,${data.summary.pedidos_completados}\n`;
    allContent += `Metros Totales,${formatMetros(data.summary.metros_totales)}\n`;
    allContent += `Metros Promedio,${formatMetros(data.summary.metros_promedio)}\n`;
    allContent += `Horas Totales,${data.summary.tiempo_total_horas.toFixed(2)}\n`;
    allContent += `Horas Promedio,${data.summary.tiempo_promedio_horas.toFixed(2)}\n`;
    allContent += `Pedidos Urgentes,${data.summary.pedidos_urgentes}\n`;
    allContent += `Pedidos Atrasados,${data.summary.pedidos_atrasados}\n`;
    allContent += '\n\n';

    // Máquinas
    allContent += 'RENDIMIENTO POR MÁQUINA\n';
    allContent += 'Máquina,Pedidos,Metros,Horas\n';
    data.byMachine.forEach(m => {
        allContent += `${m.maquina_impresion || 'Sin asignar'},${m.total_pedidos},${formatMetros(m.metros_totales)},${Number(m.tiempo_total_horas).toFixed(2)}\n`;
    });
    allContent += '\n\n';

    // Etapas
    allContent += 'DISTRIBUCIÓN POR ETAPA\n';
    allContent += 'Etapa,Pedidos,Metros,Horas\n';
    data.byStage.forEach(s => {
        allContent += `${s.etapa_actual},${s.total_pedidos},${formatMetros(s.metros_totales)},${Number(s.tiempo_total_horas).toFixed(2)}\n`;
    });
    allContent += '\n\n';

    // Top Vendedores
    allContent += 'TOP VENDEDORES\n';
    allContent += 'Ranking,Vendedor,Pedidos,Metros,Horas\n';
    data.topVendors.forEach((v, idx) => {
        allContent += `${idx + 1},${v.vendedor_nombre || 'Sin especificar'},${v.total_pedidos},${formatMetros(v.metros_totales)},${Number(v.tiempo_total_horas).toFixed(2)}\n`;
    });
    allContent += '\n\n';

    // Top Clientes
    allContent += 'TOP CLIENTES\n';
    allContent += 'Ranking,Cliente,Pedidos,Metros,Horas\n';
    data.topClients.forEach((c, idx) => {
        allContent += `${idx + 1},${c.cliente || 'Sin especificar'},${c.total_pedidos},${formatMetros(c.metros_totales)},${Number(c.tiempo_total_horas).toFixed(2)}\n`;
    });
    allContent += '\n\n';

    // Serie temporal
    allContent += 'TENDENCIAS TEMPORALES\n';
    allContent += 'Fecha,Pedidos,Metros,Horas\n';
    data.timeSeries.forEach(t => {
        const fecha = new Date(t.fecha).toLocaleDateString('es-ES');
        allContent += `${fecha},${t.total_pedidos},${formatMetros(t.metros_totales)},${Number(t.tiempo_total_horas).toFixed(2)}\n`;
    });

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(allContent, `informe-completo-analytics-${timestamp}.csv`);
};

/**
 * Exporta datos a Excel (usando CSV con encoding UTF-8 BOM para Excel)
 */
export const exportToExcel = (data: AnalyticsData) => {
    // Excel reconoce mejor CSV con BOM UTF-8
    const BOM = '\uFEFF';
    
    let content = BOM;

    // Resumen
    content += 'RESUMEN GENERAL\n';
    content += 'Métrica;Valor\n';
    content += `Total Pedidos;${data.summary.total_pedidos}\n`;
    content += `Pedidos Completados;${data.summary.pedidos_completados}\n`;
    content += `Metros Totales;${formatMetros(data.summary.metros_totales)}\n`;
    content += `Metros Promedio;${formatMetros(data.summary.metros_promedio)}\n`;
    content += `Horas Totales;${data.summary.tiempo_total_horas.toFixed(2)}\n`;
    content += `Horas Promedio;${data.summary.tiempo_promedio_horas.toFixed(2)}\n`;
    content += `Pedidos Urgentes;${data.summary.pedidos_urgentes}\n`;
    content += `Pedidos Atrasados;${data.summary.pedidos_atrasados}\n`;
    content += '\n\n';

    // Máquinas
    content += 'RENDIMIENTO POR MÁQUINA\n';
    content += 'Máquina;Pedidos;Metros;Horas\n';
    data.byMachine.forEach(m => {
        content += `${m.maquina_impresion || 'Sin asignar'};${m.total_pedidos};${formatMetros(m.metros_totales)};${Number(m.tiempo_total_horas).toFixed(2)}\n`;
    });
    content += '\n\n';

    // Etapas
    content += 'DISTRIBUCIÓN POR ETAPA\n';
    content += 'Etapa;Pedidos;Metros;Horas\n';
    data.byStage.forEach(s => {
        content += `${s.etapa_actual};${s.total_pedidos};${formatMetros(s.metros_totales)};${Number(s.tiempo_total_horas).toFixed(2)}\n`;
    });
    content += '\n\n';

    // Top Vendedores
    content += 'TOP VENDEDORES\n';
    content += 'Ranking;Vendedor;Pedidos;Metros;Horas\n';
    data.topVendors.forEach((v, idx) => {
        content += `${idx + 1};${v.vendedor_nombre || 'Sin especificar'};${v.total_pedidos};${formatMetros(v.metros_totales)};${Number(v.tiempo_total_horas).toFixed(2)}\n`;
    });
    content += '\n\n';

    // Top Clientes
    content += 'TOP CLIENTES\n';
    content += 'Ranking;Cliente;Pedidos;Metros;Horas\n';
    data.topClients.forEach((c, idx) => {
        content += `${idx + 1};${c.cliente || 'Sin especificar'};${c.total_pedidos};${formatMetros(c.metros_totales)};${Number(c.tiempo_total_horas).toFixed(2)}\n`;
    });
    content += '\n\n';

    // Serie temporal
    content += 'TENDENCIAS TEMPORALES\n';
    content += 'Fecha;Pedidos;Metros;Horas\n';
    data.timeSeries.forEach(t => {
        const fecha = new Date(t.fecha).toLocaleDateString('es-ES');
        content += `${fecha};${t.total_pedidos};${formatMetros(t.metros_totales)};${Number(t.tiempo_total_horas).toFixed(2)}\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `informe-analytics-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
