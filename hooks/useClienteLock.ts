import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WebSocketService from '../services/websocket';

interface ClienteLock {
  clienteId: string;
  userId: string;
  username: string;
  lockedAt: number;
}

interface UseClienteLockOptions {
  clienteId: string | null;
  onLockDenied?: (lockedBy: string) => void;
  onLockLost?: () => void;
  autoUnlock?: boolean;
}

/**
 * Hook para gestionar el bloqueo de clientes en tiempo real.
 * Maneja el ciclo completo de bloqueo/desbloqueo y detecta inactividad.
 */
export const useClienteLock = ({
  clienteId,
  onLockDenied,
  onLockLost,
  autoUnlock = true
}: UseClienteLockOptions) => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [allLocks, setAllLocks] = useState<ClienteLock[]>([]);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isUnmountingRef = useRef(false);
  const currentClienteIdRef = useRef<string | null>(null);
  const isLockedByMeRef = useRef<boolean>(false);
  
  const clienteIdRef = useRef(clienteId);
  const onLockDeniedRef = useRef(onLockDenied);
  const onLockLostRef = useRef(onLockLost);
  
  useEffect(() => {
    clienteIdRef.current = clienteId;
    onLockDeniedRef.current = onLockDenied;
    onLockLostRef.current = onLockLost;
  }, [clienteId, onLockDenied, onLockLost]);

  // Suscribirse a eventos WebSocket
  useEffect(() => {
    if (!user) return;

    const socket = WebSocketService.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      socket.emit('get-cliente-locks');
    };

    const handleLockAcquired = (data: { clienteId: string; userId: string; username: string }) => {
      if (data.clienteId === clienteIdRef.current && data.userId === user.id.toString()) {
        setIsLocked(true);
        setIsLockedByMe(true);
        setLockedBy(data.username);
        isLockedByMeRef.current = true;
      }
    };

    const handleLockDenied = (data: { clienteId: string; currentLock: { userId: string; username: string; lockedAt: string } }) => {
      if (data.clienteId === clienteIdRef.current) {
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

    const handleClienteLocked = (data: { clienteId: string; userId: string; username: string }) => {
      if (data.clienteId === clienteIdRef.current && data.userId !== user.id.toString()) {
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy(data.username);
        isLockedByMeRef.current = false;
      }
    };

    const handleClienteUnlocked = (data: { clienteId: string; reason: string }) => {
      if (data.clienteId === clienteIdRef.current) {
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

    const handleLocksUpdated = (data: { locks: ClienteLock[] }) => {
      setAllLocks(data.locks);
      
      const currentClienteId = clienteIdRef.current;
      if (currentClienteId) {
        const lock = data.locks.find(l => l.clienteId === currentClienteId);
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
    socket.on('cliente-lock-acquired', handleLockAcquired);
    socket.on('cliente-lock-denied', handleLockDenied);
    socket.on('cliente-locked', handleClienteLocked);
    socket.on('cliente-unlocked', handleClienteUnlocked);
    socket.on('cliente-locks-updated', handleLocksUpdated);

    if (socket.connected) {
      socket.emit('get-cliente-locks');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('cliente-lock-acquired', handleLockAcquired);
      socket.off('cliente-lock-denied', handleLockDenied);
      socket.off('cliente-locked', handleClienteLocked);
      socket.off('cliente-unlocked', handleClienteUnlocked);
      socket.off('cliente-locks-updated', handleLocksUpdated);
    };
  }, [user]);

  const lockCliente = useCallback(() => {
    if (!user || !clienteId) return;

    const socket = WebSocketService.getSocket();
    if (!socket) return;

    const username = user.displayName || user.username;
    currentClienteIdRef.current = clienteId;
    
    socket.emit('lock-cliente', {
      clienteId,
      userId: user.id.toString(),
      username
    });

    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
    }

    activityIntervalRef.current = setInterval(() => {
      if (!isUnmountingRef.current && currentClienteIdRef.current && isLockedByMeRef.current) {
        socket.emit('cliente-activity', {
          clienteId: currentClienteIdRef.current,
          userId: user.id.toString()
        });
        lastActivityRef.current = Date.now();
      }
    }, 60000);
  }, [user, clienteId]);

  const unlockCliente = useCallback(() => {
    const clienteToUnlock = clienteId || currentClienteIdRef.current;
    if (!user || !clienteToUnlock) return;

    isLockedByMeRef.current = false;
    currentClienteIdRef.current = null;

    const socket = WebSocketService.getSocket();
    if (!socket || !socket.connected) {
      setIsLocked(false);
      setIsLockedByMe(false);
      setLockedBy(null);
      return;
    }
    
    socket.emit('unlock-cliente', {
      clienteId: clienteToUnlock,
      userId: user.id.toString()
    });

    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }

    setIsLocked(false);
    setIsLockedByMe(false);
    setLockedBy(null);
  }, [user, clienteId]);

  // Auto-unlock on unmount
  useEffect(() => {
    if (clienteId) {
      currentClienteIdRef.current = clienteId;
    }

    return () => {
      isUnmountingRef.current = true;
      
      if (autoUnlock && isLockedByMeRef.current && currentClienteIdRef.current && user) {
        const socket = WebSocketService.getSocket();
        if (socket && socket.connected) {
          socket.emit('unlock-cliente', {
            clienteId: currentClienteIdRef.current,
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
  }, [autoUnlock, clienteId, user]);

  // Handle cliente ID changes
  useEffect(() => {
    const previousClienteId = currentClienteIdRef.current;
    
    if (previousClienteId && clienteId && previousClienteId !== clienteId && isLockedByMeRef.current) {
      const socket = WebSocketService.getSocket();
      if (socket && socket.connected) {
        socket.emit('unlock-cliente', {
          clienteId: previousClienteId,
          userId: user?.id.toString()
        });
      }
      isLockedByMeRef.current = false;
    }
    
    if (clienteId) {
      currentClienteIdRef.current = clienteId;
    }
  }, [clienteId, user]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isLockedByMeRef.current) {
        lastActivityRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && isLockedByMeRef.current) {
        const socket = WebSocketService.getSocket();
        if (socket && currentClienteIdRef.current && user) {
          socket.emit('cliente-activity', {
            clienteId: currentClienteIdRef.current,
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
      if (isLockedByMeRef.current && currentClienteIdRef.current && user) {
        const socket = WebSocketService.getSocket();
        if (socket) {
          socket.emit('unlock-cliente', {
            clienteId: currentClienteIdRef.current,
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
    lockCliente,
    unlockCliente
  };
};
