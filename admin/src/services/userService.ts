import axios from 'axios';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  Permission,
  UserActivity
} from '../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class UserService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/admin`,
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

  async getAllUsers(): Promise<User[]> {
    const response = await this.api.get('/users');
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await this.api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  async activateUser(id: string): Promise<User> {
    const response = await this.api.patch(`/users/${id}/activate`);
    return response.data;
  }

  async deactivateUser(id: string): Promise<User> {
    const response = await this.api.patch(`/users/${id}/deactivate`);
    return response.data;
  }

  async resetUserPassword(id: string): Promise<{ temporaryPassword: string }> {
    const response = await this.api.post(`/users/${id}/reset-password`);
    return response.data;
  }

  async getUserActivity(): Promise<UserActivity[]> {
    const response = await this.api.get('/users/activity');
    return response.data;
  }

  async getUserRoles(): Promise<UserRole[]> {
    return Object.values(UserRole);
  }

  async getAvailablePermissions(): Promise<Permission[]> {
    const response = await this.api.get('/permissions');
    return response.data;
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await this.api.delete('/users/bulk', { data: { userIds } });
  }

  async exportUsers(): Promise<Blob> {
    const response = await this.api.get('/users/export', {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const userService = new UserService();
