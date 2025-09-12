import React from 'react';
import { Cliente } from '../types';

interface ClienteCardProps {
    cliente: Cliente;
    onClick: () => void;
}

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, onClick }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return null;
        // Formatear teléfono: +XX XXX XXX XXX
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length >= 10) {
            return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
        }
        return phone;
    };

    const getActivityColor = () => {
        if (!cliente.ultimaActividad) return 'text-gray-400';
        
        const daysSince = Math.floor(
            (Date.now() - new Date(cliente.ultimaActividad).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSince <= 7) return 'text-green-600 dark:text-green-400';
        if (daysSince <= 30) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getActivityLabel = () => {
        if (!cliente.ultimaActividad) return 'Sin actividad';
        
        const daysSince = Math.floor(
            (Date.now() - new Date(cliente.ultimaActividad).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSince === 0) return 'Hoy';
        if (daysSince === 1) return 'Ayer';
        if (daysSince <= 7) return `Hace ${daysSince} días`;
        if (daysSince <= 30) return `Hace ${Math.floor(daysSince / 7)} semanas`;
        return `Hace ${Math.floor(daysSince / 30)} meses`;
    };

    return (
        <div 
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg 
                       border border-gray-200 dark:border-gray-700 cursor-pointer
                       transition-all duration-300 hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-600
                       p-6 relative overflow-hidden group"
        >
            {/* Estado activo indicator */}
            <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-lg ${
                cliente.activo 
                    ? 'bg-green-500' 
                    : 'bg-gray-400'
            }`} />

            {/* Header con nombre y estado */}
            <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight pr-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cliente.nombre}
                    </h3>
                    {!cliente.activo && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                            Inactivo
                        </span>
                    )}
                </div>

                {/* Información de contacto */}
                <div className="space-y-1">
                    {cliente.ciudad && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">{cliente.ciudad}</span>
                        </div>
                    )}
                    
                    {cliente.email && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <span className="truncate">{cliente.email}</span>
                        </div>
                    )}
                    
                    {cliente.telefono && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <span className="truncate">{formatPhone(cliente.telefono)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Estadísticas en grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {cliente.totalPedidos || 0}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Pedidos</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {cliente.pedidosActivos || 0}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">Activos</div>
                </div>
            </div>

            {/* Métricas adicionales */}
            <div className="space-y-2 mb-4">
                {cliente.volumenTotal !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Volumen total:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {cliente.volumenTotal}m
                        </span>
                    </div>
                )}
                
                {cliente.montoTotal !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Valor total:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            ${cliente.montoTotal.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {/* Footer con última actividad */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Última actividad:</span>
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getActivityColor().replace('text-', 'bg-')}`} />
                        <span className={`font-medium ${getActivityColor()}`}>
                            {getActivityLabel()}
                        </span>
                    </div>
                </div>
                
                {cliente.fechaRegistro && (
                    <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-500 dark:text-gray-400">Cliente desde:</span>
                        <span className="text-gray-600 dark:text-gray-400">
                            {formatDate(cliente.fechaRegistro)}
                        </span>
                    </div>
                )}
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
        </div>
    );
};

export default ClienteCard;