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

export const useClientesManager = () => {
  const [clientes, setClientes] = useState<Cliente[]>(globalClientes);
  const [isLoading, setIsLoading] = useState(globalLoading);
  const [error, setError] = useState<Error | null>(globalError);
  const [totalClientes, setTotalClientes] = useState(globalTotal);

  const fetchClientes = useCallback(async () => {
    console.log('🔍 fetchClientes llamado. globalLoading:', globalLoading, 'isInitialized:', isInitialized);

    // Solo evitar fetch si ya hay una petición en curso
    if (globalLoading && isInitialized && globalClientes.length > 0) {
      console.log('⏭️ Fetch omitido - clientes ya cargados');
      return;
    }

    console.log('🚀 Iniciando fetch de clientes...');
    globalLoading = true;
    setIsLoading(true);
    notifyListeners();
    setError(null);
    globalError = null;

    try {
      const clientesData = await clienteService.obtenerClientesSimple();
      console.log('✅ Clientes recibidos:', clientesData.length);

      if (clientesData.length === 0) {
        console.warn('⚠️ No se encontraron clientes activos.');
      }

      globalClientes = clientesData;
      globalTotal = clientesData.length;
      setClientes(globalClientes);
      setTotalClientes(globalTotal);
    } catch (err) {
      globalError = err as Error;
      setError(err as Error);
      console.error("❌ Error fetching clients:", err);
    } finally {
      globalLoading = false;
      setIsLoading(false);
      notifyListeners();
      console.log('✅ Fetch completado. globalLoading:', false);
    }
  }, []);

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
      updateState();
    }

    return () => {
      stateListeners.delete(updateState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔥 Socket.IO: Sincronización en tiempo real para clientes
  useEffect(() => {
    // Suscribirse a eventos de clientes
    const unsubscribeCreated = webSocketService.subscribeToClienteCreated((data: { cliente: Cliente; timestamp: string }) => {
      console.log('🔄 Sincronizando nuevo cliente:', data.cliente.nombre);

      setClientes(current => {
        // Verificar si el cliente ya existe para evitar duplicados
        const exists = current.some(c => c.id === data.cliente.id);
        if (!exists) {
          setTotalClientes(prev => prev + 1);
          return [data.cliente, ...current];
        }
        return current;
      });
    });

    const unsubscribeUpdated = webSocketService.subscribeToClienteUpdated((data: { cliente: Cliente; timestamp: string }) => {
      console.log('🔄 Sincronizando cliente actualizado:', data.cliente.nombre);

      setClientes(current =>
        current.map(c => c.id === data.cliente.id ? data.cliente : c)
      );
    });

    const unsubscribeDeleted = webSocketService.subscribeToClienteDeleted((data: { clienteId: string; cliente?: Cliente; timestamp: string }) => {
      console.log('🔄 Sincronizando cliente eliminado:', data.clienteId);

      if (data.cliente) {
        // Si es soft delete (archivado), actualizar el estado
        setClientes(current =>
          current.map(c => c.id === data.clienteId ? data.cliente! : c)
        );
      } else {
        // Si es eliminación completa, remover de la lista
        setClientes(current => current.filter(c => c.id !== data.clienteId));
        setTotalClientes(prev => prev - 1);
      }
    });

    // Cleanup al desmontar
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, []);

  const addCliente = async (clienteData: ClienteCreateRequest) => {
    try {
      const nuevoCliente = await clienteService.crearCliente(clienteData);
      // Actualizamos el estado local inmediatamente para feedback rápido
      setClientes(prev => {
        // Evitar duplicados si el WS llega antes o al mismo tiempo
        if (prev.some(c => c.id === nuevoCliente.id)) return prev;
        return [nuevoCliente, ...prev];
      });
      setTotalClientes(prev => prev + 1);
      return nuevoCliente;
    } catch (err) {
      console.error("Error adding client:", err);
      throw err;
    }
  };

  const updateCliente = async (id: string, clienteData: ClienteUpdateRequest) => {
    try {
      const clienteActualizado = await clienteService.actualizarCliente(id, clienteData);
      // Actualizamos estado local inmediatamente
      setClientes(prev => prev.map(c => c.id === id ? clienteActualizado : c));
      return clienteActualizado;
    } catch (err) {
      console.error("Error updating client:", err);
      throw err;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      await clienteService.eliminarCliente(id);
      setClientes(prev => prev.filter(c => c.id !== id));
      setTotalClientes(prev => prev - 1);
    } catch (err) {
      console.error("Error deleting client:", err);
      throw err;
    }
  };

  const deleteClientePermanently = async (id: string, deletePedidos: boolean = false) => {
    try {
      await clienteService.eliminarClientePermanentemente(id, deletePedidos);
      setClientes(prev => prev.filter(c => c.id !== id));
      setTotalClientes(prev => prev - 1);
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
