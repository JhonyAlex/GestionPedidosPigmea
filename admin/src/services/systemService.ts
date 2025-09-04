import axios from 'axios';
import {
  SystemStats,
  AuditLog,
  SystemConfig,
  DatabaseBackup,
  SystemHealth,
  AdminDashboardData
} from '../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SystemService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Dashboard y estadísticas
  async getDashboardData(): Promise<AdminDashboardData> {
    const response = await this.api.get('/dashboard');
    return response.data;
  }

  async getSystemStats(): Promise<SystemStats> {
    const response = await this.api.get('/stats');
    return response.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Auditoría
  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      userId?: string;
      action?: string;
      module?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> {
    const response = await this.api.get('/audit-logs', {
      params: { page, limit, ...filters },
    });
    return response.data;
  }

  async exportAuditLogs(filters?: {
    userId?: string;
    action?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await this.api.get('/audit-logs/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  // Configuración del sistema
  async getSystemConfigs(): Promise<SystemConfig[]> {
    const response = await this.api.get('/config');
    return response.data;
  }

  async updateSystemConfig(key: string, value: string): Promise<SystemConfig> {
    const response = await this.api.put(`/config/${key}`, { value });
    return response.data;
  }

  async getSystemConfigByCategory(category: string): Promise<SystemConfig[]> {
    const response = await this.api.get(`/config/category/${category}`);
    return response.data;
  }

  // Backups
  async getDatabaseBackups(): Promise<DatabaseBackup[]> {
    const response = await this.api.get('/backups');
    return response.data;
  }

  async createDatabaseBackup(): Promise<DatabaseBackup> {
    const response = await this.api.post('/backups');
    return response.data;
  }

  async downloadBackup(backupId: string): Promise<Blob> {
    const response = await this.api.get(`/backups/${backupId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteBackup(backupId: string): Promise<void> {
    await this.api.delete(`/backups/${backupId}`);
  }

  // Sistema y mantenimiento
  async restartSystem(): Promise<void> {
    await this.api.post('/system/restart');
  }

  async clearCache(): Promise<void> {
    await this.api.post('/system/clear-cache');
  }

  async runMaintenance(): Promise<{ message: string; details: any }> {
    const response = await this.api.post('/system/maintenance');
    return response.data;
  }

  async getSystemLogs(lines: number = 100): Promise<string[]> {
    const response = await this.api.get('/system/logs', {
      params: { lines },
    });
    return response.data;
  }

  // Notificaciones del sistema
  async sendSystemNotification(
    message: string,
    type: 'info' | 'warning' | 'error' | 'success',
    userIds?: string[]
  ): Promise<void> {
    await this.api.post('/notifications', {
      message,
      type,
      userIds,
    });
  }

  // Métricas y reportes
  async getPerformanceMetrics(
    startDate: string,
    endDate: string
  ): Promise<{
    responseTime: number[];
    throughput: number[];
    errorRate: number[];
    dates: string[];
  }> {
    const response = await this.api.get('/metrics/performance', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getUserActivityReport(
    startDate: string,
    endDate: string
  ): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    usersByRole: Record<string, number>;
    activityByDay: Array<{ date: string; count: number }>;
  }> {
    const response = await this.api.get('/reports/user-activity', {
      params: { startDate, endDate },
    });
    return response.data;
  }
}

export const systemService = new SystemService();
