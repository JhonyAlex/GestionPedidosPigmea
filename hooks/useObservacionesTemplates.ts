import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import webSocketService from '../services/websocket';
import { useDebounce } from './useDebounce';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ObservacionTemplate {
    id: number;
    text: string;
    usageCount: number;
    lastUsed: string;
    createdAt: string;
}

// Estado global compartido para evitar múltiples fetches
let globalTemplates: ObservacionTemplate[] = [];
let globalLoading = false;
let isInitialized = false;
const stateListeners: Set<() => void> = new Set();

const notifyListeners = () => {
    stateListeners.forEach(listener => listener());
};

export function useObservacionesTemplates() {
    const [templates, setTemplates] = useState<ObservacionTemplate[]>(globalTemplates);
    const [loading, setLoading] = useState(globalLoading);
    const [error, setError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<ObservacionTemplate[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { user } = useAuth();
    const mountedRef = useRef(true);

    // Debounce del término de búsqueda
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Helper para obtener headers de autenticación
    const getAuthHeaders = useCallback(() => {
        if (!user?.id) return {};
        
        const headers: Record<string, string> = {
            'x-user-id': String(user.id),
            'x-user-role': user.role || 'OPERATOR'
        };
        
        if (user.permissions && Array.isArray(user.permissions)) {
            headers['x-user-permissions'] = JSON.stringify(user.permissions);
        }
        
        return headers;
    }, [user]);

    // Fetch inicial de todos los templates
    const fetchTemplates = useCallback(async () => {
        if (globalLoading) return;

        try {
            globalLoading = true;
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API_URL}/observaciones/templates`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error al obtener templates: ${response.statusText}`);
            }

            const data = await response.json();
            globalTemplates = data;
            isInitialized = true;
            
            if (mountedRef.current) {
                setTemplates(data);
            }
            notifyListeners();
        } catch (err) {
            console.error('Error fetching observaciones templates:', err);
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            }
        } finally {
            globalLoading = false;
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [getAuthHeaders]);

    // Búsqueda de templates
    const searchTemplates = useCallback(async (term: string) => {
        if (!term || term.trim().length === 0) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            
            const response = await fetch(
                `${API_URL}/observaciones/templates/search?q=${encodeURIComponent(term)}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`Error al buscar templates: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (mountedRef.current) {
                setSearchResults(data);
            }
        } catch (err) {
            console.error('Error searching observaciones templates:', err);
        } finally {
            if (mountedRef.current) {
                setIsSearching(false);
            }
        }
    }, [getAuthHeaders]);

    // Crear o actualizar template (auto-aprendizaje)
    const saveTemplate = useCallback(async (text: string): Promise<ObservacionTemplate | null> => {
        const trimmedText = text.trim();
        
        // Validaciones
        if (trimmedText.length === 0 || trimmedText.length > 100) {
            return null;
        }

        try {
            const response = await fetch(`${API_URL}/observaciones/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify({ text: trimmedText }),
            });

            if (!response.ok) {
                throw new Error(`Error al guardar template: ${response.statusText}`);
            }

            const savedTemplate = await response.json();
            
            // Actualizar caché local
            const existingIndex = globalTemplates.findIndex(t => t.id === savedTemplate.id);
            if (existingIndex >= 0) {
                globalTemplates[existingIndex] = savedTemplate;
            } else {
                globalTemplates.unshift(savedTemplate);
            }
            
            // Re-ordenar por uso
            globalTemplates.sort((a, b) => b.usageCount - a.usageCount);
            
            if (mountedRef.current) {
                setTemplates([...globalTemplates]);
            }
            notifyListeners();
            
            return savedTemplate;
        } catch (err) {
            console.error('Error saving observacion template:', err);
            return null;
        }
    }, [getAuthHeaders]);

    // Eliminar template
    const deleteTemplate = useCallback(async (id: number): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/observaciones/templates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar template: ${response.statusText}`);
            }

            // Remover del caché local
            globalTemplates = globalTemplates.filter(t => t.id !== id);
            
            if (mountedRef.current) {
                setTemplates([...globalTemplates]);
                // También remover de resultados de búsqueda si está ahí
                setSearchResults(prev => prev.filter(t => t.id !== id));
            }
            notifyListeners();
            
            return true;
        } catch (err) {
            console.error('Error deleting observacion template:', err);
            return false;
        }
    }, [getAuthHeaders]);

    // Efecto para búsqueda con debounce
    useEffect(() => {
        if (debouncedSearchTerm) {
            searchTemplates(debouncedSearchTerm);
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchTerm, searchTemplates]);

    // Suscribirse a eventos WebSocket para sincronización en tiempo real
    useEffect(() => {
        mountedRef.current = true;

        // Fetch inicial si no está inicializado
        if (!isInitialized) {
            fetchTemplates();
        }

        // Listener para sincronizar estado global
        const updateFromGlobal = () => {
            if (mountedRef.current) {
                setTemplates([...globalTemplates]);
                setLoading(globalLoading);
            }
        };
        stateListeners.add(updateFromGlobal);

        // Suscribirse a eventos de WebSocket
        const socket = webSocketService.getSocket();
        
        const handleTemplateUpdated = (template: ObservacionTemplate) => {
            const existingIndex = globalTemplates.findIndex(t => t.id === template.id);
            if (existingIndex >= 0) {
                globalTemplates[existingIndex] = template;
            } else {
                globalTemplates.unshift(template);
            }
            globalTemplates.sort((a, b) => b.usageCount - a.usageCount);
            notifyListeners();
        };

        const handleTemplateDeleted = (data: { id: number }) => {
            globalTemplates = globalTemplates.filter(t => t.id !== data.id);
            notifyListeners();
        };

        if (socket) {
            socket.on('observacion-template-updated', handleTemplateUpdated);
            socket.on('observacion-template-deleted', handleTemplateDeleted);
        }

        return () => {
            mountedRef.current = false;
            stateListeners.delete(updateFromGlobal);
            
            if (socket) {
                socket.off('observacion-template-updated', handleTemplateUpdated);
                socket.off('observacion-template-deleted', handleTemplateDeleted);
            }
        };
    }, [fetchTemplates]);

    return {
        templates,
        loading,
        error,
        searchResults,
        searchTerm,
        setSearchTerm,
        isSearching,
        saveTemplate,
        deleteTemplate,
        refetch: fetchTemplates,
    };
}
