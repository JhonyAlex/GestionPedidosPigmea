import React, { useState } from 'react';
import ActionHistoryPanel from './ActionHistoryPanel';
import { useUndoRedo } from '../hooks/useUndoRedo';

/**
 * Botón flotante para acceder al historial de acciones
 */
const ActionHistoryButton: React.FC = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const { state, undo, redo, isProcessing } = useUndoRedo();

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    return (
        <>
            {/* Botón flotante */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
                {/* Botones de Undo/Redo rápidos */}
                {!isPanelOpen && (
                    <div className="flex flex-col gap-2">
                        {/* Undo Button */}
                        {state.canUndo && (
                            <button
                                onClick={() => undo()}
                                disabled={isProcessing}
                                className="w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 
                                    active:scale-95 transition-all duration-200 flex items-center justify-center
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Deshacer (Ctrl+Z)"
                                aria-label="Deshacer última acción"
                            >
                                <span className="text-xl">⏪</span>
                            </button>
                        )}

                        {/* Redo Button */}
                        {state.canRedo && (
                            <button
                                onClick={() => redo()}
                                disabled={isProcessing}
                                className="w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 
                                    active:scale-95 transition-all duration-200 flex items-center justify-center
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Rehacer (Ctrl+Y)"
                                aria-label="Rehacer última acción"
                            >
                                <span className="text-xl">⏩</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Botón principal de historial */}
                <button
                    onClick={togglePanel}
                    className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 
                        flex items-center justify-center text-white relative
                        ${isPanelOpen 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                        }
                        active:scale-95`}
                    title={isPanelOpen ? 'Cerrar historial' : 'Ver historial de acciones'}
                    aria-label={isPanelOpen ? 'Cerrar historial' : 'Ver historial de acciones'}
                >
                    {isPanelOpen ? (
                        <span className="text-2xl">✕</span>
                    ) : (
                        <span className="text-2xl">📜</span>
                    )}
                    
                    {/* Badge con contador */}
                    {!isPanelOpen && state.historyCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                            text-xs font-bold flex items-center justify-center shadow-md">
                            {state.historyCount > 99 ? '99+' : state.historyCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Panel lateral */}
            {isPanelOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Overlay */}
                    <div 
                        className="absolute inset-0 bg-black bg-opacity-30 transition-opacity"
                        onClick={togglePanel}
                    />
                    
                    {/* Panel */}
                    <div className="relative w-full max-w-md animate-slide-in-right">
                        <ActionHistoryPanel onClose={togglePanel} />
                    </div>
                </div>
            )}

            {/* Animación de deslizamiento */}
            <style>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default ActionHistoryButton;
