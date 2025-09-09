import { Permission } from '../types';

/**
 * Servicio para sincronización de permisos entre frontend y backend
 */
class PermissionSyncService {
    /**
     * Obtiene los permisos de un usuario desde el servidor
     * @param userId ID del usuario
     * @returns Array de permisos
     */
    async getUserPermissions(userId: string): Promise<Permission[]> {
        try {
            const response = await fetch(`/api/auth/users/${userId}/permissions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener permisos');
            }

            const data = await response.json();
            return data.success ? data.permissions : [];
        } catch (error) {
            console.error('Error en getUserPermissions:', error);
            return [];
        }
    }

    /**
     * Guarda los permisos de un usuario en el servidor
     * @param userId ID del usuario
     * @param permissions Array de permisos a guardar
     */
    async savePermissions(userId: string, permissions: Permission[]): Promise<boolean> {
        try {
            const response = await fetch(`/api/auth/users/${userId}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ permissions }),
            });

            if (!response.ok) {
                throw new Error('Error al guardar permisos');
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error en savePermissions:', error);
            return false;
        }
    }

    /**
     * Sincroniza los permisos locales con el servidor
     * @param userId ID del usuario
     * @param localPermissions Permisos almacenados localmente
     * @returns Permisos sincronizados desde el servidor (si hay diferencias)
     */
    async syncPermissions(userId: string, localPermissions: Permission[]): Promise<{
        permissions: Permission[];
        synced: boolean;
    }> {
        try {
            const response = await fetch(`/api/auth/users/${userId}/permissions/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ localPermissions }),
            });

            if (!response.ok) {
                throw new Error('Error al sincronizar permisos');
            }

            const data = await response.json();
            return {
                permissions: data.permissions || [],
                synced: data.synced || false,
            };
        } catch (error) {
            console.error('Error en syncPermissions:', error);
            return {
                permissions: localPermissions,
                synced: false,
            };
        }
    }

    /**
     * Obtiene la configuración del sistema de permisos
     * @returns Configuración de permisos del sistema
     */
    async getSystemPermissionConfig(): Promise<any> {
        try {
            const response = await fetch('/api/auth/permissions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener configuración de permisos');
            }

            const data = await response.json();
            return data.success ? data.permissions : null;
        } catch (error) {
            console.error('Error en getSystemPermissionConfig:', error);
            return null;
        }
    }

    /**
     * Obtiene todos los permisos disponibles en el sistema
     * @returns Lista completa de permisos
     */
    async getAllPermissions(): Promise<Permission[]> {
        try {
            const response = await fetch('/api/permissions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener lista de permisos');
            }

            const data = await response.json();
            return data.success ? data.permissions : [];
        } catch (error) {
            console.error('Error en getAllPermissions:', error);
            return [];
        }
    }
}

// Exportar una instancia única del servicio
export const permissionService = new PermissionSyncService();
export default permissionService;
