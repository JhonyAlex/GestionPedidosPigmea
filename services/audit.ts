import { AuditEntry } from '../types';

const API_BASE = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:8080';

// Helper para obtener headers de autenticación desde localStorage
const getAuthHeaders = (): Record<string, string> => {
    if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('pigmea_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                return {
                    'Content-Type': 'application/json',
                    'x-user-id': String(user.id),
                    'x-user-role': user.role || 'OPERATOR'
                };
            } catch (error) {
                console.warn('Error parsing user from localStorage:', error);
            }
        }
    }
    return { 'Content-Type': 'application/json' };
};

export class AuditService {
    private static instance: AuditService;

    static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    async getAuditLog(limit: number = 100): Promise<AuditEntry[]> {
        try {
            const response = await fetch(`${API_BASE}/api/audit?limit=${limit}`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo log de auditoría:', error);
            return [];
        }
    }

    async logAction(userRole: string, action: string, pedidoId?: string, details?: any): Promise<void> {
        try {
            const response = await fetch(`${API_BASE}/api/audit`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    userRole,
                    action,
                    pedidoId,
                    details
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error registrando acción de auditoría:', error);
            // No lanzamos el error para que no afecte la operación principal
        }
    }
}

export const auditService = AuditService.getInstance();
