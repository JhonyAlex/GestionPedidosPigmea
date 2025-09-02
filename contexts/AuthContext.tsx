import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, LoginRequest, RegisterRequest, AuthResponse } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario del localStorage al iniciar
    useEffect(() => {
        const verifyUser = async () => {
            try {
                if (typeof window !== 'undefined') {
                    const savedUser = localStorage.getItem('pigmea_user');
                    if (savedUser) {
                        const userData = JSON.parse(savedUser);
                        // Aquí podrías añadir una llamada a un endpoint de verificación
                        // Por ahora, simplemente cargamos el usuario.
                        // Si el token expira, las llamadas a la API fallarán y se podría manejar el logout en ese punto.
                        setUser(userData);
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

            if (data.success && data.user) {
                setUser(data.user);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(data.user));
                }
                return { success: true, user: data.user, message: data.message };
            } else {
                return { success: false, message: data.error || 'Error en el login' };
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

            if (data.success && data.user) {
                setUser(data.user);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pigmea_user', JSON.stringify(data.user));
                }
                return { success: true, user: data.user, message: data.message };
            } else {
                return { success: false, message: data.error || 'Error en el registro' };
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
