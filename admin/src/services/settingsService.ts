import { apiClient } from './apiClient';
import { SystemConfig } from '../types/admin';

export const settingsService = {
  async getConfig(): Promise<SystemConfig> {
    const response = await apiClient.get('/settings/config');
    return response.data;
  },

  async updateConfig(config: SystemConfig): Promise<{ success: boolean }> {
    const response = await apiClient.put('/settings/config', config);
    return response.data;
  },

  async getEmailSettings(): Promise<{
    smtp_host: string;
    smtp_port: string;
    smtp_secure: boolean;
    smtp_user: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
  }> {
    const response = await apiClient.get('/settings/email');
    return response.data;
  },

  async updateEmailSettings(settings: {
    smtp_host: string;
    smtp_port: string;
    smtp_secure: boolean;
    smtp_user: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
  }): Promise<{ success: boolean }> {
    const response = await apiClient.put('/settings/email', settings);
    return response.data;
  },

  async testEmailConnection(settings: any): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post('/settings/email/test', settings);
    return response.data;
  },

  async exportConfig(): Promise<any> {
    const response = await apiClient.get('/settings/export');
    return response.data;
  },

  async importConfig(config: any): Promise<{ success: boolean }> {
    const response = await apiClient.post('/settings/import', config);
    return response.data;
  },

  async resetToDefaults(): Promise<{ success: boolean }> {
    const response = await apiClient.post('/settings/reset');
    return response.data;
  }
};
