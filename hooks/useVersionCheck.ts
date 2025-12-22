import { useState, useEffect } from 'react';
import { webSocketService } from '../services/websocket';

interface VersionInfo {
    version: string;
    buildTime: string;
}

export const useVersionCheck = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [newVersion, setNewVersion] = useState<string | null>(null);

    useEffect(() => {
        const socket = webSocketService.getSocket();
        const clientVersion = __APP_VERSION__;
        // Nota: __BUILD_TIME__ es del frontend. El servidor puede reportar su propio buildTime,
        // que no es comparable y puede causar loops de refresco.

        // Escuchar evento de actualización desde el servidor
        const handleAppUpdated = (data: VersionInfo) => {
            console.log('🔄 Nueva versión detectada:', data);
            
            // Para evitar loops, usamos el evento explícito del servidor como fuente de verdad.
            // Si el backend dispara 'app-updated', mostramos banner y refrescamos.
            setNewVersion(data.version);
            setUpdateAvailable(true);
        };

        // Escuchar respuesta del servidor con su versión actual
        const handleServerVersion = (data: VersionInfo) => {
            console.log('📡 Versión del servidor:', data);
            console.log('💻 Versión del cliente:', clientVersion);

            // IMPORTANTE: 'server-version' representa versión/buildTime del servidor.
            // No lo usamos para invalidar el frontend, porque puede cambiar en cada conexión
            // y generar un loop de auto-refresh.
        };

        // Usar any para evitar errores de tipo con eventos no tipados estrictamente
        (socket as any).on('app-updated', handleAppUpdated);
        (socket as any).on('server-version', handleServerVersion);

        // Solicitar versión del servidor al conectar
        (socket as any).emit('request-version');

        return () => {
            (socket as any).off('app-updated', handleAppUpdated);
            (socket as any).off('server-version', handleServerVersion);
        };
    }, []);

    const forceRefresh = () => {
        console.log('🔄 Forzando actualización del navegador...');
        try {
            localStorage.setItem('force-refresh-reason', 'App update');
        } catch {
            // Ignorar: algunos navegadores/bloqueadores impiden acceso a storage
        }
        
        // Hard reload que borra caché
        window.location.reload();
    };

    return {
        updateAvailable,
        newVersion,
        forceRefresh
    };
};
