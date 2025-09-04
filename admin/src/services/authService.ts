import axios from 'axios';
import { User, AdminAuthResponse } from '../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class AuthService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Interceptor para agregar el token a las requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar respuestas
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string): Promise<AdminAuthResponse> {
    const response = await this.api.post('/api/admin/auth/login', {
      username,
      password,
    });
    return response.data;
  }

  async verifyToken(token: string): Promise<User> {
    const response = await this.api.get('/api/admin/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/admin/auth/logout');
    } catch (error) {
      // Ignorar errores de logout
    } finally {
      localStorage.removeItem('admin_token');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.put('/api/admin/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.api.post('/api/admin/auth/reset-password', { email });
  }
}

export const authService = new AuthService();
