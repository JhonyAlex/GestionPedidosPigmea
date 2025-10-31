import React, { useState, useEffect } from 'react';
import { Cliente } from '../hooks/useClientesManager';
import { Pedido } from '../types';
import { Icons } from './Icons';
import { clienteService } from '../services/clienteService';
import { formatDateDDMMYYYY } from '../utils/date';

interface ClienteDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente;
    onPedidoClick?: (pedidoId: string) => void;
    onCrearPedido?: (cliente: Cliente) => void;
}

interface ClienteEstadisticas {
    pedidos_en_produccion: number;
    pedidos_completados: number;
    pedidos_archivados: number;
    total_pedidos: number;
    metros_producidos: number;
    ultimo_pedido_fecha: string | null;
}

const ClienteDetailModal: React.FC<ClienteDetailModalProps> = ({ isOpen, onClose, cliente, onPedidoClick, onCrearPedido }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'preparacion' | 'produccion' | 'completados' | 'archivados'>('info');
    const [pedidosPreparacion, setPedidosPreparacion] = useState<Pedido[]>([]);
    const [pedidosProduccion, setPedidosProduccion] = useState<Pedido[]>([]);
    const [pedidosCompletados, setPedidosCompletados] = useState<Pedido[]>([]);
    const [pedidosArchivados, setPedidosArchivados] = useState<Pedido[]>([]);
    const [estadisticas, setEstadisticas] = useState<ClienteEstadisticas | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && cliente) {
            fetchClienteData();
        }
    }, [isOpen, cliente]);

    const fetchClienteData = async () => {
        setIsLoading(true);
        try {
            // ✅ Usar el servicio en lugar de fetch directo
            
            // Fetch estadísticas
            try {
                const stats = await clienteService.obtenerEstadisticasCliente(cliente.id);
                setEstadisticas(stats);
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            }

            // Fetch pedidos en preparación (PREPARACION y PENDIENTE)
            try {
                const preparacion = await clienteService.obtenerPedidosCliente(cliente.id, 'preparacion');
                setPedidosPreparacion(preparacion);
            } catch (error) {
                console.error('Error al cargar pedidos en preparación:', error);
                setPedidosPreparacion([]);
            }

            // Fetch pedidos en producción (IMPRESION_* y POST_*)
            try {
                const produccion = await clienteService.obtenerPedidosCliente(cliente.id, 'produccion');
                setPedidosProduccion(produccion);
            } catch (error) {
                console.error('Error al cargar pedidos en producción:', error);
                setPedidosProduccion([]);
            }

            // Fetch pedidos completados
            try {
                const completados = await clienteService.obtenerPedidosCliente(cliente.id, 'completado');
                setPedidosCompletados(completados.slice(0, 10)); // Solo los últimos 10
            } catch (error) {
                console.error('Error al cargar pedidos completados:', error);
                setPedidosCompletados([]);
            }

            // Fetch pedidos archivados
            try {
                const archivados = await clienteService.obtenerPedidosCliente(cliente.id, 'archivado');
                setPedidosArchivados(archivados.slice(0, 10)); // Solo los últimos 10
            } catch (error) {
                console.error('Error al cargar pedidos archivados:', error);
                setPedidosArchivados([]);
            }
        } catch (error) {
            console.error('Error al cargar datos del cliente:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePedidoClick = (pedidoId: string) => {
        if (onPedidoClick) {
            onPedidoClick(pedidoId);
        }
        onClose();
    };

    const getEtapaColor = (etapa: string) => {
        if (etapa === 'COMPLETADO') return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
        if (etapa === 'ARCHIVADO') return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
        if (etapa === 'PREPARACION') return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
        if (etapa === 'PENDIENTE') return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
        if (etapa.startsWith('IMPRESION_')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
        if (etapa.startsWith('POST_')) return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    };

    const formatEtapa = (etapa: string) => {
        // Diccionario de etapas formateadas
        const etapasFormato: { [key: string]: string } = {
            'PREPARACION': 'Preparación',
            'PENDIENTE': 'Pendiente',
            // Impresión
            'IMPRESION_WM1': 'Impresión WM1',
            'IMPRESION_GIAVE': 'Impresión GIAVE',
            'IMPRESION_WM3': 'Impresión WM3',
            'IMPRESION_ANON': 'Impresión ANON',
            // Post-procesamiento
            'POST_LAMINACION_SL2': 'Laminación SL2',
            'POST_LAMINACION_NEXUS': 'Laminación NEXUS',
            'POST_REBOBINADO_S2DT': 'Rebobinado S2DT',
            'POST_REBOBINADO_PROSLIT': 'Rebobinado PROSLIT',
            'POST_PERFORACION_MIC': 'Perforación MIC',
            'POST_PERFORACION_MAC': 'Perforación MAC',
            'POST_REBOBINADO_TEMAC': 'Rebobinado TEMAC',
            'COMPLETADO': 'Completado',
            'ARCHIVADO': 'Archivado'
        };
        
        return etapasFormato[etapa] || etapa.replace(/_/g, ' ');
    };

    const formatFecha = (fecha: string) => {
        if (!fecha) return 'N/A';
        return formatDateDDMMYYYY(fecha);
    };

    if (!isOpen) return null;

    const renderPedidosList = (pedidos: Pedido[], emptyMessage: string) => {
        if (pedidos.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Icons.NoData className="mx-auto h-12 w-12 mb-2" />
                    <p>{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {pedidos.map((pedido) => (
                    <div
                        key={pedido.id}
                        onClick={() => handlePedidoClick(pedido.id)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {pedido.numeroPedidoCliente || pedido.numeroRegistro}
                                    </h4>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${getEtapaColor(pedido.etapaActual)}`}>
                                        {formatEtapa(pedido.etapaActual)}
                                    </span>
                                </div>
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Icons.Calendar className="h-4 w-4" />
                                        <span>Entrega: {formatFecha(pedido.fechaEntrega)}</span>
                                    </div>
                                    {pedido.nuevaFechaEntrega && (
                                        <div className="flex items-center gap-2">
                                            <Icons.Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-blue-600 dark:text-blue-400 font-medium">Nueva: {formatFecha(pedido.nuevaFechaEntrega)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Icons.Ruler className="h-4 w-4" />
                                        <span>{pedido.metros} metros</span>
                                    </div>
                                </div>
                            </div>
                            <Icons.ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {cliente.nombre}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {cliente.razon_social || cliente.cif}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {onCrearPedido && (
                            <button
                                onClick={() => {
                                    onCrearPedido(cliente);
                                    onClose();
                                }}
                                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
                            >
                                <Icons.Plus className="h-4 w-4 mr-2" />
                                Crear Pedido
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Icons.Close className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b dark:border-gray-700 px-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'info'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        Información
                    </button>
                    <button
                        onClick={() => setActiveTab('preparacion')}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'preparacion'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        En Preparación
                        {pedidosPreparacion.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                                {pedidosPreparacion.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('produccion')}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'produccion'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        En Producción
                        {pedidosProduccion.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                {pedidosProduccion.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('completados')}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'completados'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        Completados
                        {pedidosCompletados.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                                {pedidosCompletados.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('archivados')}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'archivados'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        Archivados
                        {pedidosArchivados.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full">
                                {pedidosArchivados.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'info' && (
                                <div className="space-y-6">
                                    {/* Estadísticas */}
                                    {estadisticas && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">En Producción</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {estadisticas.pedidos_en_produccion}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {estadisticas.pedidos_completados}
                                                </p>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pedidos</p>
                                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                    {estadisticas.total_pedidos}
                                                </p>
                                            </div>
                                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Metros Producidos</p>
                                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                    {Number(estadisticas.metros_producidos || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Información del Cliente */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Datos de Contacto</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex items-center text-sm">
                                                <Icons.Contact className="h-5 w-5 mr-3 text-gray-400" />
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Contacto</p>
                                                    <p className="text-gray-900 dark:text-white">{cliente.persona_contacto || 'No especificado'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Icons.Phone className="h-5 w-5 mr-3 text-gray-400" />
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Teléfono</p>
                                                    <p className="text-gray-900 dark:text-white">{cliente.telefono}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Icons.Email className="h-5 w-5 mr-3 text-gray-400" />
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Email</p>
                                                    <p className="text-gray-900 dark:text-white truncate">{cliente.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Icons.Location className="h-5 w-5 mr-3 text-gray-400" />
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Dirección</p>
                                                    <p className="text-gray-900 dark:text-white">{cliente.direccion}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {cliente.observaciones && (
                                            <div className="mt-4 pt-4 border-t dark:border-gray-600">
                                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Observaciones</p>
                                                <p className="text-gray-900 dark:text-white text-sm">{cliente.observaciones}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'preparacion' && renderPedidosList(pedidosPreparacion, 'No hay pedidos en preparación')}
                            {activeTab === 'produccion' && renderPedidosList(pedidosProduccion, 'No hay pedidos en producción')}
                            {activeTab === 'completados' && renderPedidosList(pedidosCompletados, 'No hay pedidos completados')}
                            {activeTab === 'archivados' && renderPedidosList(pedidosArchivados, 'No hay pedidos archivados')}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClienteDetailModal;
