import React, { useState, useEffect } from 'react';
import { Cliente } from '../hooks/useClientesManager';
import { Icons } from './Icons';
import { clienteService } from '../services/clienteService';

interface DeleteClienteModalProps {
  isOpen: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onConfirm: (clienteId: string, deleteWithPedidos: boolean) => Promise<void>;
}

interface ClienteStats {
  total_pedidos: number;
  pedidos_activos: number;
  pedidos_en_produccion: number;
  pedidos_completados: number;
}

const DeleteClienteModal: React.FC<DeleteClienteModalProps> = ({
  isOpen,
  cliente,
  onClose,
  onConfirm,
}) => {
  const [stats, setStats] = useState<ClienteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'archive' | 'delete'>('archive');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen && cliente) {
      fetchStats();
      setConfirmText('');
      setDeleteOption('archive');
    }
  }, [isOpen, cliente]);

  const fetchStats = async () => {
    if (!cliente) return;
    
    setIsLoadingStats(true);
    try {
      const data = await clienteService.obtenerEstadisticasCliente(cliente.id);
      setStats({
        total_pedidos: parseInt(data.total_pedidos || 0),
        pedidos_activos: parseInt(data.pedidos_activos || 0),
        pedidos_en_produccion: parseInt(data.pedidos_en_produccion || 0),
        pedidos_completados: parseInt(data.pedidos_completados || 0),
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleConfirm = async () => {
    if (!cliente) return;

    // Si se va a eliminar permanentemente, requiere confirmación
    if (deleteOption === 'delete' && confirmText !== cliente.nombre) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm(cliente.id, deleteOption === 'delete');
      onClose();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert((error as Error).message || 'Error al eliminar el cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !cliente) return null;

  const hasPedidos = stats && stats.total_pedidos > 0;
  const hasPedidosActivos = stats && stats.pedidos_activos > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Icons.Trash className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Eliminar Cliente
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esta acción afectará al cliente y sus datos relacionados
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isDeleting}
          >
            <Icons.Close className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cliente Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Cliente a eliminar:
            </h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {cliente.nombre}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cliente.razon_social || cliente.cif}
            </p>
          </div>

          {/* Stats Loading or Display */}
          {isLoadingStats ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : hasPedidos ? (
            <div className="space-y-4">
              {/* Warning Alert */}
              <div className={`p-4 rounded-lg ${hasPedidosActivos ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
                <div className="flex gap-3">
                  <Icons.Warning className={`h-5 w-5 flex-shrink-0 mt-0.5 ${hasPedidosActivos ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                  <div>
                    <h4 className={`font-semibold ${hasPedidosActivos ? 'text-red-900 dark:text-red-200' : 'text-yellow-900 dark:text-yellow-200'}`}>
                      {hasPedidosActivos ? '¡Atención! Este cliente tiene pedidos activos' : 'Este cliente tiene pedidos asociados'}
                    </h4>
                    <p className={`text-sm mt-1 ${hasPedidosActivos ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                      {hasPedidosActivos 
                        ? 'Eliminar este cliente afectará sus pedidos activos o en producción.'
                        : 'Puedes archivar el cliente o eliminarlo completamente con sus pedidos.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pedidos Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_pedidos}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Total pedidos
                  </p>
                </div>
                {stats.pedidos_activos > 0 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.pedidos_activos}
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      Activos
                    </p>
                  </div>
                )}
                {stats.pedidos_en_produccion > 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.pedidos_en_produccion}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      En producción
                    </p>
                  </div>
                )}
                {stats.pedidos_completados > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.pedidos_completados}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Completados
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex gap-3">
                <Icons.Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-200">
                    Cliente sin pedidos
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Este cliente no tiene pedidos asociados, se puede eliminar sin problemas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delete Options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Selecciona una opción:
            </h4>
            
            {/* Opción Archivar */}
            <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              deleteOption === 'archive'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <input
                type="radio"
                name="deleteOption"
                value="archive"
                checked={deleteOption === 'archive'}
                onChange={(e) => setDeleteOption(e.target.value as 'archive' | 'delete')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icons.Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Archivar cliente (Recomendado)
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  El cliente se marcará como archivado pero sus datos y pedidos se conservarán. 
                  Los pedidos permanecerán intactos y podrás restaurar el cliente después.
                </p>
              </div>
            </label>

            {/* Opción Eliminar Permanentemente */}
            <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              deleteOption === 'delete'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <input
                type="radio"
                name="deleteOption"
                value="delete"
                checked={deleteOption === 'delete'}
                onChange={(e) => setDeleteOption(e.target.value as 'archive' | 'delete')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icons.Trash className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Eliminar permanentemente
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <strong className="text-red-600 dark:text-red-400">¡Peligro!</strong> El cliente y TODOS sus pedidos 
                  ({stats?.total_pedidos || 0}) serán eliminados permanentemente de la base de datos. 
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </label>
          </div>

          {/* Confirmación para eliminación permanente */}
          {deleteOption === 'delete' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 space-y-3">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                Para confirmar la eliminación permanente, escribe el nombre del cliente:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={cliente.nombre}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isDeleting}
              />
              {confirmText !== '' && confirmText !== cliente.nombre && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  El nombre no coincide. Por favor, escribe exactamente: <strong>{cliente.nombre}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || (deleteOption === 'delete' && confirmText !== cliente.nombre)}
            className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              deleteOption === 'archive'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {deleteOption === 'archive' ? 'Archivando...' : 'Eliminando...'}
              </>
            ) : (
              <>
                {deleteOption === 'archive' ? (
                  <>
                    <Icons.Archive className="h-4 w-4" />
                    Archivar Cliente
                  </>
                ) : (
                  <>
                    <Icons.Trash className="h-4 w-4" />
                    Eliminar Permanentemente
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClienteModal;
