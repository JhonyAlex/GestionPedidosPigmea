import { useState, useEffect } from 'react';
import WebSocketService from '../services/websocket';

interface PedidoLock {
  pedidoId: string;
  userId: string;
  username: string;
  lockedAt: number;
}

/**
 * Hook ligero para observar el estado de bloqueo de pedidos sin intentar bloquearlos.
 * Útil para mostrar indicadores visuales en listas y tarjetas.
 * Usa el WebSocketService centralizado para evitar múltiples conexiones.
 */
export const useLockObserver = () => {
  const [locks, setLocks] = useState<Map<string, PedidoLock>>(new Map());

  useEffect(() => {
    const socket = WebSocketService.getSocket();
    if (!socket) return;

    // Solicitar locks al conectar/reconectar
    const handleConnect = () => {
      socket.emit('get-locks');
    };

    const handleLocksUpdated = (data: { locks: PedidoLock[] }) => {
      const locksMap = new Map<string, PedidoLock>();
      data.locks.forEach(lock => {
        locksMap.set(lock.pedidoId, lock);
      });
      setLocks(locksMap);
    };

    const handlePedidoLocked = (data: { pedidoId: string; userId: string; username: string; lockedAt: number }) => {
      setLocks(prev => {
        const newLocks = new Map(prev);
        newLocks.set(data.pedidoId, {
          pedidoId: data.pedidoId,
          userId: data.userId,
          username: data.username,
          lockedAt: data.lockedAt
        });
        return newLocks;
      });
    };

    const handlePedidoUnlocked = (data: { pedidoId: string }) => {
      setLocks(prev => {
        const newLocks = new Map(prev);
        newLocks.delete(data.pedidoId);
        return newLocks;
      });
    };

    // Suscribirse a eventos
    socket.on('connect', handleConnect);
    socket.on('locks-updated', handleLocksUpdated);
    socket.on('pedido-locked', handlePedidoLocked);
    socket.on('pedido-unlocked', handlePedidoUnlocked);

    // Solicitar locks inicial si ya está conectado
    if (socket.connected) {
      socket.emit('get-locks');
    }

    return () => {
      // Solo remover listeners, NO desconectar el socket (es compartido)
      socket.off('connect', handleConnect);
      socket.off('locks-updated', handleLocksUpdated);
      socket.off('pedido-locked', handlePedidoLocked);
      socket.off('pedido-unlocked', handlePedidoUnlocked);
    };
  }, []);

  const getLockInfo = (pedidoId: string, currentUserId?: string) => {
    const lock = locks.get(pedidoId);
    if (!lock) {
      return { isLocked: false, isLockedByMe: false, lockedBy: null };
    }

    return {
      isLocked: true,
      isLockedByMe: currentUserId ? lock.userId === currentUserId.toString() : false,
      lockedBy: lock.username
    };
  };

  return {
    locks,
    getLockInfo
  };
};
