import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WebSocketService from '../services/websocket';

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
  autoUnlock?: boolean;
}

/**
 * Hook para gestionar el bloqueo de pedidos en tiempo real.
 * Maneja el ciclo completo de bloqueo/desbloqueo y detecta inactividad.
 * Usa el WebSocketService centralizado para evitar múltiples conexiones.
 */
export const usePedidoLock = ({
  pedidoId,
  onLockDenied,
  onLockLost,
  autoUnlock = true
}: UsePedidoLockOptions) => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [allLocks, setAllLocks] = useState<PedidoLock[]>([]);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isUnmountingRef = useRef(false);
  const currentPedidoIdRef = useRef<string | null>(null);
  const isLockedByMeRef = useRef<boolean>(false);
  
  const pedidoIdRef = useRef(pedidoId);
  const onLockDeniedRef = useRef(onLockDenied);
  const onLockLostRef = useRef(onLockLost);
  
  useEffect(() => {
    pedidoIdRef.current = pedidoId;
    onLockDeniedRef.current = onLockDenied;
    onLockLostRef.current = onLockLost;
  }, [pedidoId, onLockDenied, onLockLost]);

  // Suscribirse a eventos WebSocket
  useEffect(() => {
    if (!user) return;

    const socket = WebSocketService.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      socket.emit('get-locks');
    };

    const handleLockAcquired = (data: { pedidoId: string; userId: string; username: string }) => {
      if (data.pedidoId === pedidoIdRef.current && data.userId === user.id.toString()) {
        setIsLocked(true);
        setIsLockedByMe(true);
        setLockedBy(data.username);
        isLockedByMeRef.current = true;
      }
    };

    const handleLockDenied = (data: { pedidoId: string; lockedBy: string }) => {
      if (data.pedidoId === pedidoIdRef.current) {
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.lockedBy);
        isLockedByMeRef.current = false;
        
        if (onLockDeniedRef.current) {
          onLockDeniedRef.current(data.lockedBy);
        }
      }
    };

    const handlePedidoLocked = (data: { pedidoId: string; userId: string; username: string }) => {
      if (data.pedidoId === pedidoIdRef.current && data.userId !== user.id.toString()) {
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.username);
        isLockedByMeRef.current = false;
      }
    };

    const handlePedidoUnlocked = (data: { pedidoId: string; reason: string }) => {
      if (data.pedidoId === pedidoIdRef.current) {
        setIsLocked(false);
        setIsLockedByMe(false);
        setLockedBy(null);
        isLockedByMeRef.current = false;
        
        if (isLockedByMe && data.reason === 'timeout' && onLockLostRef.current) {
          onLockLostRef.current();
        }
      }
    };

    const handleLocksUpdated = (data: { locks: PedidoLock[] }) => {
      setAllLocks(data.locks);
      
      const currentPedidoId = pedidoIdRef.current;
      if (currentPedidoId) {
        const lock = data.locks.find(l => l.pedidoId === currentPedidoId);
        if (lock) {
          const isLockedByCurrentUser = lock.userId === user.id.toString();
          setIsLocked(true);
          setIsLockedByMe(isLockedByCurrentUser);
          setLockedBy(lock.username);
          isLockedByMeRef.current = isLockedByCurrentUser;
        } else {
          setIsLocked(false);
          setIsLockedByMe(false);
          setLockedBy(null);
          isLockedByMeRef.current = false;
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('lock-acquired', handleLockAcquired);
    socket.on('lock-denied', handleLockDenied);
    socket.on('pedido-locked', handlePedidoLocked);
    socket.on('pedido-unlocked', handlePedidoUnlocked);
    socket.on('locks-updated', handleLocksUpdated);

    if (socket.connected) {
      socket.emit('get-locks');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('lock-acquired', handleLockAcquired);
      socket.off('lock-denied', handleLockDenied);
      socket.off('pedido-locked', handlePedidoLocked);
      socket.off('pedido-unlocked', handlePedidoUnlocked);
      socket.off('locks-updated', handleLocksUpdated);
    };
  }, [user]);

  const lockPedido = useCallback(() => {
    if (!user || !pedidoId) return;

    const socket = WebSocketService.getSocket();
    if (!socket) return;

    const username = user.displayName || user.username;
    currentPedidoIdRef.current = pedidoId;
    
    socket.emit('lock-pedido', {
      pedidoId,
      userId: user.id.toString(),
      username
    });

    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
    }

    activityIntervalRef.current = setInterval(() => {
      if (!isUnmountingRef.current && currentPedidoIdRef.current) {
        socket.emit('pedido-activity', {
          pedidoId: currentPedidoIdRef.current,
          userId: user.id.toString()
        });
        lastActivityRef.current = Date.now();
      }
    }, 60000);
  }, [user, pedidoId]);

  const unlockPedido = useCallback(() => {
    const pedidoToUnlock = pedidoId || currentPedidoIdRef.current;
    if (!user || !pedidoToUnlock) return;

    isLockedByMeRef.current = false;
    currentPedidoIdRef.current = null;

    const socket = WebSocketService.getSocket();
    if (!socket || !socket.connected) {
      setIsLocked(false);
      setIsLockedByMe(false);
      setLockedBy(null);
      return;
    }
    
    socket.emit('unlock-pedido', {
      pedidoId: pedidoToUnlock,
      userId: user.id.toString()
    });

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
    // Guardar el pedidoId actual cuando el efecto se ejecuta
    if (pedidoId) {
      currentPedidoIdRef.current = pedidoId;
    }

    return () => {
      console.log(`🧹 [CLEANUP] Limpiando efecto de bloqueo - pedidoId: ${currentPedidoIdRef.current}, isLockedByMe: ${isLockedByMeRef.current}, autoUnlock: ${autoUnlock}`);
      
      isUnmountingRef.current = true;
      
      // ✅ Usar las referencias en lugar del estado para asegurar el desbloqueo
      if (autoUnlock && isLockedByMeRef.current && currentPedidoIdRef.current && user) {
        console.log(`🔓 [CLEANUP] Desbloqueando pedido ${currentPedidoIdRef.current} en cleanup`);
        
  useEffect(() => {
    if (pedidoId) {
      currentPedidoIdRef.current = pedidoId;
    }

    return () => {
      isUnmountingRef.current = true;
      
      if (autoUnlock && isLockedByMeRef.current && currentPedidoIdRef.current && user) {
        const socket = WebSocketService.getSocket();
        if (socket && socket.connected) {
          socket.emit('unlock-pedido', {
            pedidoId: currentPedidoIdRef.current,
            userId: user.id.toString()
          });
        }
        isLockedByMeRef.current = false;
      }

      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
    };
  }, [autoUnlock, pedidoId, user]);

  useEffect(() => {
    const previousPedidoId = currentPedidoIdRef.current;
    
    if (previousPedidoId && pedidoId && previousPedidoId !== pedidoId && isLockedByMeRef.current) {
      const socket = WebSocketService.getSocket();
      if (socket && socket.connected) {
        socket.emit('unlock-pedido', {
          pedidoId: previousPedidoId,
          userId: user?.id.toString()
        });
      }
      isLockedByMeRef.current = false;
    }
    
    if (pedidoId) {
      currentPedidoIdRef.current = pedidoId;
    }
  }, [pedidoId, user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isLockedByMeRef.current) {
        lastActivityRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && isLockedByMeRef.current) {
        const socket = WebSocketService.getSocket();
        if (socket && currentPedidoIdRef.current && user) {
          socket.emit('pedido-activity', {
            pedidoId: currentPedidoIdRef.current,
            userId: user.id.toString()
          });
          lastActivityRef.current = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLockedByMeRef.current && currentPedidoIdRef.current && user) {
        const socket = WebSocketService.getSocket();
        if (socket) {
          socket.emit('unlock-pedido', {
            pedidoId: currentPedidoIdRef.current,
            userId: user.id.toString()
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);