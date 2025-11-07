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
  const currentPedidoIdRef = useRef<string | null>(null);
  const isLockedByMeRef = useRef<boolean>(false);
  
  // ✅ Refs para callbacks y pedidoId para evitar stale closures
  const pedidoIdRef = useRef(pedidoId);
  const onLockDeniedRef = useRef(onLockDenied);
  const onLockLostRef = useRef(onLockLost);
  
  // Actualizar refs cuando cambien los props
  useEffect(() => {
    pedidoIdRef.current = pedidoId;
    onLockDeniedRef.current = onLockDenied;
    onLockLostRef.current = onLockLost;
  }, [pedidoId, onLockDenied, onLockLost]);

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
      // Solicitar lista actual de bloqueos
      socket.emit('get-locks');
    });

    socket.on('lock-acquired', (data: { pedidoId: string; userId: string; username: string }) => {
      console.log('🔒 [EVENT] lock-acquired recibido:', data);
      if (data.pedidoId === pedidoIdRef.current && data.userId === user.id.toString()) {
        console.log(`✅ [LOCK] Bloqueo confirmado para pedido ${data.pedidoId}`);
        setIsLocked(true);
        setIsLockedByMe(true);
        setLockedBy(data.username);
        isLockedByMeRef.current = true;
      }
    });

    socket.on('lock-denied', (data: { pedidoId: string; lockedBy: string }) => {
      console.log('❌ [EVENT] lock-denied recibido:', data);
      if (data.pedidoId === pedidoIdRef.current) {
        console.log(`⚠️ [LOCK] Bloqueo denegado para pedido ${data.pedidoId} - bloqueado por ${data.lockedBy}`);
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.lockedBy);
        
        if (onLockDeniedRef.current) {
          onLockDeniedRef.current(data.lockedBy);
        }
      }
    });

    socket.on('pedido-locked', (data: { pedidoId: string; userId: string; username: string }) => {
      console.log('🔒 [EVENT] pedido-locked recibido:', data);
      if (data.pedidoId === pedidoIdRef.current && data.userId !== user.id.toString()) {
        console.log(`⚠️ [LOCK] Pedido ${data.pedidoId} bloqueado por otro usuario: ${data.username}`);
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.username);
      }
    });

    socket.on('pedido-unlocked', (data: { pedidoId: string; reason: string }) => {
      console.log('🔓 [EVENT] pedido-unlocked recibido:', data);
      if (data.pedidoId === pedidoIdRef.current) {
        console.log(`✅ [UNLOCK] Pedido ${data.pedidoId} desbloqueado - razón: ${data.reason}`);
        setIsLocked(false);
        setIsLockedByMe(false);
        setLockedBy(null);
        isLockedByMeRef.current = false;
        
        // Si era nuestro bloqueo y se perdió por timeout, notificar
        if (isLockedByMe && data.reason === 'timeout' && onLockLostRef.current) {
          onLockLostRef.current();
        }
      }
    });

    socket.on('locks-updated', (data: { locks: PedidoLock[] }) => {
      setAllLocks(data.locks);
      
      // Verificar si el pedido actual está en la lista
      const currentPedidoId = pedidoIdRef.current;
      if (currentPedidoId) {
        const lock = data.locks.find(l => l.pedidoId === currentPedidoId);
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
  }, [user]); // ✅ Solo depender de 'user', no de las demás variables que cambian frecuentemente

  // Intentar bloquear el pedido
  const lockPedido = useCallback(() => {
    if (!user || !pedidoId || !socketRef.current) {
      console.warn('⚠️ [LOCK] No se puede bloquear: falta usuario, pedidoId o socket');
      return;
    }

    const username = user.displayName || user.username;
    
    // Guardar en ref
    currentPedidoIdRef.current = pedidoId;
    
    console.log(`🔒 [LOCK] Solicitando bloqueo para pedido ${pedidoId} - usuario: ${username}`);
    
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
      if (socketRef.current && !isUnmountingRef.current && currentPedidoIdRef.current) {
        socketRef.current.emit('pedido-activity', {
          pedidoId: currentPedidoIdRef.current,
          userId: user.id.toString()
        });
        lastActivityRef.current = Date.now();
      }
    }, 60000); // Cada 60 segundos
  }, [user, pedidoId]);

  // Desbloquear el pedido
  const unlockPedido = useCallback(() => {
    const pedidoToUnlock = pedidoId || currentPedidoIdRef.current;
    
    if (!user || !pedidoToUnlock) {
      console.warn('⚠️ [UNLOCK] No se puede desbloquear: falta usuario o pedidoId');
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('⚠️ [UNLOCK] Socket no conectado, solo limpiando estados locales');
      // Limpiar estados locales de todos modos
      setIsLocked(false);
      setIsLockedByMe(false);
      setLockedBy(null);
      isLockedByMeRef.current = false;
      return;
    }

    console.log(`🔓 [UNLOCK] Desbloqueando pedido ${pedidoToUnlock} - userId: ${user.id}`);
    
    socketRef.current.emit('unlock-pedido', {
      pedidoId: pedidoToUnlock,
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
    isLockedByMeRef.current = false; // ✅ Actualizar ref
    currentPedidoIdRef.current = null; // ✅ Limpiar el pedido actual
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
        
        // Verificar que el socket esté conectado
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('unlock-pedido', {
            pedidoId: currentPedidoIdRef.current,
            userId: user.id.toString()
          });
          console.log(`✅ [CLEANUP] Señal de desbloqueo enviada para ${currentPedidoIdRef.current}`);
        } else {
          console.warn(`⚠️ [CLEANUP] Socket no conectado, no se pudo enviar señal de desbloqueo`);
        }
        
        isLockedByMeRef.current = false;
      }

      // Limpiar intervalo de actividad
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
    };
  }, [autoUnlock, pedidoId, user]); // ✅ Dependencias correctas

  // ✅ Desbloquear pedido anterior cuando cambia el pedidoId
  useEffect(() => {
    const previousPedidoId = currentPedidoIdRef.current;
    
    // Si hay un pedido anterior diferente al actual y estaba bloqueado, desbloquearlo
    if (previousPedidoId && pedidoId && previousPedidoId !== pedidoId && isLockedByMeRef.current) {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('unlock-pedido', {
          pedidoId: previousPedidoId,
          userId: user?.id.toString()
        });
      }
      
      isLockedByMeRef.current = false;
    }
    
    // Actualizar referencia con el nuevo pedidoId
    if (pedidoId) {
      currentPedidoIdRef.current = pedidoId;
    }
  }, [pedidoId, user]);

  // Detectar cuando el usuario cambia de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      // ✅ Usar referencias en lugar del estado
      if (document.visibilityState === 'hidden' && isLockedByMeRef.current) {
        // Actualizar última actividad pero no desbloquear
        lastActivityRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && isLockedByMeRef.current) {
        // Al volver, enviar señal de actividad inmediatamente
        if (socketRef.current && currentPedidoIdRef.current && user) {
          socketRef.current.emit('pedido-activity', {
            pedidoId: currentPedidoIdRef.current,
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
  }, [user]); // ✅ Solo depende de user ya que usa referencias

  // Detectar cierre de navegador / pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      // ✅ Usar referencias en lugar del estado
      if (isLockedByMeRef.current && socketRef.current && currentPedidoIdRef.current && user) {
        console.log(`🔓 [BEFOREUNLOAD] Desbloqueando pedido ${currentPedidoIdRef.current} antes de cerrar`);
        // Intentar desbloquear antes de cerrar
        socketRef.current.emit('unlock-pedido', {
          pedidoId: currentPedidoIdRef.current,
          userId: user.id.toString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]); // ✅ Solo depende de user ya que usa referencias

  return {
    isLocked,
    isLockedByMe,
    lockedBy,
    allLocks,
    lockPedido,
    unlockPedido
  };
};
