import React, { useEffect, useState } from 'react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    duration?: number;
    pedidoId?: string;
    onNavigate?: () => void;
}

interface ToastProps {
    message: ToastMessage;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = message.duration || 5000;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(message.id), 300); // Tiempo para animación de salida
        }, duration);

        return () => clearTimeout(timer);
    }, [message, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(message.id), 300);
    };

    const handleNavigate = () => {
        if (message.onNavigate) {
            message.onNavigate();
            handleClose();
        }
    };

    const bgColorClass = {
        success: 'bg-green-500 dark:bg-green-600',
        info: 'bg-blue-500 dark:bg-blue-600',
        warning: 'bg-yellow-500 dark:bg-yellow-600',
        error: 'bg-red-500 dark:bg-red-600'
    }[message.type];

    const icon = {
        success: '✓',
        info: 'ℹ',
        warning: '⚠',
        error: '✕'
    }[message.type];

    return (
        <div
            className={`${bgColorClass} text-white rounded-lg shadow-xl p-4 mb-3 min-w-[300px] max-w-[500px] transform transition-all duration-300 ${
                isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl font-bold flex-shrink-0">{icon}</div>
                    <div className="flex-1">
                        <p className="text-sm font-medium leading-relaxed">{message.message}</p>
                        {message.onNavigate && (
                            <button
                                onClick={handleNavigate}
                                className="mt-2 text-xs font-semibold underline hover:no-underline"
                            >
                                Ver pedido →
                            </button>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 flex-shrink-0 transition-colors"
                    aria-label="Cerrar"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

interface ToastContainerProps {
    messages: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onClose }) => {
    return (
        <div className="fixed top-20 right-4 z-[9999] flex flex-col items-end pointer-events-none">
            {messages.map(message => (
                <div key={message.id} className="pointer-events-auto">
                    <Toast message={message} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};

export default Toast;
