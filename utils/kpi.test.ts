/**
 * Tests for generatePedidosPDF — the real PDF renderer contract.
 *
 * This file exercises generatePedidosPDF() directly (not a replica of its
 * algorithm) to freeze the visible contract for temporary rows: the
 * "[⏳ Prog.]" marker MUST appear in the autoTable body for temp rows.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Register autoTable plugin (CDN equivalent: script tag does this automatically)
applyPlugin(jsPDF);

// Set up the CDN-style global that generatePedidosPDF expects
(window as any).jspdf = { jsPDF };

// ---------------------------------------------------------------------------
// Real renderer under test — imported AFTER window.jspdf is set up
// ---------------------------------------------------------------------------
import { generatePedidosPDF } from './kpi';
import { preparePdfRows, ExpandedPedido } from './listViewExpansion';
import { Pedido, Etapa, Prioridad, TipoImpresion } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
    return {
        id: 'ped-1',
        numeroPedidoCliente: 'P001',
        cliente: 'Cliente Test',
        maquinaImpresion: 'WM1',
        metros: 100,
        fechaCreacion: '2026-01-01',
        fechaEntrega: '2026-06-30',
        etapaActual: Etapa.IMPRESION_WM1,
        etapasSecuencia: [],
        prioridad: Prioridad.NORMAL,
        tipoImpresion: TipoImpresion.SUPERFICIE,
        desarrollo: 'Des Test',
        capa: '1',
        tiempoProduccionPlanificado: '2h 30m',
        secuenciaTrabajo: [],
        historial: [],
        observaciones: '',
        ...overrides,
    } as Pedido;
}

// ---------------------------------------------------------------------------
// autoTable spy: captures the body array passed to the real renderer
// ---------------------------------------------------------------------------

interface AutoTableOptions {
    head?: any[];
    body: any[];
    [key: string]: any;
}

function spyOnAutoTable(): { calls: AutoTableOptions[]; restore: () => void } {
    const calls: AutoTableOptions[] = [];
    const original = (jsPDF as any).API.autoTable;

    (jsPDF as any).API.autoTable = function (this: any, options: AutoTableOptions) {
        calls.push(options);
        return original.call(this, options);
    };

    return {
        calls,
        restore: () => {
            (jsPDF as any).API.autoTable = original;
        },
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generatePedidosPDF — temporal marker contract', () => {
    const originalSave = jsPDF.prototype.save;

    beforeAll(() => {
        // Prevent actual file download in test environment
        jsPDF.prototype.save = vi.fn();
    });

    afterAll(() => {
        jsPDF.prototype.save = originalSave;
    });

    it('renders [⏳ Prog.] visible marker in Observaciones for temp rows (real renderer)', () => {
        // Build test data through the real preparePdfRows pipeline
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
            observaciones: 'Urgente',
            observacionesRapidas: 'Revisar color',
        });

        const expanded: ExpandedPedido[] = [
            // Real row — NO temp marker expected
            {
                ...ped,
                _visualStage: Etapa.IMPRESION_WM1,
                _visualKey: 'real:p1:IMPRESION_WM1',
                _kanbanInstanceIndex: 0,
            },
            // Temp row — [⏳ Prog.] marker expected
            {
                ...ped,
                _visualStage: Etapa.POST_DNT,
                _visualKey: 'temp:p1:POST_DNT:1',
                _kanbanInstanceIndex: 1,
            },
        ];

        const pdfRows = preparePdfRows(expanded);

        // Spy on autoTable to capture the body data the real renderer produces
        const { calls, restore } = spyOnAutoTable();

        try {
            // EXERCISE the real generatePedidosPDF function
            generatePedidosPDF(pdfRows, {}, { stage: 'all', selectedStages: [] });

            expect(calls.length).toBeGreaterThan(0);
            const body: any[] = calls[0].body;

            // Column 11 is "Observaciones" — the renderer sets the marker here
            const rowsWithMarker = body.filter((row: any[]) =>
                typeof row[11] === 'string' && row[11].includes('[⏳ Prog.]'),
            );
            const rowsWithoutMarker = body.filter((row: any[]) =>
                typeof row[11] === 'string' && !row[11].includes('[⏳ Prog.]'),
            );

            // Contract: exactly 1 temp row gets the marker
            expect(rowsWithMarker.length).toBe(1);
            expect(rowsWithMarker[0][11]).toContain('[⏳ Prog.]');
            expect(rowsWithMarker[0][11]).toContain('Urgente');

            // Contract: the real row does NOT get the marker
            expect(rowsWithoutMarker.length).toBe(1);
            expect(rowsWithoutMarker[0][11]).not.toContain('[⏳ Prog.]');
        } finally {
            restore();
        }
    });

    it('integration: preparePdfRows → generatePedidosPDF marker survives multi-temp scenario', () => {
        // Pedido with 1 real + 2 temp instances in POST_DNT
        const ped = makePedido({
            id: 'multi',
            etapaActual: Etapa.IMPRESION_WM1,
            observaciones: '',
            observacionesRapidas: '',
        });

        const expanded: ExpandedPedido[] = [
            {
                ...ped,
                _visualStage: Etapa.IMPRESION_WM1,
                _visualKey: 'real:multi:IMPRESION_WM1',
                _kanbanInstanceIndex: 0,
            },
            {
                ...ped,
                _visualStage: Etapa.POST_DNT,
                _visualKey: 'temp:multi:POST_DNT:1',
                _kanbanInstanceIndex: 1,
            },
            {
                ...ped,
                _visualStage: Etapa.POST_DNT,
                _visualKey: 'temp:multi:POST_DNT:2',
                _kanbanInstanceIndex: 2,
            },
        ];

        const pdfRows = preparePdfRows(expanded);
        const { calls, restore } = spyOnAutoTable();

        try {
            generatePedidosPDF(pdfRows);

            const body: any[] = calls[0].body;

            // 3 rows total: 1 real + 2 temp
            expect(body).toHaveLength(3);

            // Temp rows with empty observaciones → "[⏳ Prog.] -"
            const tempMarkerCount = body.filter((row: any[]) =>
                typeof row[11] === 'string' && row[11].startsWith('[⏳ Prog.]'),
            ).length;

            expect(tempMarkerCount).toBe(2);
        } finally {
            restore();
        }
    });

    it('non-temp rows never receive [⏳ Prog.] regardless of observaciones content', () => {
        const ped = makePedido({
            id: 'clean',
            etapaActual: Etapa.POST_DNT,
            observaciones: 'Nota normal',
            observacionesRapidas: 'Tag importante',
        });

        const expanded: ExpandedPedido[] = [
            {
                ...ped,
                _visualStage: Etapa.POST_DNT,
                _visualKey: 'real:clean:POST_DNT',
                _kanbanInstanceIndex: 0,
            },
        ];

        const pdfRows = preparePdfRows(expanded);
        const { calls, restore } = spyOnAutoTable();

        try {
            generatePedidosPDF(pdfRows);

            const body: any[] = calls[0].body;
            expect(body).toHaveLength(1);
            // Column 11 = Observaciones — MUST NOT contain the temp marker
            expect(body[0][11]).not.toContain('[⏳ Prog.]');
        } finally {
            restore();
        }
    });

    it('temp row with only observacionesRapidas still gets [⏳ Prog.] prefix', () => {
        const ped = makePedido({
            id: 'rapidas',
            etapaActual: Etapa.IMPRESION_WM1,
            observaciones: '',
            observacionesRapidas: 'Urgente | Frágil',
        });

        const expanded: ExpandedPedido[] = [
            {
                ...ped,
                _visualStage: Etapa.POST_DNT,
                _visualKey: 'temp:rapidas:POST_DNT:1',
                _kanbanInstanceIndex: 1,
            },
        ];

        const pdfRows = preparePdfRows(expanded);
        const { calls, restore } = spyOnAutoTable();

        try {
            generatePedidosPDF(pdfRows);

            const body: any[] = calls[0].body;
            expect(body).toHaveLength(1);

            // Contract: [⏳ Prog.] prefix + observacionesRapidas content
            const obs = body[0][11] as string;
            expect(obs).toContain('[⏳ Prog.]');
            expect(obs).toContain('Urgente');
            expect(obs).toContain('Frágil');
        } finally {
            restore();
        }
    });
});
