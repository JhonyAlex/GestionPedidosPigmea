import { io, Socket } from 'socket.io-client';
import { Pedido, UserRole } from '../types';

// Tipos para los eventos WebSocket
export interface WebSocketEvents {
  // Eventos del servidor
  'pedido-created': (data: { pedido: Pedido; message: string; timestamp: string }) => void;
  'pedido-updated': (data: { pedido: Pedido; previousPedido?: Pedido; changes: string[]; message: string; timestamp: string }) => void;
  'pedido-deleted': (data: { pedidoId: string; deletedPedido?: Pedido; message: string; timestamp: string }) => void;
  'user-connected': (data: { userId: string; userRole: UserRole; connectedUsers: ConnectedUser[] }) => void;
  'user-disconnected': (data: { userId: string; connectedUsers: ConnectedUser[] }) => void;
  'users-list': (data: { connectedUsers: ConnectedUser[] }) => void;
  'user-activity-received': (data: { userId: string; userRole: UserRole; activity: string; data?: any }) => void;
  
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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private notifications: NotificationData[] = [];
  private notificationListeners: ((notifications: NotificationData[]) => void)[] = [];
  private connectedUsers: ConnectedUser[] = [];
  private connectedUsersListeners: ((users: ConnectedUser[]) => void)[] = [];
  
  // Callbacks para sincronización de datos en tiempo real
  private pedidoCreatedListeners: ((pedido: Pedido) => void)[] = [];
  private pedidoUpdatedListeners: ((pedido: Pedido) => void)[] = [];
  private pedidoDeletedListeners: ((pedidoId: string) => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
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
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Eventos de conexión
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.addNotification({
        type: 'success',
        title: 'Conectado',
        message: 'Conexión en tiempo real establecida',
        autoClose: true,
        duration: 3000
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado de WebSocket:', reason);
      this.isConnected = false;
      
      this.addNotification({
        type: 'warning',
        title: 'Desconectado',
        message: 'Conexión en tiempo real perdida. Reintentando...',
        autoClose: false
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Error de conexión WebSocket:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.addNotification({
          type: 'error',
          title: 'Error de conexión',
          message: 'No se pudo establecer conexión en tiempo real',
          autoClose: false
        });
      }
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

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;
