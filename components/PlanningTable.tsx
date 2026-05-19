import { formatDateDDMMYYYY, formatDecimalHoursToHHMM } from '../utils/date';
import InfoTooltip from './InfoTooltip';
import { WeeklyComment } from '../types/weeklyComments';
import { WeeklyCommentCell } from './WeeklyCommentCell';

export interface WeeklyData {
    week: number;
    year: number;
    weekKey: string;
    label: string;
    dateRange: string;
    weekStartDate: Date; // Fecha real de inicio de la semana (lunes) para ordenamiento cronológico
    machines: {
        [key: string]: number; // e.g. "Windmöller 1": 120.5
    };
    machinePedidos?: {
        [key: string]: any[]; // Store related orders
    };
    totalCapacity: number;
    totalLoad: number;
    freeCapacity: number;
    isLocked?: boolean;
}

interface PlanningTableProps {
    data: WeeklyData[];
    machineKeys: string[];
    onToggleLock?: (weekKey: string, currentLockState: boolean) => void;
    weeklyComments?: Record<string, WeeklyComment[]>;
    onSaveComment?: (weekKey: string, message: string) => Promise<void>;
    onUpdateComment?: (commentId: string, message: string) => Promise<void>;
    onDeleteComment?: (commentId: string) => Promise<void>;
    currentUserId?: string;
}

const MACHINE_COLUMN_HEADERS: Record<string, string> = {
    'Windmöller 1': 'WH-1',
    'Windmöller 3': 'WH-3',
    'GIAVE': 'SUP GIAVE',
    'DNT': 'DNT',
    'VARIABLES': 'VARIABLES',
};

// Define colors for each machine column header
const MACHINE_COLORS: Record<string, string> = {
    'Windmöller 1': 'bg-blue-900 text-white border-blue-950', // WH-1
    'Windmöller 3': 'bg-red-900 text-white border-red-950', // WH-3
    'GIAVE': 'bg-orange-900 text-white border-orange-950', // SUP GIAVE
    'DNT': 'bg-green-900 text-white border-green-950', // DNT
    'VARIABLES': 'bg-purple-900 text-white border-purple-950', // VARIABLES
};

// Define tooltips for each machine/category
const MACHINE_TOOLTIPS: Record<string, string> = {
    'Windmöller 1': 'Horas programadas en máquina Windmöller 1. Estas horas SÍ restan de la capacidad libre (180h base).',
    'Windmöller 3': 'Horas programadas en máquina Windmöller 3. Estas horas SÍ restan de la capacidad libre (180h base).',
    'GIAVE': 'Horas programadas en máquina GIAVE. Estas horas NO restan de la capacidad libre.',
    'DNT': 'Pedidos prioritarios DNT (cliente o vendedor contiene "DNT"). Estas horas SÍ restan de la capacidad libre.',
    'VARIABLES': 'Pedidos con clichés nuevos o cambios pendientes (sin horas confirmadas, compra de cliché o disponibilidad). Estas horas NO restan de la capacidad libre.',
};

export const PlanningTable: React.FC<PlanningTableProps> = ({
    data, machineKeys, onToggleLock,
    weeklyComments = {}, onSaveComment, onUpdateComment, onDeleteComment, currentUserId
}) => {
    // Sort machine keys to match desired order: WH-1, VARIABLES, WH-3, GIAVE, DNT
    const desiredOrder = ['Windmöller 1', 'VARIABLES', 'Windmöller 3', 'GIAVE', 'DNT'];
    const sortedKeys = [...machineKeys].sort((a, b) => {
        const indexA = desiredOrder.indexOf(a);
        const indexB = desiredOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    // Calculate totals
    const totals: Record<string, number> = {};
    let totalFree = 0;

    // Initialize totals
    sortedKeys.forEach(k => totals[k] = 0);

    data.forEach(row => {
        sortedKeys.forEach(key => {
            totals[key] += row.machines[key] || 0;
        });
        totalFree += row.freeCapacity;
    });

    return (
        <div className="overflow-x-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-3 pr-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">
                            Semana
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">
                            Fechas
                        </th>
                        {sortedKeys.map(key => (
                            <th
                                key={key}
                                scope="col"
                                className={`px-3 py-3.5 text-center text-sm font-bold border-r border-gray-200 ${MACHINE_COLORS[key] || 'bg-gray-100 text-gray-900'}`}
                            >
                                <div className="flex items-center justify-center gap-1.5">
                                    {MACHINE_COLUMN_HEADERS[key] || key}
                                    <InfoTooltip
                                        content={MACHINE_TOOLTIPS[key] || 'Horas programadas para esta categoría'}
                                        position="bottom"
                                        size="sm"
                                    />
                                </div>
                            </th>
                        ))}
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-gray-900 bg-white border-l-2 border-gray-300">
                            <div className="flex items-center justify-center gap-1.5">
                                LIBRES
                                <InfoTooltip
                                    content="Capacidad disponible calculada con la fórmula: 180 horas - WH1 - WH3 - DNT. Las categorías GIAVE y VARIABLES NO restan capacidad."
                                    position="bottom"
                                    size="sm"
                                />
                            </div>
                        </th>
                        <th scope="col" className="w-28 py-3.5 pl-4 pr-1 text-center border-l-2 border-gray-300">
                            Acciones
                        </th>
                        <th scope="col" className="w-36 py-3.5 px-2 text-center border-l border-gray-200">
                            Notas
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {data.map((row) => (
                        <tr key={`${row.year}-${row.week}`} className={row.isLocked ? 'bg-amber-100/50 hover:bg-amber-100/70' : row.freeCapacity < 0 ? 'bg-red-50 hover:bg-red-100/70' : 'hover:bg-gray-50'}>
                            <td className="whitespace-nowrap py-4 pl-3 pr-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                                {row.label}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-r border-gray-200">
                                {row.dateRange}
                            </td>
                            {sortedKeys.map(key => (
                                <td key={key} className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-900 border-r border-gray-200 font-mono">
                                    {formatDecimalHoursToHHMM(row.machines[key])}
                                </td>
                            ))}
                            <td className={`whitespace-nowrap px-3 py-4 text-sm text-center font-bold border-l-2 border-gray-300 font-mono ${row.freeCapacity < 0 ? 'text-red-600 bg-red-100' : 'text-green-600'
                                }`}>
                                {formatDecimalHoursToHHMM(row.freeCapacity)}
                            </td>
                            <td className="whitespace-nowrap py-4 pl-4 pr-1 text-center border-l-2 border-gray-300">
                                <button
                                    onClick={() => onToggleLock?.(row.weekKey, !!row.isLocked)}
                                    className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                                        row.isLocked 
                                            ? 'text-amber-800 bg-amber-200 border-amber-300 hover:bg-amber-300' 
                                            : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
                                    }`}
                                    title={row.isLocked ? 'Desbloquear semana' : 'Bloquear semana'}
                                >
                                    {row.isLocked ? (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            Bloqueada
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                            </svg>
                                            Bloquear
                                        </>
                                    )}
                                </button>
                            </td>
                            <td className="whitespace-nowrap py-4 px-2 text-center border-l border-gray-200">
                                <WeeklyCommentCell
                                    comments={weeklyComments[row.weekKey] || []}
                                    onSave={onSaveComment || (() => Promise.resolve())}
                                    onUpdate={onUpdateComment || (() => Promise.resolve())}
                                    onDelete={onDeleteComment || (() => Promise.resolve())}
                                    weekKey={row.weekKey}
                                    currentUserId={currentUserId}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <tr>
                        <td colSpan={2} className="py-4 pl-4 pr-3 text-right text-sm text-gray-900 sm:pl-6 border-r border-gray-200">
                            TOTALES:
                        </td>
                        {sortedKeys.map(key => (
                            <td key={key} className="px-3 py-4 text-sm text-center text-gray-900 border-r border-gray-200 font-mono">
                                {formatDecimalHoursToHHMM(totals[key])}
                            </td>
                        ))}
                        <td className={`px-3 py-4 text-sm text-center border-l-2 border-gray-300 font-mono ${totalFree < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatDecimalHoursToHHMM(totalFree)}
                        </td>
                        <td className="border-l-2 border-gray-300"></td>
                        <td className="border-l border-gray-200"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
