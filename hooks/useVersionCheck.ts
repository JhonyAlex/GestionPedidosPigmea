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
        const clientBuildTime = __BUILD_TIME__;

        // Escuchar evento de actualización desde el servidor
        const handleAppUpdated = (data: VersionInfo) => {
            console.log('🔄 Nueva versión detectada:', data);
            
            // Comparar versión o timestamp de build
            if (data.version !== clientVersion || data.buildTime !== clientBuildTime) {
                setNewVersion(data.version);
                setUpdateAvailable(true);
            }
        };

        // Escuchar respuesta del servidor con su versión actual
        const handleServerVersion = (data: VersionInfo) => {
            console.log('📡 Versión del servidor:', data);
            console.log('💻 Versión del cliente:', clientVersion);
            
            if (data.version !== clientVersion || data.buildTime !== clientBuildTime) {
                setNewVersion(data.version);
                setUpdateAvailable(true);
            }
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
        localStorage.setItem('force-refresh-reason', 'App update');
        
        // Hard reload que borra caché
        window.location.reload();
    };

    return {
        updateAvailable,
        newVersion,
        forceRefresh
    };
};
