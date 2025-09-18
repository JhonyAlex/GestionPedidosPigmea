import React, { createContext, useReducer, ReactNode, useCallback, useEffect, useContext, useMemo } from 'react';
import { clienteService } from '../services/clienteService';
import {
  Cliente,
  ClienteCreateRequest,
  ClienteListResponse,
  ClienteUpdateRequest,
  EstadoCliente,
} from '../types/cliente';
import { useAuth } from './AuthContext';
import { Permission } from '../types';
import { useErrorHandler, logger } from '../utils/error';

// --- STATE AND ACTION TYPES ---

interface ClienteState {
  clientes: Cliente[];
  clienteSeleccionado: Cliente | null;
  loading: boolean;
  error: string | null;
  filtros: {
    estado?: EstadoCliente;
    busqueda?: string;
  };
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    hasMore: boolean;
  };
}

type ClienteAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CLIENTES'; payload: ClienteListResponse }
  | { type: 'ADD_CLIENTE'; payload: Cliente }
  | { type: 'UPDATE_CLIENTE'; payload: Cliente }
  | { type: 'REMOVE_CLIENTE'; payload: string } // payload is clienteId
  | { type: 'SELECT_CLIENTE'; payload: Cliente | null }
  | { type: 'SET_FILTROS'; payload: Partial<ClienteState['filtros']> }
  | { type: 'SET_PAGINACION'; payload: { pagina: number, limite?: number } }
  // For optimistic updates
  | { type: 'UPDATE_CLIENTE_OPTIMISTIC'; payload: { id: string; data: ClienteUpdateRequest } }
  | { type: 'ROLLBACK_CLIENTE_UPDATE'; payload: Cliente | undefined }
  // For WebSocket events
  | { type: 'WEBSOCKET_CLIENTE_CREATED'; payload: Cliente }
  | { type: 'WEBSOCKET_CLIENTE_UPDATED'; payload: Cliente }
  | { type: 'WEBSOCKET_CLIENTE_DELETED'; payload: string }; // payload is clienteId

// --- REDUCER ---

const initialState: ClienteState = {
  clientes: [],
  clienteSeleccionado: null,
  loading: false,
  error: null,
  filtros: {},
  paginacion: {
    pagina: 1,
    limite: 20,
    total: 0,
    hasMore: false,
  },
};

const clienteReducer = (state: ClienteState, action: ClienteAction): ClienteState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CLIENTES':
      return {
        ...state,
        clientes: action.payload.data,
        paginacion: {
          ...state.paginacion,
          total: action.payload.meta.total,
          hasMore: action.payload.meta.hasNextPage,
        },
        loading: false,
        error: null,
      };
    case 'ADD_CLIENTE':
      return { ...state, clientes: [action.payload, ...state.clientes] };
    case 'UPDATE_CLIENTE':
        return {
            ...state,
            clientes: state.clientes.map(c => c.id === action.payload.id ? action.payload : c),
            clienteSeleccionado: state.clienteSeleccionado?.id === action.payload.id ? action.payload : state.clienteSeleccionado,
        };
    case 'REMOVE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.filter(c => c.id !== action.payload),
      };
    case 'SELECT_CLIENTE':
        return { ...state, clienteSeleccionado: action.payload };
    case 'SET_FILTROS':
        return { ...state, filtros: { ...state.filtros, ...action.payload }, paginacion: { ...state.paginacion, pagina: 1 } };
    case 'SET_PAGINACION':
        return { ...state, paginacion: { ...state.paginacion, ...action.payload } };

    // Optimistic Update cases
    case 'UPDATE_CLIENTE_OPTIMISTIC': {
        const { id, data } = action.payload;
        return {
            ...state,
            clientes: state.clientes.map(c => c.id === id ? { ...c, ...data } : c),
        };
    }
    case 'ROLLBACK_CLIENTE_UPDATE': {
        if (!action.payload) return state;
        return {
            ...state,
            clientes: state.clientes.map(c => c.id === action.payload!.id ? action.payload! : c),
        };
    }

    // WebSocket cases
    case 'WEBSOCKET_CLIENTE_CREATED':
        // Avoid duplicates if the client who created it gets the event
        if (state.clientes.some(c => c.id === action.payload.id)) return state;
        return { ...state, clientes: [action.payload, ...state.clientes] };

    case 'WEBSOCKET_CLIENTE_UPDATED':
        return {
            ...state,
            clientes: state.clientes.map(c => c.id === action.payload.id ? action.payload : c),
        };

    case 'WEBSOCKET_CLIENTE_DELETED':
        return {
            ...state,
            clientes: state.clientes.filter(c => c.id !== action.payload),
        };

    default:
      return state;
  }
};

// --- CONTEXT ---

interface ClienteContextType extends ClienteState {
  // Actions
  cargarClientes: (forzarRecarga?: boolean) => Promise<void>;
  crearCliente: (data: ClienteCreateRequest) => Promise<Cliente | undefined>;
  actualizarCliente: (id: string, data: ClienteUpdateRequest) => Promise<void>;
  eliminarCliente: (id: string) => Promise<void>;
  seleccionarCliente: (cliente: Cliente | null) => void;
  hasPermission: (permissionId: string) => boolean;
  setFiltros: (filtros: Partial<ClienteState['filtros']>) => void;
  setPaginacion: (paginacion: { pagina: number, limite?: number }) => void;
  obtenerClientePorId: (id: string) => Promise<Cliente | undefined>;
}

export const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

// --- PROVIDER ---

interface ClienteProviderProps {
  children: ReactNode;
}

// Placeholder for toast notifications
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    console.log(`[${type.toUpperCase()}] Toast: ${message}`);
    // In a real app, this would integrate with a library like react-toastify
};

export const ClienteProvider: React.FC<ClienteProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(clienteReducer, initialState);
    const { user } = useAuth();
    const { handleApiError } = useErrorHandler();

    const hasPermission = useCallback((permissionId: string): boolean => {
        if (!user || !user.permissions) return false;
        if (user.role === 'Administrador') return true;
        return user.permissions.some((p: Permission) => p.id === permissionId && p.enabled);
    }, [user]);

    const cargarClientes = useCallback(async (forzarRecarga = false) => {
        if (state.loading && !forzarRecarga) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const params = {
                ...state.filtros,
                pagina: state.paginacion.pagina,
                limite: state.paginacion.limite,
            };
            const response = await clienteService.obtenerClientes(params);
            dispatch({ type: 'SET_CLIENTES', payload: response });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            dispatch({ type: 'SET_ERROR', payload: message });
            showToast(message, 'error');
        }
    }, [state.filtros, state.paginacion.pagina, state.paginacion.limite, state.loading]);

    const crearCliente = useCallback(async (data: ClienteCreateRequest): Promise<Cliente | undefined> => {
        if (!hasPermission('clientes.create')) {
            showToast('No tienes permisos para crear clientes.', 'error');
            return;
        }
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const nuevoCliente = await clienteService.crearCliente(data);
            dispatch({ type: 'ADD_CLIENTE', payload: nuevoCliente });
            logger.audit(user, 'Crear Cliente', nuevoCliente.id, { nombre: nuevoCliente.nombre });
            showToast('Cliente creado correctamente.', 'success');
            return nuevoCliente;
        } catch (error) {
            const errorType = handleApiError(error, 'crear cliente');
            if (errorType === 'duplicate') {
                // This error will be handled by the form resolver
                throw new Error('Ya existe un cliente con este nombre');
            }
            return undefined;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [hasPermission, user, handleApiError]);

    const actualizarCliente = useCallback(async (id: string, data: ClienteUpdateRequest) => {
        if (!hasPermission('clientes.edit')) {
            showToast('No tienes permisos para editar clientes.', 'error');
            return;
        }

        const clienteOriginal = state.clientes.find(c => c.id === id);
        dispatch({ type: 'UPDATE_CLIENTE_OPTIMISTIC', payload: { id, data } });

        try {
            const clienteActualizado = await clienteService.actualizarCliente(id, data);
            dispatch({ type: 'UPDATE_CLIENTE', payload: clienteActualizado });
            logger.audit(user, 'Actualizar Cliente', id, { cambios: data });
            showToast('Cliente actualizado.', 'success');
        } catch (error) {
            dispatch({ type: 'ROLLBACK_CLIENTE_UPDATE', payload: clienteOriginal });
            handleApiError(error, 'actualizar cliente');
        }
    }, [hasPermission, state.clientes, user, handleApiError]);

    const eliminarCliente = useCallback(async (id: string) => {
        if (!hasPermission('clientes.delete')) {
            showToast('No tienes permisos para eliminar clientes.', 'error');
            return;
        }
        const cliente = state.clientes.find(c => c.id === id);
        if (!cliente) return;

        const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar a "${cliente.nombre}"?`);
        if (!confirmed) return;

        try {
            await clienteService.eliminarCliente(id);
            dispatch({ type: 'REMOVE_CLIENTE', payload: id });
            logger.audit(user, 'Eliminar Cliente', id, { nombre: cliente.nombre });
            showToast('Cliente eliminado.', 'success');
        } catch (error) {
            handleApiError(error, 'eliminar cliente');
        }
    }, [hasPermission, state.clientes, user, handleApiError]);

    const seleccionarCliente = useCallback((cliente: Cliente | null) => {
        dispatch({ type: 'SELECT_CLIENTE', payload: cliente });
    }, []);

    const setFiltros = useCallback((filtros: Partial<ClienteState['filtros']>) => {
        dispatch({ type: 'SET_FILTROS', payload: filtros });
    }, []);

    const setPaginacion = useCallback((paginacion: { pagina: number, limite?: number }) => {
        dispatch({ type: 'SET_PAGINACION', payload: paginacion });
    }, []);

    const obtenerClientePorId = useCallback(async (id: string): Promise<Cliente | undefined> => {
        const existing = state.clientes.find(c => c.id === id);
        if (existing) {
            return existing;
        }
        // If not in state, fetch from API
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const cliente = await clienteService.obtenerClientePorId(id);
            // We can optionally add it to the state here if needed
            // dispatch({ type: 'ADD_CLIENTE', payload: cliente });
            return cliente;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al buscar cliente';
            dispatch({ type: 'SET_ERROR', payload: message });
            showToast(message, 'error');
            return undefined;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.clientes]);

    // Effect for cross-context communication
    useEffect(() => {
        const handleNuevoPedido = (event: CustomEvent) => {
            const { clienteId } = event.detail;
            if (clienteId) {
                // Here we would refetch client stats or update the client object
                console.log(`Evento 'pedido:creado' recibido para cliente: ${clienteId}. Se deberían refrescar sus datos.`);
            }
        };
        window.addEventListener('pedido:creado', handleNuevoPedido as EventListener);
        return () => window.removeEventListener('pedido:creado', handleNuevoPedido as EventListener);
    }, []);


    const contextValue = {
        ...state,
        cargarClientes,
        crearCliente,
        actualizarCliente,
        eliminarCliente,
        seleccionarCliente,
        hasPermission,
        setFiltros,
        setPaginacion,
        obtenerClientePorId,
    };

    return (
        <ClienteContext.Provider value={contextValue}>
            {children}
        </ClienteContext.Provider>
    );
};

// --- HOOK ---

export const useCliente = () => {
  const context = useContext(ClienteContext);
  if (context === undefined) {
    throw new Error('useCliente must be used within a ClienteProvider');
  }

  // Memoize the context value to prevent unnecessary re-renders in consumer components.
  // The exposed actions are filtered based on the user's permissions.
  const memoizedValue = useMemo(() => ({
    ...context,
    // Conditionally expose functions based on permissions from the context
    crearCliente: context.hasPermission('clientes.create') ? context.crearCliente : undefined,
    actualizarCliente: context.hasPermission('clientes.edit') ? context.actualizarCliente : undefined,
    eliminarCliente: context.hasPermission('clientes.delete') ? context.eliminarCliente : undefined,
  }), [context]);

  return memoizedValue;
};

// --- UTILITY FUNCTION ---

/**
 * Dispatches a custom event to signal that a new pedido should be created
 * with a pre-selected client. This allows for decoupled communication
 * between different parts of the application.
 * @param clienteId - The ID of the client to pre-select for the new order.
 */
export const crearPedidoConClientePreseleccionado = (clienteId: string) => {
  if (!clienteId) {
    console.warn('crearPedidoConClientePreseleccionado called without a clienteId.');
    return;
  }
  window.dispatchEvent(new CustomEvent('cliente:pedido-solicitado', {
    detail: { clienteId }
  }));
};
