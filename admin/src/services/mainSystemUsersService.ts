import { apiClient } from './apiClient';

// Tipos para usuarios del sistema principal
export interface MainSystemUser {
  id: string;
  username: string;
  role: string;
  displayName: string;
  created_at: string;
  last_login?: string;
  isActive: boolean;
}

export interface CreateMainUserRequest {
  username: string;
  password: string;
  role: string;
  displayName?: string;
}

export interface UpdateMainUserRequest {
  username?: string;
  role?: string;
  displayName?: string;
  isActive?: boolean;
}

export interface MainUsersStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  recentlyActive: number;
  newUsersThisMonth: number;
}

class MainSystemUsersService {
  // Obtener todos los usuarios del sistema principal
  async getAllMainUsers(): Promise<MainSystemUser[]> {
    const response = await apiClient.get('/main-users');
    return response.data;
  }

  // Obtener usuario del sistema principal por ID
  async getMainUserById(id: string): Promise<MainSystemUser> {
    const response = await apiClient.get(`/main-users/${id}`);
    return response.data;
  }

  // Crear nuevo usuario del sistema principal
  async createMainUser(userData: CreateMainUserRequest): Promise<MainSystemUser> {
    const response = await apiClient.post('/main-users', userData);
    return response.data;
  }

  // Actualizar usuario del sistema principal
  async updateMainUser(id: string, userData: UpdateMainUserRequest): Promise<MainSystemUser> {
    const response = await apiClient.put(`/main-users/${id}`, userData);
    return response.data;
  }

  // Eliminar usuario del sistema principal
  async deleteMainUser(id: string): Promise<void> {
    await apiClient.delete(`/main-users/${id}`);
  }

  // Resetear contraseña de usuario del sistema principal
  async resetMainUserPassword(id: string, newPassword: string): Promise<void> {
    await apiClient.post(`/main-users/${id}/reset-password`, { newPassword });
  }

  // Obtener estadísticas de usuarios del sistema principal
  async getMainUsersStats(): Promise<MainUsersStats> {
    const response = await apiClient.get('/main-users/stats');
    return response.data;
  }

  // Obtener roles disponibles para usuarios del sistema principal
  getAvailableRoles(): string[] {
    return ['Operador', 'Supervisor', 'Técnico', 'Jefe de Turno', 'Administrador'];
  }
}

export const mainSystemUsersService = new MainSystemUsersService();
