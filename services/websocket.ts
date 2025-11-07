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
  'comment:added': (comment: any) => void;
  'comment:deleted': (data: { commentId: string; pedidoId: string }) => void;
  'cliente-created': (data: { cliente: any; timestamp: string }) => void;
  'cliente-updated': (data: { cliente: any; timestamp: string }) => void;
  'cliente-deleted': (data: { clienteId: string; cliente?: any; timestamp: string }) => void;
  'cliente-deleted-permanent': (data: { clienteId: string; timestamp: string }) => void;
  'vendedor-created': (data: { vendedor: any; message: string; timestamp: string }) => void;
  'vendedor-updated': (data: { vendedor: any; message: string; timestamp: string }) => void;
  'vendedor-deleted': (data: { vendedorId: string; vendedor?: any; message: string; timestamp: string }) => void;
  
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
  
  // Callbacks para comentarios en tiempo real
  private commentAddedListeners: ((comment: any) => void)[] = [];
  private commentDeletedListeners: ((data: { commentId: string; pedidoId: string }) => void)[] = [];
  
  // Callbacks para clientes en tiempo real
  private clienteCreatedListeners: ((data: any) => void)[] = [];
  private clienteUpdatedListeners: ((data: any) => void)[] = [];
  private clienteDeletedListeners: ((data: any) => void)[] = [];
  
  // Callbacks para vendedores en tiempo real
  private vendedorCreatedListeners: ((data: any) => void)[] = [];
  private vendedorUpdatedListeners: ((data: any) => void)[] = [];
  private vendedorDeletedListeners: ((data: any) => void)[] = [];
  
  // Control de visibilidad de pestaña y sincronización
  private isPageVisible = true;
  private lastActivityTime = Date.now();
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private pageRefreshCallbacks: (() => void)[] = [];
  private readonly INACTIVITY_THRESHOLD = 2 * 60 * 1000; // 🔥 Reducido a 2 minutos (era 5)

  constructor() {
    // Suprimir errores específicos de extensiones del navegador
    this.setupErrorHandling();
    this.setupVisibilityDetection();
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

  private setupVisibilityDetection() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Detectar cuando el usuario cambia de pestaña o minimiza la ventana
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // El usuario salió de la pestaña
        this.isPageVisible = false;
        this.lastActivityTime = Date.now();
        console.log('👁️ Usuario salió de la pestaña');
      } else {
        // El usuario regresó a la pestaña
        this.isPageVisible = true;
        const timeAway = Date.now() - this.lastActivityTime;
        console.log(`👁️ Usuario regresó a la pestaña después de ${Math.round(timeAway / 1000)}s`);

        // 🔥 SIEMPRE verificar el estado de conexión cuando vuelve
        if (!this.isConnected) {
          console.log('🔄 WebSocket desconectado, reconectando...');
          this.forceReconnection();
        }

        // 🔥 Si estuvo inactivo más del umbral, forzar actualización de datos
        if (timeAway > this.INACTIVITY_THRESHOLD) {
          console.log(`🔄 Inactividad detectada (${Math.round(timeAway / 1000)}s > ${this.INACTIVITY_THRESHOLD / 1000}s), actualizando datos...`);
          this.handlePageReturn();
        } else if (timeAway > 30000) { // Más de 30 segundos
          // Aunque no supere el umbral, si fue más de 30s, notificar suavemente
          console.log('🔄 Usuario estuvo ausente, verificando sincronización...');
          this.handlePageReturn();
        }
      }
    };

    // Evento de visibilidad del documento
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Evento de focus/blur de la ventana (respaldo)
    window.addEventListener('focus', () => {
      if (!this.isPageVisible) {
        handleVisibilityChange();
      }
    });

    window.addEventListener('blur', () => {
      if (this.isPageVisible) {
        this.isPageVisible = false;
        this.lastActivityTime = Date.now();
      }
    });

    // Detectar cuando la pestaña vuelve a ser visible después de estar en segundo plano
    window.addEventListener('pageshow', (event) => {
      if (event.persisted || performance.navigation.type === 2) {
        // La página fue cargada desde cache (back/forward)
        console.log('🔄 Página restaurada desde cache, verificando estado...');
        const timeAway = Date.now() - this.lastActivityTime;
        if (timeAway > this.INACTIVITY_THRESHOLD) {
          this.handlePageReturn();
        }
      }
    });
  }

  private handlePageReturn() {
    // Notificar a los componentes que deben refrescar sus datos
    this.addNotification({
      type: 'info',
      title: 'Actualizando datos',
      message: 'Sincronizando información reciente...',
      autoClose: true,
      duration: 3000
    });

    // Llamar a todos los callbacks registrados para refrescar
    this.pageRefreshCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error ejecutando callback de refresco:', error);
      }
    });

    // Si está desconectado, intentar reconectar
    if (!this.isConnected && this.isOnline) {
      this.forceReconnection();
    }
  }

  // Método público para suscribirse a eventos de retorno de página
  public subscribeToPageReturn(callback: () => void): () => void {
    this.pageRefreshCallbacks.push(callback);
    return () => {
      const index = this.pageRefreshCallbacks.indexOf(callback);
      if (index > -1) {
        this.pageRefreshCallbacks.splice(index, 1);
      }
    };
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
          autoClose: true, // ✅ Cambiar a true para auto-cerrar después de 5 segundos
          duration: 5000 // ✅ Cerrar después de 5 segundos
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
          autoClose: true, // ✅ Auto-cerrar después de 8 segundos
          duration: 8000
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
      
      // ✅ Limpiar TODAS las notificaciones de desconexión inmediatamente
      this.notifications = this.notifications.filter(n => 
        !(n.type === 'warning' && (n.title === 'Desconectado' || n.message.includes('Conexión en tiempo real perdida'))) &&
        !(n.type === 'error' && n.message.includes('conexión')) &&
        !(n.type === 'info' && n.message.includes('internet'))
      );
      this.notificationListeners.forEach(callback => callback(this.notifications));
      
      // Mostrar mensaje de éxito
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
        autoClose: true, // ✅ Auto-cerrar después de 10 segundos
        duration: 10000
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

    // Eventos de clientes
    this.socket.on('cliente-created', (data) => {
      console.log('👤 Nuevo cliente creado:', data);
      this.notifyClienteCreatedListeners(data);
    });

    this.socket.on('cliente-updated', (data) => {
      console.log('✏️ Cliente actualizado:', data);
      this.notifyClienteUpdatedListeners(data);
    });

    this.socket.on('cliente-deleted', (data) => {
      console.log('🗑️ Cliente eliminado:', data);
      this.notifyClienteDeletedListeners(data);
    });

    this.socket.on('cliente-deleted-permanent', (data) => {
      console.log('🗑️ Cliente eliminado permanentemente:', data);
      this.notifyClienteDeletedListeners(data);
    });

    // Eventos de vendedores
    this.socket.on('vendedor-created', (data) => {
      console.log('👤 Nuevo vendedor creado:', data);
      this.notifyVendedorCreatedListeners(data);
    });

    this.socket.on('vendedor-updated', (data) => {
      console.log('✏️ Vendedor actualizado:', data);
      this.notifyVendedorUpdatedListeners(data);
    });

    this.socket.on('vendedor-deleted', (data) => {
      console.log('🗑️ Vendedor eliminado:', data);
      this.notifyVendedorDeletedListeners(data);
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

  // Métodos de suscripción para clientes
  public subscribeToClienteCreated(callback: (data: any) => void): () => void {
    this.clienteCreatedListeners.push(callback);
    return () => {
      const index = this.clienteCreatedListeners.indexOf(callback);
      if (index > -1) {
        this.clienteCreatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToClienteUpdated(callback: (data: any) => void): () => void {
    this.clienteUpdatedListeners.push(callback);
    return () => {
      const index = this.clienteUpdatedListeners.indexOf(callback);
      if (index > -1) {
        this.clienteUpdatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToClienteDeleted(callback: (data: any) => void): () => void {
    this.clienteDeletedListeners.push(callback);
    return () => {
      const index = this.clienteDeletedListeners.indexOf(callback);
      if (index > -1) {
        this.clienteDeletedListeners.splice(index, 1);
      }
    };
  }

  // Métodos de suscripción para vendedores
  public subscribeToVendedorCreated(callback: (data: any) => void): () => void {
    this.vendedorCreatedListeners.push(callback);
    return () => {
      const index = this.vendedorCreatedListeners.indexOf(callback);
      if (index > -1) {
        this.vendedorCreatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToVendedorUpdated(callback: (data: any) => void): () => void {
    this.vendedorUpdatedListeners.push(callback);
    return () => {
      const index = this.vendedorUpdatedListeners.indexOf(callback);
      if (index > -1) {
        this.vendedorUpdatedListeners.splice(index, 1);
      }
    };
  }

  public subscribeToVendedorDeleted(callback: (data: any) => void): () => void {
    this.vendedorDeletedListeners.push(callback);
    return () => {
      const index = this.vendedorDeletedListeners.indexOf(callback);
      if (index > -1) {
        this.vendedorDeletedListeners.splice(index, 1);
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

  private notifyCommentAddedListeners(comment: any) {
    this.commentAddedListeners.forEach(listener => listener(comment));
  }

  private notifyCommentDeletedListeners(data: { commentId: string; pedidoId: string }) {
    this.commentDeletedListeners.forEach(listener => listener(data));
  }

  private notifyClienteCreatedListeners(data: any) {
    this.clienteCreatedListeners.forEach(listener => listener(data));
  }

  private notifyClienteUpdatedListeners(data: any) {
    this.clienteUpdatedListeners.forEach(listener => listener(data));
  }

  private notifyClienteDeletedListeners(data: any) {
    this.clienteDeletedListeners.forEach(listener => listener(data));
  }

  private notifyVendedorCreatedListeners(data: any) {
    this.vendedorCreatedListeners.forEach(listener => listener(data));
  }

  private notifyVendedorUpdatedListeners(data: any) {
    this.vendedorUpdatedListeners.forEach(listener => listener(data));
  }

  private notifyVendedorDeletedListeners(data: any) {
    this.vendedorDeletedListeners.forEach(listener => listener(data));
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
    this.commentAddedListeners = [];
    this.commentDeletedListeners = [];
    this.clienteCreatedListeners = [];
    this.clienteUpdatedListeners = [];
    this.clienteDeletedListeners = [];
    this.vendedorCreatedListeners = [];
    this.vendedorUpdatedListeners = [];
    this.vendedorDeletedListeners = [];
    this.notificationListeners = [];
    this.connectedUsersListeners = [];
    this.pageRefreshCallbacks = [];
    
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;
