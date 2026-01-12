import React, { useState, useEffect } from 'react';
import { useOperacionesProduccion } from '../hooks/useOperacionesProduccion';
import { useAuth } from '../contexts/AuthContext';
import { PedidoConProduccion } from '../types';
import { TarjetaPedidoOperador } from './TarjetaPedidoOperador';
import { FiltroMaquina } from './FiltroMaquina';
import { ModalIniciarOperacion } from './ModalIniciarOperacion';
import { ModalCompletarOperacion } from './ModalCompletarOperacion';
import { CronometroOperacion } from './CronometroOperacion';
import { MetricasProduccionPanel } from './MetricasProduccionPanel';

const MAQUINAS_DISPONIBLES = [
    { id: 'todas', nombre: 'Todas las Máquinas', icon: '🏭' },
    { id: 'IMPRESION_WM1', nombre: 'Impresora WM1', icon: '🖨️' },
    { id: 'IMPRESION_GIAVE', nombre: 'Impresora GIAVE', icon: '🖨️' },
    { id: 'IMPRESION_WM3', nombre: 'Impresora WM3', icon: '🖨️' },
    { id: 'IMPRESION_ANON', nombre: 'Impresora Anónima', icon: '🖨️' },
    { id: 'POST_LAMINACION_SL2', nombre: 'Laminadora SL2', icon: '📄' },
    { id: 'POST_LAMINACION_NEXUS', nombre: 'Laminadora NEXUS', icon: '📄' },
    { id: 'POST_REBOBINADO_S2DT', nombre: 'Rebobinadora S2DT', icon: '🔄' },
    { id: 'POST_REBOBINADO_PROSLIT', nombre: 'Rebobinadora PROSLIT', icon: '🔄' },
    { id: 'POST_PERFORACION_MIC', nombre: 'Perforadora Micro', icon: '⚙️' },
    { id: 'POST_PERFORACION_MAC', nombre: 'Perforadora Macro', icon: '⚙️' },
    { id: 'POST_REBOBINADO_TEMAC', nombre: 'Rebobinadora TEMAC', icon: '🔄' }
];

export function OperadorView() {
    const { user } = useAuth();
    const {
        miOperacionActual,
        estadisticas,
        loading,
        obtenerPedidosDisponibles,
        iniciarOperacion,
        pausarOperacion,
        reanudarOperacion,
        completarOperacion
    } = useOperacionesProduccion();

    const [pedidosDisponibles, setPedidosDisponibles] = useState<PedidoConProduccion[]>([]);
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState<string>('todas');
    const [pedidoParaIniciar, setPedidoParaIniciar] = useState<PedidoConProduccion | null>(null);
    const [mostrarModalCompletar, setMostrarModalCompletar] = useState(false);
    const [mostrarMetricas, setMostrarMetricas] = useState(false);

    // Cargar pedidos disponibles
    useEffect(() => {
        cargarPedidos();
        const interval = setInterval(cargarPedidos, 30000); // Actualizar cada 30s
        return () => clearInterval(interval);
    }, []);

    const cargarPedidos = async () => {
        const pedidos = await obtenerPedidosDisponibles();
        setPedidosDisponibles(pedidos);
    };

    const handleIniciarOperacion = async (maquina: string, observaciones?: string) => {
        if (!pedidoParaIniciar) return;

        const result = await iniciarOperacion({
            pedidoId: pedidoParaIniciar.id,
            maquina,
            metrosObjetivo: Number(pedidoParaIniciar.metros),
            observaciones
        });

        if (result.success) {
            setPedidoParaIniciar(null);
            await cargarPedidos();
        }
    };

    const handlePausarOperacion = async (motivo?: string) => {
        if (!miOperacionActual) return;
        
        await pausarOperacion({
            operacionId: miOperacionActual.id,
            motivo
        });
    };

    const handleReanudarOperacion = async () => {
        if (!miOperacionActual) return;
        await reanudarOperacion(miOperacionActual.id);
    };

    const handleCompletarOperacion = async (metrosProducidos: number, observaciones?: string) => {
        if (!miOperacionActual) return;

        const result = await completarOperacion({
            operacionId: miOperacionActual.id,
            metrosProducidos,
            observaciones,
            calidad: 'ok'
        });

        if (result.success) {
            setMostrarModalCompletar(false);
            await cargarPedidos();
        }
    };

    // Filtrar pedidos por máquina según etapa de producción
    const pedidosFiltrados = maquinaSeleccionada === 'todas'
        ? pedidosDisponibles
        : pedidosDisponibles.filter(p => p.etapaActual === maquinaSeleccionada);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            {/* Header con info del operador */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            Modo Operador
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {user?.displayName || user?.username}
                        </p>
                    </div>
                    
                    <button
                        onClick={() => setMostrarMetricas(!mostrarMetricas)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span>📊</span>
                        <span>{mostrarMetricas ? 'Ocultar' : 'Ver'} Métricas</span>
                    </button>
                </div>
            </div>

            {/* Panel de métricas (colapsable) */}
            {mostrarMetricas && estadisticas && (
                <div className="mb-6">
                    <MetricasProduccionPanel estadisticas={estadisticas} />
                </div>
            )}

            {/* Operación actual (si existe) */}
            {miOperacionActual && (
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-yellow-400">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">🔧</span>
                            Operación en Curso
                        </h2>
                        {miOperacionActual.estado === 'en_progreso' && (
                            <CronometroOperacion fechaInicio={miOperacionActual.fechaInicio} />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pedido</p>
                            <p className="font-bold text-lg">{miOperacionActual.numeroPedidoCliente}</p>
                            <p className="text-gray-600 dark:text-gray-300">{miOperacionActual.cliente}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Máquina</p>
                            <p className="font-bold text-lg">{miOperacionActual.maquina}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Metros</p>
                            <p className="font-bold text-lg">
                                {miOperacionActual.metrosProducidos} / {miOperacionActual.metrosTotalesPedido}m
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                            <p className={`font-bold text-lg ${
                                miOperacionActual.estado === 'en_progreso' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                                {miOperacionActual.estado === 'en_progreso' ? '🟢 En Progreso' : '⏸️ Pausada'}
                            </p>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-3">
                        {miOperacionActual.estado === 'en_progreso' ? (
                            <>
                                <button
                                    onClick={() => handlePausarOperacion()}
                                    className="flex-1 min-w-[150px] px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                                >
                                    ⏸️ Pausar
                                </button>
                                <button
                                    onClick={() => setMostrarModalCompletar(true)}
                                    className="flex-1 min-w-[150px] px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                                >
                                    ✅ Completar
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleReanudarOperacion}
                                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                            >
                                ▶️ Reanudar
                            </button>
                        )}
                    </div>

                    {miOperacionActual.motivoPausa && (
                        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                                <strong>Motivo de pausa:</strong> {miOperacionActual.motivoPausa}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Filtro de máquinas */}
            <div className="mb-6">
                <FiltroMaquina
                    maquinas={MAQUINAS_DISPONIBLES}
                    maquinaSeleccionada={maquinaSeleccionada}
                    onSeleccionar={setMaquinaSeleccionada}
                />
            </div>

            {/* Lista de pedidos disponibles */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Pedidos Disponibles
                    </h2>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                        {pedidosFiltrados.length} pedidos
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando pedidos...</p>
                    </div>
                ) : pedidosFiltrados.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                        <span className="text-6xl">📦</span>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            No hay pedidos disponibles en este momento
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pedidosFiltrados.map(pedido => (
                            <TarjetaPedidoOperador
                                key={pedido.id}
                                pedido={pedido}
                                onIniciar={() => setPedidoParaIniciar(pedido)}
                                disabled={!!miOperacionActual}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modales */}
            {pedidoParaIniciar && (
                <ModalIniciarOperacion
                    pedido={pedidoParaIniciar}
                    maquinas={MAQUINAS_DISPONIBLES.filter(m => m.id !== 'todas')}
                    onConfirmar={handleIniciarOperacion}
                    onCancelar={() => setPedidoParaIniciar(null)}
                />
            )}

            {mostrarModalCompletar && miOperacionActual && (
                <ModalCompletarOperacion
                    operacion={miOperacionActual}
                    onConfirmar={handleCompletarOperacion}
                    onCancelar={() => setMostrarModalCompletar(false)}
                />
            )}
        </div>
    );
}
