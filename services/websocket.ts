import { io, Socket } from 'socket.io-client';
import { Pedido, UserRole, Cliente, EstadisticasCliente } from '../types';

// Tipos para los eventos WebSocket
export interface WebSocketEvents {
  // Eventos del servidor
  'pedido-created': (data: { pedido: Pedido; message: string; timestamp: string }) => void;
  'pedido-updated': (data: { pedido: Pedido; previousPedido?: Pedido; changes: string[]; message: string; timestamp: string }) => void;
  'pedido-deleted': (data: { pedidoId: string; deletedPedido?: Pedido; message: string; timestamp: string }) => void;
  'cliente-created': (data: { type: string; data: Cliente; message: string; autoCreated?: boolean; timestamp: string }) => void;
  'cliente-updated': (data: { type: string; data: Cliente; message: string; timestamp: string }) => void;
  'cliente-deleted': (data: { type: string; data: { id: string; nombre: string }; message: string; timestamp: string }) => void;
  'cliente-stats-updated': (data: { type: string; data: { clienteNombre: string; pedidoId: string; accion: string }; message: string; timestamp: string }) => void;
  'user-connected': (data: { userId: string; userRole: UserRole; connectedUsers: ConnectedUser[] }) => void;
  'user-disconnected': (data: { userId: string; connectedUsers: ConnectedUser[] }) => void;
  'users-list': (data: { connectedUsers: ConnectedUser[] }) => void;
  'user-activity-received': (data: { userId: string; userRole: UserRole; activity: string; data?: any }) => void;
  'comment:added': (comment: any) => void;
  'comment:deleted': (data: { commentId: string; pedidoId: string }) => void;
  
  // Eventos del cliente
  authenticate: (data: { userId: string; userRole: UserRole }) => void;
  'user-activity': (data: { activity: string; data?: any }) => void;
}

export interface ConnectedUser {
  userId: string;
  userRole: UserRole;
  joinedAt: string;
}

export interface NotificationData {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  autoClose?: boolean;
  duration?: number;
}

class WebSocketService {
  private socket: Socket<WebSocketEvents> | null = null;
  private isConnected = false;
  private isOnline = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionTestInterval: NodeJS.Timeout | null = null;
  private notifications: NotificationData[] = [];
  private notificationListeners: ((notifications: NotificationData[]) => void)[] = [];
  private connectedUsers: ConnectedUser[] = [];
  private connectedUsersListeners: ((users: ConnectedUser[]) => void)[] = [];
  
  // Callbacks para sincronización de datos en tiempo real
  private pedidoCreatedListeners: ((pedido: Pedido) => void)[] = [];
  private pedidoUpdatedListeners: ((pedido: Pedido) => void)[] = [];
  private pedidoDeletedListeners: ((pedidoId: string) => void)[] = [];
  
  // Callbacks para clientes en tiempo real
  private clienteCreatedListeners: ((cliente: Cliente) => void)[] = [];
  private clienteUpdatedListeners: ((cliente: Cliente) => void)[] = [];
  private clienteDeletedListeners: ((clienteId: string) => void)[] = [];
  private clienteStatsUpdatedListeners: ((data: { clienteNombre: string; pedidoId: string; accion: string }) => void)[] = [];
  
  // Callbacks para comentarios en tiempo real
  private commentAddedListeners: ((comment: any) => void)[] = [];
  private commentDeletedListeners: ((data: { commentId: string; pedidoId: string }) => void)[] = [];

  constructor() {
    // Suprimir errores específicos de extensiones del navegador
    this.setupErrorHandling();
    this.connect();
  }

  private setupErrorHandling() {
    // Capturar errores globales relacionados con WebSocket/extensiones
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (event.message && (
          event.message.includes('A listener indicated an asynchronous response') ||
          event.message.includes('message channel closed') ||
          event.message.includes('Extension context invalidated')
        )) {
          console.debug('🔇 Error de extensión suprimido:', event.message);
          event.preventDefault();
          return false;
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && (
          event.reason.message.includes('A listener indicated an asynchronous response') ||
          event.reason.message.includes('message channel closed') ||
          event.reason.message.includes('Extension context invalidated')
        )) {
          console.debug('🔇 Promesa rechazada de extensión suprimida:', event.reason.message);
          event.preventDefault();
          return false;
        }
      });
    }
  }

  private connect() {
    try {
      // Detectar la URL del servidor
      const isDevelopment = typeof window !== 'undefined' && 
                           (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const serverUrl = isDevelopment 
        ? 'http://localhost:8080' 
        : window.location.origin;

      this.socket = io(serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: true,
        transports: ['websocket', 'polling'], // Fallback a polling si WebSocket falla
        upgrade: true
      });

      this.setupEventListeners();
      this.setupReconnectionLogic();
    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error);
      this.addNotification({
        type: 'error',
        title: 'Error de inicialización',
        message: 'No se pudo inicializar la conexión en tiempo real',
        autoClose: false
      });
    }
  }

  private setupReconnectionLogic() {
    // Monitorear la conectividad de red
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Conexión a internet restaurada, verificando conectividad...');
        this.isOnline = true;
        this.testAndReconnect();
      });

      window.addEventListener('offline', () => {
        console.log('🌐 Conexión a internet perdida');
        this.isOnline = false;
        this.isConnected = false;
        this.stopConnectionTest();
        this.addNotification({
          type: 'warning',
          title: 'Sin conexión',
          message: 'Se perdió la conexión a internet. Las modificaciones están bloqueadas.',
          autoClose: false
        });
      });

      // Verificar conectividad periódicamente cuando está desconectado
      this.startConnectionTest();
    }
  }

  private startConnectionTest() {
    if (this.connectionTestInterval) {
      clearInterval(this.connectionTestInterval);
    }

    this.connectionTestInterval = setInterval(() => {
      if (!this.isConnected && this.isOnline) {
        this.testConnectivity();
      }
    }, 5000); // Verificar cada 5 segundos
  }

  private stopConnectionTest() {
    if (this.connectionTestInterval) {
      clearInterval(this.connectionTestInterval);
      this.connectionTestInterval = null;
    }
  }

  private async testConnectivity(): Promise<boolean> {
    try {
      // Hacer una prueba simple al servidor
      const response = await fetch(window.location.origin + '/api/health', {
        method: 'GET',
        cache: 'no-cache',
        timeout: 3000
      } as any);
      
      if (response.ok) {
        console.log('✅ Conectividad restaurada, reintentando conexión WebSocket...');
        this.forceReconnection();
        return true;
      }
    } catch (error) {
      console.log('🔍 Servidor aún no disponible, continuando pruebas...');
    }
    return false;
  }

  private async testAndReconnect() {
    // Esperar un poco antes de probar (para que la red se estabilice)
    setTimeout(async () => {
      const isConnected = await this.testConnectivity();
      if (!isConnected) {
        // Si no se pudo conectar inmediatamente, seguir probando
        this.startConnectionTest();
      }
    }, 1000);
  }

  private forceReconnection() {
    if (this.socket) {
      console.log('🔄 Forzando reconexión WebSocket...');
      this.socket.disconnect();
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 1000);
    }
  }

  // Método público para obtener el estado de conectividad
  public isSystemOnline(): boolean {
    return this.isConnected && this.isOnline;
  }

  // Método público para obtener el estado de conexión WebSocket
  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Eventos de conexión
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.stopConnectionTest(); // Detener pruebas cuando ya estamos conectados
      
      // Limpiar notificaciones de desconexión anteriores
      this.notifications = this.notifications.filter(n => 
        n.type !== 'warning' && n.type !== 'error' || 
        !n.message.includes('conexión') && !n.message.includes('internet')
      );
      this.notificationListeners.forEach(callback => callback(this.notifications));
      
      this.addNotification({
        type: 'success',
        title: 'Conectado',
        message: 'Sistema online - Modificaciones habilitadas',
        autoClose: true,
        duration: 4000
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      // Solo mostrar mensaje si no es por pérdida de internet
      if (this.isOnline) {
        this.addNotification({
          type: 'warning',
          title: 'Desconectado',
          message: 'Conexión en tiempo real perdida. Reintentando...',
          autoClose: false
        });
        // Comenzar pruebas de conectividad
        this.startConnectionTest();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      
      // Solo mostrar error después de varios intentos fallidos
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.addNotification({
          type: 'error',
          title: 'Error de conexión',
          message: 'No se pudo restablecer la conexión en tiempo real',
          autoClose: false
        });
      }
    });

    // Usar el IO manager para eventos de reconexión
    this.socket.io.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Reconectado después de ${attemptNumber} intentos`);
      this.isConnected = true;
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.stopConnectionTest(); // Detener pruebas cuando ya estamos conectados
      
      // Limpiar notificaciones de desconexión anteriores
      this.notifications = this.notifications.filter(n => 
        n.type !== 'warning' && n.type !== 'error' || 
        !n.message.includes('conexión') && !n.message.includes('internet')
      );
      this.notificationListeners.forEach(callback => callback(this.notifications));
      
      this.addNotification({
        type: 'success',
        title: 'Sistema restablecido',
        message: 'Conexión restaurada - Modificaciones habilitadas',
        autoClose: true,
        duration: 4000
      });
    });

    this.socket.io.on('reconnect_error', (error: Error) => {
      console.log('🔄 Error en intento de reconexión:', error.message);
    });

    this.socket.io.on('reconnect_failed', () => {
      this.addNotification({
        type: 'error',
        title: 'Reconexión fallida',
        message: 'No se pudo restablecer la conexión automáticamente',
        autoClose: false
      });
    });

    // Eventos de datos
    this.socket.on('pedido-created', (data) => {
      console.log('📦 Nuevo pedido creado:', data);
      this.addNotification({
        type: 'info',
        title: 'Nuevo pedido',
        message: data.message,
        autoClose: true,
        duration: 5000
      });
      
      // Notificar a los listeners para sincronización automática
      this.notifyPedidoCreatedListeners(data.pedido);
    });

    this.socket.on('pedido-updated', (data) => {
      console.log('📝 Pedido actualizado:', data);
      if (data.changes.length > 0) {
        this.addNotification({
          type: 'info',
          title: 'Pedido actualizado',
          message: data.message,
          autoClose: true,
          duration: 4000
        });
      }
      
      // Notificar a los listeners para sincronización automática
      this.notifyPedidoUpdatedListeners(data.pedido);
    });

    this.socket.on('pedido-deleted', (data) => {
      console.log('🗑️ Pedido eliminado:', data);
      this.addNotification({
        type: 'warning',
        title: 'Pedido eliminado',
        message: data.message,
        autoClose: true,
        duration: 4000
      });
      
      // Notificar a los listeners para sincronización automática
      this.notifyPedidoDeletedListeners(data.pedidoId);
    });

    // Eventos de clientes
    this.socket.on('cliente-created', (data) => {
      console.log('🏢 Cliente creado:', data);
      const notificationType = data.autoCreated ? 'success' : 'info';
      const title = data.autoCreated ? 'Cliente creado automáticamente' : 'Nuevo cliente';
      
      this.addNotification({
        type: notificationType,
        title: title,
        message: data.message,
        autoClose: true,
        duration: data.autoCreated ? 3000 : 5000
      });
      
      // Notificar a los listeners para sincronización automática
      this.notifyClienteCreatedListeners(data.data);
    });

    this.socket.on('cliente-updated', (data) => {
      console.log('📝 Cliente actualizado:', data);
      this.addNotification({
        type: 'info',
        title: 'Cliente actualizado',
        message: data.message,
        autoClose: true,
        duration: 4000
      });
      
      // Notificar a los listeners para sincronización automática
      this.notifyClienteUpdatedListeners(data.data);
    });

    this.socket.on('cliente-deleted', (data) => {
      console.log('🗑️ Cliente eliminado:', data);
      this.addNotification({
        type: 'warning',
        title: 'Cliente eliminado',
        message: data.message,
        autoClose: true,
        duration: 4000
      });
      
      // Notificar a los listeners para sincronización automática
      this.notifyClienteDeletedListeners(data.data.id);
    });

    this.socket.on('cliente-stats-updated', (data) => {
      console.log('📊 Estadísticas de cliente actualizadas:', data);
      // No mostramos notificación para estadísticas para evitar spam
      // Solo notificamos a los listeners para sincronización
      this.notifyClienteStatsUpdatedListeners(data.data);
    });

    // Eventos de usuarios
    this.socket.on('user-connected', (data) => {
      console.log('👤 Usuario conectado:', data);
      this.connectedUsers = data.connectedUsers;
      this.notifyConnectedUsersListeners();
      
      this.addNotification({
        type: 'info',
        title: 'Usuario conectado',
        message: `${data.userId} (${data.userRole}) se conectó`,
        autoClose: true,
        duration: 3000
      });
    });

    this.socket.on('user-disconnected', (data) => {
      console.log('👤 Usuario desconectado:', data);
      this.connectedUsers = data.connectedUsers;
      this.notifyConnectedUsersListeners();
      
      this.addNotification({
        type: 'info',
        title: 'Usuario desconectado',
        message: `${data.userId} se desconectó`,
        autoClose: true,
        duration: 3000
      });
    });

    this.socket.on('users-list', (data) => {
      this.connectedUsers = data.connectedUsers;
      this.notifyConnectedUsersListeners();
    });

    this.socket.on('user-activity-received', (data) => {
      // Puedes manejar actividades específicas aquí
    });

    // Eventos de comentarios
    this.socket.on('comment:added', (comment) => {
      console.log('💬 Nuevo comentario:', comment);
      this.notifyCommentAddedListeners(comment);
    });

    this.socket.on('comment:deleted', (data) => {
      console.log('🗑️ Comentario eliminado:', data);
      this.notifyCommentDeletedListeners(data);
    });
  }

  // Métodos públicos
  public authenticate(userId: string, userRole: UserRole) {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', { userId, userRole });
    }
  }

  public emitActivity(activity: string, data?: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('user-activity', { activity, data });
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public getConnectedUsers(): ConnectedUser[] {
    return [...this.connectedUsers];
  }

  // Sistema de notificaciones
  private addNotification(notification: Omit<NotificationData, 'id' | 'timestamp'>) {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };

    this.notifications.unshift(newNotification);
    
    // Limitar a las últimas 50 notificaciones
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyNotificationListeners();

    // Auto-eliminar notificación si está configurado
    if (newNotification.autoClose) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, newNotification.duration || 5000);
    }
  }

  public removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyNotificationListeners();
  }

  public getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  public subscribeToNotifications(listener: (notifications: NotificationData[]) => void) {
    this.notificationListeners.push(listener);
    
    // Cleanup function
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }

  public subscribeToConnectedUsers(listener: (users: ConnectedUser[]) => void) {
    this.connectedUsersListeners.push(listener);
    
    // Cleanup function
    return () => {
      this.connectedUsersListeners = this.connectedUsersListeners.filter(l => l !== listener);
    };
  }

  private notifyNotificationListeners() {
    this.notificationListeners.forEach(listener => listener([...this.notifications]));
  }

  private notifyConnectedUsersListeners() {
    this.connectedUsersListeners.forEach(listener => listener([...this.connectedUsers]));
  }

  // Métodos para suscripción a cambios de datos
  public subscribeToPedidoCreated(callback: (pedido: Pedido) => void): () => void {
    this.pedidoCreatedListeners.push(callback);
    return () => {
      const index = this.pedidoCreatedListeners.indexOf(callback);
      if (index > -1) {
        this.pedidoCreatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToPedidoUpdated(callback: (pedido: Pedido) => void): () => void {
    this.pedidoUpdatedListeners.push(callback);
    return () => {
      const index = this.pedidoUpdatedListeners.indexOf(callback);
      if (index > -1) {
        this.pedidoUpdatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToPedidoDeleted(callback: (pedidoId: string) => void): () => void {
    this.pedidoDeletedListeners.push(callback);
    return () => {
      const index = this.pedidoDeletedListeners.indexOf(callback);
      if (index > -1) {
        this.pedidoDeletedListeners.splice(index, 1);
      }
    };
  }

  // Suscripciones para eventos de clientes
  public subscribeToClienteCreated(callback: (cliente: Cliente) => void): () => void {
    this.clienteCreatedListeners.push(callback);
    return () => {
      const index = this.clienteCreatedListeners.indexOf(callback);
      if (index > -1) {
        this.clienteCreatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToClienteUpdated(callback: (cliente: Cliente) => void): () => void {
    this.clienteUpdatedListeners.push(callback);
    return () => {
      const index = this.clienteUpdatedListeners.indexOf(callback);
      if (index > -1) {
        this.clienteUpdatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToClienteDeleted(callback: (clienteId: string) => void): () => void {
    this.clienteDeletedListeners.push(callback);
    return () => {
      const index = this.clienteDeletedListeners.indexOf(callback);
      if (index > -1) {
        this.clienteDeletedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToClienteStatsUpdated(callback: (data: { clienteNombre: string; pedidoId: string; accion: string }) => void): () => void {
    this.clienteStatsUpdatedListeners.push(callback);
    return () => {
      const index = this.clienteStatsUpdatedListeners.indexOf(callback);
      if (index > -1) {
        this.clienteStatsUpdatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToCommentAdded(callback: (comment: any) => void): () => void {
    this.commentAddedListeners.push(callback);
    return () => {
      const index = this.commentAddedListeners.indexOf(callback);
      if (index > -1) {
        this.commentAddedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToCommentDeleted(callback: (data: { commentId: string; pedidoId: string }) => void): () => void {
    this.commentDeletedListeners.push(callback);
    return () => {
      const index = this.commentDeletedListeners.indexOf(callback);
      if (index > -1) {
        this.commentDeletedListeners.splice(index, 1);
      }
    };
  }

  // Métodos para notificar cambios
  private notifyPedidoCreatedListeners(pedido: Pedido) {
    this.pedidoCreatedListeners.forEach(listener => listener(pedido));
  }

  private notifyPedidoUpdatedListeners(pedido: Pedido) {
    this.pedidoUpdatedListeners.forEach(listener => listener(pedido));
  }

  private notifyPedidoDeletedListeners(pedidoId: string) {
    this.pedidoDeletedListeners.forEach(listener => listener(pedidoId));
  }

  // Métodos para notificar cambios de clientes
  private notifyClienteCreatedListeners(cliente: Cliente) {
    this.clienteCreatedListeners.forEach(listener => listener(cliente));
  }

  private notifyClienteUpdatedListeners(cliente: Cliente) {
    this.clienteUpdatedListeners.forEach(listener => listener(cliente));
  }

  private notifyClienteDeletedListeners(clienteId: string) {
    this.clienteDeletedListeners.forEach(listener => listener(clienteId));
  }

  private notifyClienteStatsUpdatedListeners(data: { clienteNombre: string; pedidoId: string; accion: string }) {
    this.clienteStatsUpdatedListeners.forEach(listener => listener(data));
  }

  private notifyCommentAddedListeners(comment: any) {
    this.commentAddedListeners.forEach(listener => listener(comment));
  }

  private notifyCommentDeletedListeners(data: { commentId: string; pedidoId: string }) {
    this.commentDeletedListeners.forEach(listener => listener(data));
  }

  public disconnect() {
    this.stopConnectionTest();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isOnline = false;
    }
  }

  // Método para limpiar recursos cuando el componente se desmonta
  public cleanup() {
    this.disconnect();
    this.notifications = [];
    this.connectedUsers = [];
    this.pedidoCreatedListeners = [];
    this.pedidoUpdatedListeners = [];
    this.pedidoDeletedListeners = [];
    this.clienteCreatedListeners = [];
    this.clienteUpdatedListeners = [];
    this.clienteDeletedListeners = [];
    this.clienteStatsUpdatedListeners = [];
    this.commentAddedListeners = [];
    this.commentDeletedListeners = [];
    this.notificationListeners = [];
    this.connectedUsersListeners = [];
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;
