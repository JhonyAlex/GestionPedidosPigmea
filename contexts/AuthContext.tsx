import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, LoginRequest, RegisterRequest, AuthResponse, Permission } from '../types';
import { getPermissionsByRole } from '../constants/permissions';
import permissionService from '../services/permissions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSyncingPermissions, setIsSyncingPermissions] = useState(false);

    // Función para enriquecer usuario con permisos
    const enrichUserWithPermissions = (userData: User): User => {
        // Si el usuario ya tiene permisos personalizados, los usamos
        if (userData.permissions && userData.permissions.length > 0) {
            return userData;
        }
        
        // Si no tiene permisos personalizados, asignar permisos por defecto del rol
        const rolePermissions = getPermissionsByRole(userData.role);
        
        return {
            ...userData,
            permissions: rolePermissions
        };
    };

    // Sincronizar permisos con el servidor
    const syncPermissionsWithServer = async (userData: User): Promise<User> => {
        if (!userData || !userData.id) {
            return userData;
        }
        
        try {
            setIsSyncingPermissions(true);
            
            // Obtener permisos locales
            const localPermissions = userData.permissions || [];
            
            // Sincronizar con el servidor
            const { permissions, synced } = await permissionService.syncPermissions(
                userData.id, 
                localPermissions
            );
            
            if (!synced) {
                console.log('Permisos sincronizados desde el servidor');
                
                // Actualizar usuario con permisos del servidor
                const updatedUser = {
                    ...userData,
                    permissions
                };
                
                // Actualizar usuario en localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(updatedUser));
                }
                
                return updatedUser;
            }
            
            return userData;
        } catch (error) {
            console.error('Error sincronizando permisos:', error);
            return userData;
        } finally {
            setIsSyncingPermissions(false);
        }
    };

    // Cargar usuario del localStorage al iniciar
    useEffect(() => {
        const verifyUser = async () => {
            try {
                if (typeof window !== 'undefined') {
                    const savedUser = localStorage.getItem('pigmea_user');
                    if (savedUser) {
                        const userData = JSON.parse(savedUser);
                        // Enriquecer con permisos si no los tiene
                        const enrichedUser = enrichUserWithPermissions(userData);
                        
                        // Primero establecer el usuario con lo que tenemos en localStorage
                        setUser(enrichedUser);
                        
                        // Luego sincronizar con el servidor
                        const syncedUser = await syncPermissionsWithServer(enrichedUser);
                        if (syncedUser !== enrichedUser) {
                            setUser(syncedUser);
                        }
                    }
                }
            } catch (error) {
                console.error('Error parsing saved user:', error);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('pigmea_user');
                }
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, []);

    const login = async (username: string, password: string): Promise<AuthResponse> => {
        try {
            setLoading(true);
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.error || 'Error en el login' };
            }

            if (data.success && data.user) {
                // Primero enriquecemos con permisos locales si no los tiene
                const enrichedUser = enrichUserWithPermissions(data.user);
                
                // Establecemos el usuario para la UI
                setUser(enrichedUser);
                
                // Guardamos en localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(enrichedUser));
                }
                
                // Sincronizamos con el servidor
                const syncedUser = await syncPermissionsWithServer(enrichedUser);
                if (syncedUser !== enrichedUser) {
                    setUser(syncedUser);
                }
                
                return { success: true, user: syncedUser, message: data.message };
            } else {
                return { success: false, message: data.error || 'Error desconocido en el login' };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión' };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
        try {
            setLoading(true);
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.error || 'Error en el registro' };
            }

            if (data.success && data.user) {
                const enrichedUser = enrichUserWithPermissions(data.user);
                setUser(enrichedUser);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(enrichedUser));
                }
                return { success: true, user: enrichedUser, message: data.message };
            } else {
                return { success: false, message: data.error || 'Error desconocido en el registro' };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, message: 'Error de conexión' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('pigmea_user');
        }
    };

    // Método para actualizar permisos de usuario
    const updateUserPermissions = async (permissions: Permission[]): Promise<boolean> => {
        if (!user || !user.id) {
            console.error('No hay usuario activo para actualizar permisos');
            return false;
        }
        
        try {
            setLoading(true);
            
            // Guardar en el servidor
            const success = await permissionService.savePermissions(user.id, permissions);
            
            if (success) {
                // Actualizar usuario local
                const updatedUser = {
                    ...user,
                    permissions
                };
                
                setUser(updatedUser);
                
                // Actualizar localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(updatedUser));
                }
            }
            
            return success;
        } catch (error) {
            console.error('Error actualizando permisos:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
        register,
        updateUserPermissions,
        isSyncingPermissions
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
