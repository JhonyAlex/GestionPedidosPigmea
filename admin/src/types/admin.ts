export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER'
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Session {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPedidos: number;
  pedidosHoy: number;
  pedidosCompletados: number;
  promedioTiempoCompletado: number;
  usuariosConectados: number;
  sesionesActivas: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  affectedResource?: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updatedBy: string;
  updatedAt: string;
  // Propiedades adicionales para configuración
  app_name?: string;
  base_url?: string;
  timezone?: string;
  default_language?: string;
  session_timeout?: number;
  max_login_attempts?: number;
  require_password_change?: boolean;
  backup_frequency?: string;
  backup_retention_days?: number;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  name: string;
  description?: string;
  size: number;
  createdAt: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'failed' | 'in_progress';
  downloadUrl?: string;
}

export interface UserActivity {
  userId: string;
  username: string;
  lastActivity: string;
  actionsToday: number;
  totalActions: number;
  currentSession?: Session;
}

export interface AdminDashboardData {
  stats: SystemStats;
  recentAuditLogs: AuditLog[];
  activeUsers: UserActivity[];
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    responseTime: number;
  };
  server: {
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  websocket: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
  };
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password: string;
  permissions: string[];
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  permissions?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminAuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: number;
  activeConnections: number;
  tables: Array<{
    name: string;
    rowCount: number;
    size: number;
  }>;
}

export interface PerformanceMetrics {
  responseTime: number[];
  throughput: number[];
  errorRate: number[];
  timestamps: string[];
}
