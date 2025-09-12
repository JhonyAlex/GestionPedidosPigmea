import React, { useState, useMemo } from 'react';
import { Cliente, Pedido, EstadisticasCliente, Etapa } from '../types';

interface ClienteModalProps {
    cliente: Cliente;
    pedidos: Pedido[];
    estadisticas: EstadisticasCliente;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (cliente: Cliente) => void;
    onDelete: (clienteId: string) => void;
}

const ClienteModal: React.FC<ClienteModalProps> = ({
    cliente,
    pedidos,
    estadisticas,
    isOpen,
    onClose,
    onEdit,
    onDelete
}) => {
    const [activeTab, setActiveTab] = useState<'perfil' | 'pedidos' | 'estadisticas'>('perfil');
    const [pedidoFilter, setPedidoFilter] = useState<'todos' | 'activos' | 'completados' | 'pausados'>('todos');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Filtrar pedidos del cliente
    const pedidosCliente = useMemo(() => {
        const clientePedidos = pedidos.filter(p => p.cliente === cliente.nombre);
        
        switch (pedidoFilter) {
            case 'activos':
                return clientePedidos.filter(p => p.etapaActual !== Etapa.COMPLETADO && p.etapaActual !== Etapa.ARCHIVADO);
            case 'completados':
                return clientePedidos.filter(p => p.etapaActual === Etapa.COMPLETADO);
            case 'pausados':
                return clientePedidos.filter(p => p.etapaActual === Etapa.ARCHIVADO);
            default:
                return clientePedidos;
        }
    }, [pedidos, cliente.nombre, pedidoFilter]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getEstadoColor = (etapa: Etapa) => {
        switch (etapa) {
            case Etapa.COMPLETADO: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case Etapa.ARCHIVADO: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case Etapa.PREPARACION: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case Etapa.PENDIENTE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Overlay */}
                <div 
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${cliente.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {cliente.nombre}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Cliente desde {formatDate(cliente.fechaRegistro)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onEdit(cliente)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Editar cliente"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Eliminar cliente"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 mt-6 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        {[
                            { id: 'perfil', label: 'Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                            { id: 'pedidos', label: 'Pedidos', icon: 'M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                            { id: 'estadisticas', label: 'Estadísticas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {activeTab === 'perfil' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Información personal */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                                        Información Personal
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</label>
                                            <p className="text-gray-900 dark:text-white">{cliente.nombre}</p>
                                        </div>
                                        
                                        {cliente.contacto && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contacto</label>
                                                <p className="text-gray-900 dark:text-white">{cliente.contacto}</p>
                                            </div>
                                        )}
                                        
                                        {cliente.email && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                                                <p className="text-gray-900 dark:text-white">{cliente.email}</p>
                                            </div>
                                        )}
                                        
                                        {cliente.telefono && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Teléfono</label>
                                                <p className="text-gray-900 dark:text-white">{cliente.telefono}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Información de ubicación */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                                        Ubicación
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {cliente.direccion && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Dirección</label>
                                                <p className="text-gray-900 dark:text-white">{cliente.direccion}</p>
                                            </div>
                                        )}
                                        
                                        {cliente.ciudad && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ciudad</label>
                                                <p className="text-gray-900 dark:text-white">{cliente.ciudad}</p>
                                            </div>
                                        )}
                                        
                                        {cliente.codigoPostal && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Código Postal</label>
                                                <p className="text-gray-900 dark:text-white">{cliente.codigoPostal}</p>
                                            </div>
                                        )}
                                        
                                        {cliente.pais && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">País</label>
                                                <p className="text-gray-900 dark:text-white">{cliente.pais}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {cliente.notas && (
                                        <div className="mt-6">
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notas</label>
                                            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <p className="text-gray-900 dark:text-white text-sm">{cliente.notas}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'pedidos' && (
                            <div>
                                {/* Filtros de pedidos */}
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Histórico de Pedidos ({pedidosCliente.length})
                                    </h4>
                                    
                                    <select
                                        value={pedidoFilter}
                                        onChange={(e) => setPedidoFilter(e.target.value as any)}
                                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    >
                                        <option value="todos">Todos ({pedidos.filter(p => p.cliente === cliente.nombre).length})</option>
                                        <option value="activos">Activos ({pedidos.filter(p => p.cliente === cliente.nombre && p.etapaActual !== Etapa.COMPLETADO && p.etapaActual !== Etapa.ARCHIVADO).length})</option>
                                        <option value="completados">Completados ({pedidos.filter(p => p.cliente === cliente.nombre && p.etapaActual === Etapa.COMPLETADO).length})</option>
                                        <option value="pausados">Archivados ({pedidos.filter(p => p.cliente === cliente.nombre && p.etapaActual === Etapa.ARCHIVADO).length})</option>
                                    </select>
                                </div>

                                {/* Lista de pedidos */}
                                <div className="space-y-3">
                                    {pedidosCliente.length > 0 ? (
                                        pedidosCliente.map(pedido => (
                                            <div key={pedido.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            #{pedido.numeroPedidoCliente}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.etapaActual)}`}>
                                                            {pedido.etapaActual}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {formatDate(pedido.fechaCreacion)}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Producto:</span>
                                                        <p className="font-medium text-gray-900 dark:text-white">{pedido.producto || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Desarrollo:</span>
                                                        <p className="font-medium text-gray-900 dark:text-white">{pedido.desarrollo}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Metros:</span>
                                                        <p className="font-medium text-gray-900 dark:text-white">{pedido.metros}m</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Etapa:</span>
                                                        <p className="font-medium text-gray-900 dark:text-white">{pedido.etapaActual}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No hay pedidos para mostrar con los filtros seleccionados
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'estadisticas' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Estadísticas generales */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                                        Resumen General
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {estadisticas.totalPedidos}
                                            </div>
                                            <div className="text-sm text-blue-700 dark:text-blue-300">Total Pedidos</div>
                                        </div>
                                        
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {estadisticas.pedidosCompletados}
                                            </div>
                                            <div className="text-sm text-green-700 dark:text-green-300">Completados</div>
                                        </div>
                                        
                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                {estadisticas.pedidosActivos}
                                            </div>
                                            <div className="text-sm text-orange-700 dark:text-orange-300">Activos</div>
                                        </div>
                                        
                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                {estadisticas.tiempoPromedioProduccion}d
                                            </div>
                                            <div className="text-sm text-purple-700 dark:text-purple-300">Tiempo Promedio</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                                            {estadisticas.volumenTotalMetros}m
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Volumen Total Producido</div>
                                    </div>
                                </div>

                                {/* Productos más solicitados */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                                        Productos Más Solicitados
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {estadisticas.productosMasSolicitados.map((producto, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {producto.producto}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {producto.volumenTotal}m total
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-blue-600 dark:text-blue-400">
                                                        {producto.cantidad}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        pedidos
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmación de eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-60 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" />
                        
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    ¿Eliminar cliente?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Esta acción no se puede deshacer. Se eliminará permanentemente el cliente <strong>{cliente.nombre}</strong> y toda su información.
                                </p>
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(cliente.id);
                                        setShowDeleteConfirm(false);
                                        onClose();
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClienteModal;