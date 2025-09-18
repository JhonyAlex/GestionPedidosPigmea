import { auditService } from '../services/audit';
import { useAuth } from '../contexts/AuthContext';

// This is a placeholder. In a real app, this would be a more robust toast system.
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    console.log(`[${type.toUpperCase()}] Toast: ${message}`);
};

// Custom hook for handling API errors consistently
export const useErrorHandler = () => {
  const { user } = useAuth();

  const handleApiError = (error: any, context: string): 'duplicate' | 'generic' => {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    console.error(`Error en ${context}:`, error);

    // Log generic error to audit trail
    auditService.logAction(
      user?.displayName || 'Sistema',
      `Error en ${context}: ${errorMessage}`
    );

    // Determine error type for UI feedback
    if (errorMessage.includes('NetworkError')) {
      showToast('Error de conexión. Verifique su internet.', 'error');
    } else if (errorMessage.includes('403')) {
      showToast('No tiene permisos para esta acción.', 'error');
    } else if (errorMessage.includes('unique') || errorMessage.includes('ya existe')) {
      // Return a specific type for duplicate errors to be handled by the form
      return 'duplicate';
    } else {
      showToast(`Error: ${errorMessage}`, 'error');
    }

    return 'generic';
  };

  return { handleApiError };
};

// Centralized logger object
export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CLIENTES DEBUG] ${message}`, data);
    }
  },

  error: (message: string, error?: any, context?: string) => {
    console.error(`[CLIENTES ERROR] ${message}`, { error, context });
    // In a real production app, this would integrate with a logging service like Sentry or LogRocket.
  },

  audit: (user: any, action: string, clienteId?: string, details?: Record<string, any>) => {
    const username = user?.displayName || user?.username || 'Sistema';
    auditService.logAction(
      username,
      `[CLIENTES] ${action}`,
      clienteId,
      details ? { details } : undefined
    );
  }
};
