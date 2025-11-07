import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface PedidoLock {
  pedidoId: string;
  userId: string;
  username: string;
  lockedAt: number;
}

/**
 * Hook ligero para observar el estado de bloqueo de pedidos sin intentar bloquearlos.
 * Útil para mostrar indicadores visuales en listas y tarjetas.
 */
export const useLockObserver = () => {
  const socketRef = useRef<Socket | null>(null);
  const [locks, setLocks] = useState<Map<string, PedidoLock>>(new Map());

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const socketUrl = API_URL ? API_URL.replace('/api', '') : window.location.origin;
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('get-locks');
    });

    socket.on('locks-updated', (data: { locks: PedidoLock[] }) => {
      const locksMap = new Map<string, PedidoLock>();
      data.locks.forEach(lock => {
        locksMap.set(lock.pedidoId, lock);
      });
      setLocks(locksMap);
    });

    socket.on('pedido-locked', (data: { pedidoId: string; userId: string; username: string; lockedAt: number }) => {
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
    });

    socket.on('pedido-unlocked', (data: { pedidoId: string }) => {
      setLocks(prev => {
        const newLocks = new Map(prev);
        newLocks.delete(data.pedidoId);
        return newLocks;
      });
    });

    return () => {
      socket.disconnect();
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
