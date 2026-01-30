import { useState, useEffect, useCallback } from 'react';
import { clienteService } from '../services/clienteService';
import webSocketService from '../services/websocket';

// --- Placeholder Types ---
// These types are placeholders as the original type file was not found.
// They are based on the expected API structure from clienteService.ts.

export interface Cliente {
  id: string;
  nombre: string;
  razon_social?: string;
  cif: string;
  direccion: string;
  poblacion?: string;
  codigo_postal?: string;
  provincia?: string;
  pais?: string;
  telefono: string;
  email: string;
  persona_contacto?: string;
  observaciones?: string;
  estado: 'activo' | 'inactivo' | 'archivado';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface ClienteListResponse {
  data: Cliente[];
  total: number;
  pagina: number;
  limite: number;
}

export type ClienteCreateRequest = Omit<Cliente, 'id' | 'estado' | 'fecha_creacion' | 'fecha_actualizacion'>;
export type ClienteUpdateRequest = Partial<ClienteCreateRequest>;

// 🔥 SINGLETON: Estado global compartido
let globalClientes: Cliente[] = [];
let globalLoading = false; // ⚠️ CAMBIO: Empezar en false para permitir primer fetch
let globalError: Error | null = null;
let globalTotal = 0;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
const stateListeners: Set<() => void> = new Set();

const notifyListeners = () => {
  stateListeners.forEach(listener => listener());
};

// --- Custom Hook ---

// 🔥 Helper para actualizar estado global y notificar
const updateGlobalClientes = (updater: (current: Cliente[]) => Cliente[]) => {
  globalClientes = updater(globalClientes);
  globalTotal = globalClientes.length;
  notifyListeners();
};

export const useClientesManager = () => {
  const [clientes, setClientes] = useState<Cliente[]>(globalClientes);
  const [isLoading, setIsLoading] = useState(globalLoading);
  const [error, setError] = useState<Error | null>(globalError);
  const [totalClientes, setTotalClientes] = useState(globalTotal);

  const fetchClientes = useCallback(async () => {
    // Solo evitar fetch si ya hay una petición en curso
    if (globalLoading && isInitialized && globalClientes.length > 0) {
      return;
    }

    globalLoading = true;
    setIsLoading(true);
    notifyListeners();
    setError(null);
    globalError = null;

    try {
      const clientesData = await clienteService.obtenerClientesSimple();

      globalClientes = clientesData;
      globalTotal = clientesData.length;
      updateGlobalClientes(() => clientesData);
    } catch (err) {
      globalError = err as Error;
      setError(err as Error);
      console.error("❌ Error fetching clients:", err);
    } finally {
      globalLoading = false;
      setIsLoading(false);
      notifyListeners();
    }
  }, []);

  // Suscripción al estado global
  useEffect(() => {
    const updateState = () => {
      setClientes(globalClientes);
      setIsLoading(globalLoading);
      setError(globalError);
      setTotalClientes(globalTotal);
    };

    stateListeners.add(updateState);

    if (!isInitialized) {
      isInitialized = true;
      if (!initializationPromise) {
        initializationPromise = fetchClientes().finally(() => {
          initializationPromise = null;
        });
      }
    } else {
      // Si ya está inicializado, sincronizar estado local con global actual
      updateState();
    }

    return () => {
      stateListeners.delete(updateState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔥 Socket.IO: Sincronización en tiempo real para clientes
  // Se mueve FUERA del hook para ser verdadera suscripción global única o 
  // se mantiene dentro pero con cuidado de no duplicar listeners si hay multiples hooks.
  // MEJOR: Mantenerlo dentro pero usando un ref para saber si ya se suscribió este componente,
  // O MEJOR AUN: Mover la suscripción WS a nivel global fuera del hook?
  // Para simplificar y no romper nada, lo dejamos en el hook pero usando updateGlobalClientes.

  useEffect(() => {
    const unsubscribeCreated = webSocketService.subscribeToClienteCreated((data: { cliente: Cliente; timestamp: string }) => {
      console.log('🔄 Sincronizando nuevo cliente:', data.cliente.nombre);
      updateGlobalClientes(current => {
        const exists = current.some(c => c.id === data.cliente.id);
        if (!exists) return [data.cliente, ...current];
        return current;
      });
    });

    const unsubscribeUpdated = webSocketService.subscribeToClienteUpdated((data: { cliente: Cliente; timestamp: string }) => {
      console.log('🔄 Sincronizando cliente actualizado:', data.cliente.nombre);
      updateGlobalClientes(current =>
        current.map(c => c.id === data.cliente.id ? data.cliente : c)
      );
    });

    const unsubscribeDeleted = webSocketService.subscribeToClienteDeleted((data: { clienteId: string; cliente?: Cliente; timestamp: string }) => {
      console.log('🔄 Sincronizando cliente eliminado:', data.clienteId);
      if (data.cliente) {
        updateGlobalClientes(current =>
          current.map(c => c.id === data.clienteId ? data.cliente! : c)
        );
      } else {
        updateGlobalClientes(current => current.filter(c => c.id !== data.clienteId));
      }
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, []);

  const addCliente = async (clienteData: ClienteCreateRequest) => {
    try {
      const nuevoCliente = await clienteService.crearCliente(clienteData);
      updateGlobalClientes(prev => {
        if (prev.some(c => c.id === nuevoCliente.id)) return prev;
        return [nuevoCliente, ...prev];
      });
      return nuevoCliente;
    } catch (err) {
      console.error("Error adding client:", err);
      throw err;
    }
  };

  const updateCliente = async (id: string, clienteData: ClienteUpdateRequest) => {
    try {
      const clienteActualizado = await clienteService.actualizarCliente(id, clienteData);
      updateGlobalClientes(prev => prev.map(c => c.id === id ? clienteActualizado : c));
      return clienteActualizado;
    } catch (err) {
      console.error("Error updating client:", err);
      throw err;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      await clienteService.eliminarCliente(id);
      updateGlobalClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error deleting client:", err);
      throw err;
    }
  };

  const deleteClientePermanently = async (id: string, deletePedidos: boolean = false) => {
    try {
      await clienteService.eliminarClientePermanentemente(id, deletePedidos);
      updateGlobalClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error permanently deleting client:", err);
      throw err;
    }
  };

  return {
    clientes,
    isLoading,
    error,
    totalClientes,
    fetchClientes,
    addCliente,
    updateCliente,
    deleteCliente,
    deleteClientePermanently,
  };
};
