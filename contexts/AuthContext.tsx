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
    const [authError, setAuthError] = useState<string>(''); // ✅ NUEVO: Estado de error persistente
    const [isSyncingPermissions, setIsSyncingPermissions] = useState(false);

    // ✅ NUEVO: Función para limpiar el error
    const clearAuthError = () => {
        console.log('🧹 Limpiando error de autenticación');
        setAuthError('');
    };

    // Función para enriquecer usuario con permisos
    const enrichUserWithPermissions = (userData: User): User => {
        // Si es administrador, siempre dar todos los permisos
        if (userData.role === 'Administrador') {
            const allPermissions = getPermissionsByRole('Administrador');
            return {
                ...userData,
                permissions: allPermissions
            };
        }
        
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
            
            // Si es administrador, siempre mantener todos los permisos
            if (userData.role === 'Administrador') {
                const allPermissions = getPermissionsByRole('Administrador');
                const updatedUser = {
                    ...userData,
                    permissions: allPermissions
                };
                
                // Actualizar usuario en localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(updatedUser));
                }
                
                return updatedUser;
            }
            
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

        // Detectar cuando la pestaña vuelve a estar visible para verificar sesión
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('👁️ Pestaña reactivada - verificando sesión...');
                
                // Verificar que la sesión sigue siendo válida
                const savedUser = localStorage.getItem('pigmea_user');
                if (!savedUser && window.location.pathname !== '/login') {
                    console.warn('⚠️ Sesión perdida. Redirigiendo a login...');
                    // El hook useInactivityReload recargará la página automáticamente
                    // si hay inactividad prolongada
                } else if (savedUser) {
                    try {
                        const userData = JSON.parse(savedUser);
                        console.log('✅ Sesión verificada:', userData.username);
                    } catch (error) {
                        console.error('❌ Error al verificar sesión:', error);
                        localStorage.removeItem('pigmea_user');
                        window.location.href = '/login';
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const login = async (username: string, password: string): Promise<AuthResponse> => {
        try {
            setLoading(true);
            clearAuthError(); // ✅ Limpiar error anterior
            console.log('🔐 Iniciando login para:', username);
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            console.log('📡 Respuesta del servidor - Status:', response.status, response.statusText);

            // Si no hay respuesta del servidor (error de red/conexión)
            if (!response) {
                console.error('❌ No hay respuesta del servidor');
                const errorMsg = '❌ Error de conexión: No se pudo contactar al servidor';
                setAuthError(errorMsg); // ✅ Guardar en contexto
                return { 
                    success: false, 
                    message: errorMsg
                };
            }

            // Intentar parsear la respuesta
            let data;
            try {
                data = await response.json();
                console.log('📦 Datos parseados:', data);
            } catch (parseError) {
                console.error('❌ Error parseando respuesta:', parseError);
                const errorMsg = '⚠️ Error del servidor: Respuesta inválida';
                setAuthError(errorMsg); // ✅ Guardar en contexto
                return { 
                    success: false, 
                    message: errorMsg
                };
            }

            if (!response.ok) {
                // Distinguir entre tipos de errores del servidor
                const errorCode = data.errorCode;
                console.log('⚠️ Error del servidor - Código:', errorCode, '| Error:', data.error);
                
                let errorMsg: string;
                
                switch (errorCode) {
                    case 'USER_NOT_FOUND':
                        console.log('👤 Usuario no encontrado');
                        errorMsg = '👤 Usuario no encontrado: Verifique su nombre de usuario';
                        break;
                    
                    case 'INVALID_PASSWORD':
                        console.log('🔒 Contraseña incorrecta');
                        errorMsg = '🔒 Contraseña incorrecta: Intente nuevamente';
                        break;
                    
                    case 'MISSING_CREDENTIALS':
                        console.log('⚠️ Credenciales faltantes');
                        errorMsg = '⚠️ Usuario y contraseña requeridos';
                        break;
                    
                    case 'DATABASE_UNAVAILABLE':
                        console.log('🔧 Base de datos no disponible');
                        errorMsg = '🔧 Base de datos no disponible: Contacte al administrador';
                        break;
                    
                    case 'INTERNAL_SERVER_ERROR':
                        console.log('💥 Error interno del servidor');
                        errorMsg = `💥 Error del servidor: ${data.details || 'Error interno'}`;
                        break;
                    
                    default:
                        console.log('❌ Error desconocido:', data.error);
                        errorMsg = data.error || '❌ Error desconocido en el login';
                        break;
                }
                
                setAuthError(errorMsg); // ✅ Guardar en contexto
                return { 
                    success: false, 
                    message: errorMsg
                };
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
                
                console.log('✅ Login exitoso');
                clearAuthError(); // ✅ Limpiar error si login exitoso
                return { success: true, user: syncedUser, message: '✅ Login exitoso' };
            } else {
                console.log('❌ Respuesta sin usuario válido');
                const errorMsg = data.error || '❌ Error desconocido en el login';
                setAuthError(errorMsg); // ✅ Guardar en contexto
                return { success: false, message: errorMsg };
            }
        } catch (error) {
            console.error('💥 Exception en login:', error);
            
            let errorMsg: string;
            
            // Distinguir entre error de red y error de código
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.log('🌐 Error de conexión detectado');
                errorMsg = '🌐 Error de conexión: Verifique su conexión a internet';
            } else {
                console.log('💻 Error de código detectado:', error.message);
                errorMsg = `💻 Error de código: ${error.message}`;
            }
            
            setAuthError(errorMsg); // ✅ Guardar en contexto
            return { 
                success: false, 
                message: errorMsg
            };
        } finally {
            console.log('🔓 Desbloqueando loading');
            setLoading(false);
        }
    };

    const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
        try {
            setLoading(true);
            console.log('📝 Iniciando registro para:', userData.username);
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            console.log('📡 Respuesta del servidor - Status:', response.status, response.statusText);

            // Intentar parsear la respuesta
            let data;
            try {
                data = await response.json();
                console.log('📦 Datos parseados:', data);
            } catch (parseError) {
                console.error('❌ Error parseando respuesta:', parseError);
                return { 
                    success: false, 
                    message: '⚠️ Error del servidor: Respuesta inválida' 
                };
            }

            if (!response.ok) {
                console.log('⚠️ Error en registro:', data.error);
                return { success: false, message: data.error || '❌ Error en el registro' };
            }

            if (data.success && data.user) {
                console.log('✅ Registro exitoso');
                const enrichedUser = enrichUserWithPermissions(data.user);
                setUser(enrichedUser);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(enrichedUser));
                }
                return { success: true, user: enrichedUser, message: data.message || '✅ Registro exitoso' };
            } else {
                console.log('❌ Registro sin usuario válido');
                return { success: false, message: data.error || '❌ Error desconocido en el registro' };
            }
        } catch (error) {
            console.error('💥 Exception en registro:', error);
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.log('🌐 Error de conexión detectado');
                return { 
                    success: false, 
                    message: '🌐 Error de conexión: Verifique su conexión a internet' 
                };
            }
            
            console.log('💻 Error de código detectado:', error.message);
            return { 
                success: false, 
                message: `💻 Error de código: ${error.message}` 
            };
        } finally {
            console.log('🔓 Desbloqueando loading (registro)');
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
        authError, // ✅ NUEVO: Exponer error
        login,
        logout,
        register,
        clearAuthError, // ✅ NUEVO: Exponer función para limpiar error
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
