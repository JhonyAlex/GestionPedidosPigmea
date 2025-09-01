import { AuditEntry } from '../types';

const API_BASE = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:8080';

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
            const response = await fetch(`${API_BASE}/api/audit?limit=${limit}`);
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
                headers: {
                    'Content-Type': 'application/json',
                },
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
