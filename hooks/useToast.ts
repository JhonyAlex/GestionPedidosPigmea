import { useState, useCallback } from 'react';
import { ToastMessage } from '../components/Toast';

let toastIdCounter = 0;

export const useToast = () => {
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    const addToast = useCallback((
        message: string, 
        type: ToastMessage['type'] = 'info', 
        options?: {
            duration?: number;
            pedidoId?: string;
            onNavigate?: () => void;
        }
    ) => {
        const id = `toast-${++toastIdCounter}`;
        const newMessage: ToastMessage = {
            id,
            message,
            type,
            duration: options?.duration,
            pedidoId: options?.pedidoId,
            onNavigate: options?.onNavigate
        };

        setMessages(prev => [...prev, newMessage]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        addToast,
        removeToast,
        clearAll
    };
};
