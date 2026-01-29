import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const LoginModal: React.FC = () => {
    const { login, register, loading, authError, clearAuthError } = useAuth(); // ✅ Usar authError del contexto
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        displayName: '',
        role: 'Visualizador' as UserRole
    });
    const [success, setSuccess] = useState('');

    // Debug: Monitorear cambios de authError
    useEffect(() => {
        if (authError) {
            console.log('🔴 AuthError del contexto actualizado:', authError);
        }
    }, [authError]);

    useEffect(() => {
        if (success) {
            console.log('🟢 Estado de success actualizado:', success);
        }
    }, [success]);

    useEffect(() => {
        console.log('⏳ Estado de loading:', loading);
    }, [loading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        clearAuthError(); // ✅ Limpiar error del contexto
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAuthError(); // ✅ Limpiar error del contexto
        setSuccess('');

        if (!formData.username.trim() || !formData.password.trim()) {
            // Para errores de validación local, podemos seguir usando setError si lo necesitamos
            // o usar el authError del contexto
            console.log('⚠️ Validación: Usuario y contraseña requeridos');
            return;
        }

        try {
            console.log('📝 Iniciando submit del formulario...');
            let result;

            if (isRegisterMode) {
                console.log('📝 Modo registro');
                result = await register({
                    username: formData.username.trim(),
                    password: formData.password,
                    displayName: formData.displayName.trim() || formData.username.trim(),
                    role: formData.role
                });
            } else {
                console.log('📝 Modo login');
                result = await login(formData.username.trim(), formData.password);
            }

            console.log('📝 Resultado recibido:', result);

            if (!result.success) {
                console.log('❌ Login fallido, error ya guardado en contexto');
                // El error ya está en authError del contexto
            } else {
                console.log('✅ Login exitoso, mostrando mensaje:', result.message);
                setSuccess(result.message);
                // El login/register exitoso será manejado por el contexto
            }
        } catch (error) {
            console.error('💥 Error inesperado en handleSubmit:', error);
            // Este caso es muy raro, normalmente los errores ya están manejados en login/register
        }
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        clearAuthError(); // ✅ Limpiar error del contexto
        setSuccess('');
        setFormData({
            username: '',
            password: '',
            displayName: '',
            role: 'Visualizador'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Planning Pigmea
                    </h1>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                        {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Usuario
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ingresa tu usuario"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ingresa tu contraseña"
                            required
                            disabled={loading}
                        />
                    </div>

                    {isRegisterMode && (
                        <>
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre a mostrar (opcional)
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Ej: Juan Pérez"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rol
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    disabled={loading}
                                >
                                    <option value="Visualizador">Visualizador</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Administrador">Administrador</option>
                                </select>
                            </div>
                        </>
                    )}

                    {authError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 px-4 py-3 rounded relative">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        {authError}
                                    </p>
                                    {authError.includes('Usuario no encontrado') && (
                                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                            Sugerencia: Verifique que el nombre de usuario esté escrito correctamente
                                        </p>
                                    )}
                                    {authError.includes('Contraseña incorrecta') && (
                                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                            Sugerencia: Revise que las mayúsculas y minúsculas sean correctas
                                        </p>
                                    )}
                                    {authError.includes('Base de datos') && (
                                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                            Acción: Contacte al administrador del sistema inmediatamente
                                        </p>
                                    )}
                                    {authError.includes('conexión') && (
                                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                            Sugerencia: Verifique su conexión a internet o que el servidor esté disponible
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-700 px-4 py-3 rounded relative">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        {success}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </span>
                        ) : (
                            isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={toggleMode}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                    >
                        {isRegisterMode
                            ? '¿Ya tienes cuenta? Inicia sesión'
                            : '¿No tienes cuenta? Créala aquí'
                        }
                    </button>

                    {!isRegisterMode && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <span className="font-medium">Para pruebas:</span><br />
                                Usuario: <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">admin</span> |
                                Contraseña: <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">admin123</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
