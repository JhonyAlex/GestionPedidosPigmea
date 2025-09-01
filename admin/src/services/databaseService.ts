import { apiClient } from './apiClient';
import { DatabaseBackup, DatabaseStats } from '../types/admin';

export const databaseService = {
  async getBackups(): Promise<DatabaseBackup[]> {
    const response = await apiClient.get('/database/backups');
    return response.data;
  },

  async getStats(): Promise<DatabaseStats> {
    const response = await apiClient.get('/database/stats');
    return response.data;
  },

  async createBackup(data: { name: string; description?: string }): Promise<DatabaseBackup> {
    const response = await apiClient.post('/database/backups', data);
    return response.data;
  },

  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/database/backups/${backupId}/restore`);
    return response.data;
  },

  async deleteBackup(backupId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/database/backups/${backupId}`);
    return response.data;
  },

  async optimizeDatabase(): Promise<{ 
    tablesOptimized: number; 
    timeTaken: number; 
    spaceFreed: number 
  }> {
    const response = await apiClient.post('/database/optimize');
    return response.data;
  },

  async cleanupOldData(): Promise<{ deletedRecords: number }> {
    const response = await apiClient.post('/database/cleanup');
    return response.data;
  }
};
