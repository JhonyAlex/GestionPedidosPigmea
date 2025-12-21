import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WebSocketService from '../services/websocket';

interface VendedorLock {
  vendedorId: string;
  userId: string;
  username: string;
  lockedAt: number;
}

interface UseVendedorLockOptions {
  vendedorId: string | null;
  onLockDenied?: (lockedBy: string) => void;
  onLockLost?: () => void;
  autoUnlock?: boolean;
}

/**
 * Hook para gestionar el bloqueo de vendedores en tiempo real.
 * Maneja el ciclo completo de bloqueo/desbloqueo y detecta inactividad.
 */
export const useVendedorLock = ({
  vendedorId,
  onLockDenied,
  onLockLost,
  autoUnlock = true
}: UseVendedorLockOptions) => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [allLocks, setAllLocks] = useState<VendedorLock[]>([]);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isUnmountingRef = useRef(false);
  const currentVendedorIdRef = useRef<string | null>(null);
  const isLockedByMeRef = useRef<boolean>(false);
  
  const vendedorIdRef = useRef(vendedorId);
  const onLockDeniedRef = useRef(onLockDenied);
  const onLockLostRef = useRef(onLockLost);
  
  useEffect(() => {
    vendedorIdRef.current = vendedorId;
    onLockDeniedRef.current = onLockDenied;
    onLockLostRef.current = onLockLost;
  }, [vendedorId, onLockDenied, onLockLost]);

  // Suscribirse a eventos WebSocket
  useEffect(() => {
    if (!user) return;

    const socket = WebSocketService.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      socket.emit('get-vendedor-locks');
    };

    const handleLockAcquired = (data: { vendedorId: string; userId: string; username: string }) => {
      if (data.vendedorId === vendedorIdRef.current && data.userId === user.id.toString()) {
        setIsLocked(true);
        setIsLockedByMe(true);
        setLockedBy(data.username);
        isLockedByMeRef.current = true;
      }
    };

    const handleLockDenied = (data: { vendedorId: string; currentLock: { userId: string; username: string; lockedAt: string } }) => {
      if (data.vendedorId === vendedorIdRef.current) {
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.currentLock.username);
        isLockedByMeRef.current = false;

        if (activityIntervalRef.current) {
          clearInterval(activityIntervalRef.current);
          activityIntervalRef.current = null;
        }
        
        if (onLockDeniedRef.current) {
          onLockDeniedRef.current(data.currentLock.username);
        }
      }
    };

    const handleVendedorLocked = (data: { vendedorId: string; userId: string; username: string }) => {
      if (data.vendedorId === vendedorIdRef.current && data.userId !== user.id.toString()) {
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.username);
        isLockedByMeRef.current = false;
      }
    };

    const handleVendedorUnlocked = (data: { vendedorId: string; reason: string }) => {
      if (data.vendedorId === vendedorIdRef.current) {
        const wasLockedByMe = isLockedByMeRef.current;

        setIsLocked(false);
        setIsLockedByMe(false);
        setLockedBy(null);
        isLockedByMeRef.current = false;

        if (activityIntervalRef.current) {
          clearInterval(activityIntervalRef.current);
          activityIntervalRef.current = null;
        }
        
        if (wasLockedByMe && data.reason === 'timeout' && onLockLostRef.current) {
          onLockLostRef.current();
        }
      }
    };

    const handleLocksUpdated = (data: { locks: VendedorLock[] }) => {
      setAllLocks(data.locks);
      
      const currentVendedorId = vendedorIdRef.current;
      if (currentVendedorId) {
        const lock = data.locks.find(l => l.vendedorId === currentVendedorId);
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
    socket.on('vendedor-lock-acquired', handleLockAcquired);
    socket.on('vendedor-lock-denied', handleLockDenied);
    socket.on('vendedor-locked', handleVendedorLocked);
    socket.on('vendedor-unlocked', handleVendedorUnlocked);
    socket.on('vendedor-locks-updated', handleLocksUpdated);

    if (socket.connected) {
      socket.emit('get-vendedor-locks');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('vendedor-lock-acquired', handleLockAcquired);
      socket.off('vendedor-lock-denied', handleLockDenied);
      socket.off('vendedor-locked', handleVendedorLocked);
      socket.off('vendedor-unlocked', handleVendedorUnlocked);
      socket.off('vendedor-locks-updated', handleLocksUpdated);
    };
  }, [user]);

  const lockVendedor = useCallback(() => {
    if (!user || !vendedorId) return;

    const socket = WebSocketService.getSocket();
    if (!socket) return;

    const username = user.displayName || user.username;
    currentVendedorIdRef.current = vendedorId;
    
    socket.emit('lock-vendedor', {
      vendedorId,
      userId: user.id.toString(),
      username
    });

    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
    }

    activityIntervalRef.current = setInterval(() => {
      if (!isUnmountingRef.current && currentVendedorIdRef.current && isLockedByMeRef.current) {
        socket.emit('vendedor-activity', {
          vendedorId: currentVendedorIdRef.current,
          userId: user.id.toString()
        });
        lastActivityRef.current = Date.now();
      }
    }, 60000);
  }, [user, vendedorId]);

  const unlockVendedor = useCallback(() => {
    const vendedorToUnlock = vendedorId || currentVendedorIdRef.current;
    if (!user || !vendedorToUnlock) return;

    isLockedByMeRef.current = false;
    currentVendedorIdRef.current = null;

    const socket = WebSocketService.getSocket();
    if (!socket || !socket.connected) {
      setIsLocked(false);
      setIsLockedByMe(false);
      setLockedBy(null);
      return;
    }
    
    socket.emit('unlock-vendedor', {
      vendedorId: vendedorToUnlock,
      userId: user.id.toString()
    });

    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }

    setIsLocked(false);
    setIsLockedByMe(false);
    setLockedBy(null);
  }, [user, vendedorId]);

  // Auto-unlock on unmount
  useEffect(() => {
    if (vendedorId) {
      currentVendedorIdRef.current = vendedorId;
    }

    return () => {
      isUnmountingRef.current = true;
      
      if (autoUnlock && isLockedByMeRef.current && currentVendedorIdRef.current && user) {
        const socket = WebSocketService.getSocket();
        if (socket && socket.connected) {
          socket.emit('unlock-vendedor', {
            vendedorId: currentVendedorIdRef.current,
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
  }, [autoUnlock, vendedorId, user]);

  // Handle vendedor ID changes
  useEffect(() => {
    const previousVendedorId = currentVendedorIdRef.current;
    
    if (previousVendedorId && vendedorId && previousVendedorId !== vendedorId && isLockedByMeRef.current) {
      const socket = WebSocketService.getSocket();
      if (socket && socket.connected) {
        socket.emit('unlock-vendedor', {
          vendedorId: previousVendedorId,
          userId: user?.id.toString()
        });
      }
      isLockedByMeRef.current = false;
    }
    
    if (vendedorId) {
      currentVendedorIdRef.current = vendedorId;
    }
  }, [vendedorId, user]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isLockedByMeRef.current) {
        lastActivityRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && isLockedByMeRef.current) {
        const socket = WebSocketService.getSocket();
        if (socket && currentVendedorIdRef.current && user) {
          socket.emit('vendedor-activity', {
            vendedorId: currentVendedorIdRef.current,
            userId: user.id.toString()
          });
          lastActivityRef.current = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLockedByMeRef.current && currentVendedorIdRef.current && user) {
        const socket = WebSocketService.getSocket();
        if (socket) {
          socket.emit('unlock-vendedor', {
            vendedorId: currentVendedorIdRef.current,
            userId: user.id.toString()
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  return {
    isLocked,
    isLockedByMe,
    lockedBy,
    allLocks,
    lockVendedor,
    unlockVendedor
  };
};
