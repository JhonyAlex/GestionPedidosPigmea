import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, LoginRequest, RegisterRequest, AuthResponse } from '../types';
import { getPermissionsByRole } from '../constants/permissions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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
                        setUser(enrichedUser);
                        
                        // Actualizar localStorage con usuario enriquecido
                        localStorage.setItem('pigmea_user', JSON.stringify(enrichedUser));
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
                const enrichedUser = enrichUserWithPermissions(data.user);
                setUser(enrichedUser);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(enrichedUser));
                }
                return { success: true, user: enrichedUser, message: data.message };
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

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
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
