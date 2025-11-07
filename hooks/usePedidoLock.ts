import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface PedidoLock {
  pedidoId: string;
  userId: string;
  username: string;
  lockedAt: number;
}

interface UsePedidoLockOptions {
  pedidoId: string | null;
  onLockDenied?: (lockedBy: string) => void;
  onLockLost?: () => void;
  autoUnlock?: boolean; // Si es true, desbloquea automáticamente al desmontar
}

/**
 * Hook para gestionar el bloqueo de pedidos en tiempo real.
 * Maneja el ciclo completo de bloqueo/desbloqueo y detecta inactividad.
 */
export const usePedidoLock = ({
  pedidoId,
  onLockDenied,
  onLockLost,
  autoUnlock = true
}: UsePedidoLockOptions) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [allLocks, setAllLocks] = useState<PedidoLock[]>([]);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isUnmountingRef = useRef(false);

  // Conectar al WebSocket
  useEffect(() => {
    if (!user) return;

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
      console.log('🔌 Socket conectado para sistema de bloqueo');
      
      // Solicitar lista actual de bloqueos
      socket.emit('get-locks');
    });

    socket.on('lock-acquired', (data: { pedidoId: string; userId: string; username: string }) => {
      if (data.pedidoId === pedidoId && data.userId === user.id.toString()) {
        console.log(`🔒 Bloqueo adquirido para pedido ${pedidoId}`);
        setIsLocked(true);
        setIsLockedByMe(true);
        setLockedBy(user.displayName || user.username);
      }
    });

    socket.on('lock-denied', (data: { pedidoId: string; lockedBy: string }) => {
      if (data.pedidoId === pedidoId) {
        console.log(`❌ Bloqueo denegado para pedido ${pedidoId}. Bloqueado por: ${data.lockedBy}`);
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.lockedBy);
        
        if (onLockDenied) {
          onLockDenied(data.lockedBy);
        }
      }
    });

    socket.on('pedido-locked', (data: { pedidoId: string; userId: string; username: string }) => {
      if (data.pedidoId === pedidoId && data.userId !== user.id.toString()) {
        console.log(`🔒 Pedido ${pedidoId} bloqueado por otro usuario: ${data.username}`);
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.username);
      }
    });

    socket.on('pedido-unlocked', (data: { pedidoId: string; reason: string }) => {
      if (data.pedidoId === pedidoId) {
        console.log(`🔓 Pedido ${pedidoId} desbloqueado. Razón: ${data.reason}`);
        setIsLocked(false);
        setIsLockedByMe(false);
        setLockedBy(null);
        
        // Si era nuestro bloqueo y se perdió por timeout, notificar
        if (isLockedByMe && data.reason === 'timeout' && onLockLost) {
          onLockLost();
        }
      }
    });

    socket.on('locks-updated', (data: { locks: PedidoLock[] }) => {
      setAllLocks(data.locks);
      
      // Verificar si el pedido actual está en la lista
      if (pedidoId) {
        const lock = data.locks.find(l => l.pedidoId === pedidoId);
        if (lock) {
          setIsLocked(true);
          setIsLockedByMe(lock.userId === user.id.toString());
          setLockedBy(lock.username);
        } else {
          setIsLocked(false);
          setIsLockedByMe(false);
          setLockedBy(null);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, pedidoId, onLockDenied, onLockLost, isLockedByMe]);

  // Intentar bloquear el pedido
  const lockPedido = useCallback(() => {
    if (!user || !pedidoId || !socketRef.current) {
      console.warn('⚠️ No se puede bloquear: falta usuario, pedidoId o socket');
      return;
    }

    const username = user.displayName || user.username;
    console.log(`🔒 Solicitando bloqueo para pedido ${pedidoId}`);
    
    socketRef.current.emit('lock-pedido', {
      pedidoId,
      userId: user.id.toString(),
      username
    });

    // Iniciar envío periódico de actividad (cada 60 segundos)
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
    }

    activityIntervalRef.current = setInterval(() => {
      if (socketRef.current && !isUnmountingRef.current) {
        socketRef.current.emit('pedido-activity', {
          pedidoId,
          userId: user.id.toString()
        });
        lastActivityRef.current = Date.now();
      }
    }, 60000); // Cada 60 segundos
  }, [user, pedidoId]);

  // Desbloquear el pedido
  const unlockPedido = useCallback(() => {
    if (!user || !pedidoId || !socketRef.current) {
      return;
    }

    console.log(`🔓 Desbloqueando pedido ${pedidoId}`);
    
    socketRef.current.emit('unlock-pedido', {
      pedidoId,
      userId: user.id.toString()
    });

    // Limpiar intervalo de actividad
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }

    setIsLocked(false);
    setIsLockedByMe(false);
    setLockedBy(null);
  }, [user, pedidoId]);

  // Auto-desbloquear al cambiar de pedido o al desmontar
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      
      if (autoUnlock && isLockedByMe) {
        unlockPedido();
      }

      // Limpiar intervalo de actividad
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [autoUnlock, isLockedByMe, unlockPedido]);

  // Detectar cuando el usuario cambia de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isLockedByMe) {
        // Actualizar última actividad pero no desbloquear
        lastActivityRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && isLockedByMe) {
        // Al volver, enviar señal de actividad inmediatamente
        if (socketRef.current && pedidoId && user) {
          socketRef.current.emit('pedido-activity', {
            pedidoId,
            userId: user.id.toString()
          });
          lastActivityRef.current = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLockedByMe, pedidoId, user]);

  // Detectar cierre de navegador / pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLockedByMe && socketRef.current && pedidoId && user) {
        // Intentar desbloquear antes de cerrar
        socketRef.current.emit('unlock-pedido', {
          pedidoId,
          userId: user.id.toString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLockedByMe, pedidoId, user]);

  return {
    isLocked,
    isLockedByMe,
    lockedBy,
    allLocks,
    lockPedido,
    unlockPedido
  };
};
