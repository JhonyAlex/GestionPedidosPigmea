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

// --- Custom Hook ---

export const useClientesManager = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalClientes, setTotalClientes] = useState(0);

  const fetchClientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clienteService.obtenerClientes({ limite: 50 }); // Fetch first 50 for now
      setClientes(response.data);
      setTotalClientes(response.total);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching clients:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

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
      setClientes(prev => [nuevoCliente, ...prev]);
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
