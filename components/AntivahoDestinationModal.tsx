import React from 'react';

interface AntivahoDestinationModalProps {
    isOpen: boolean;
    onSelectImpresion: () => void;
    onSelectListoProduccion: () => void;
    onCancel: () => void;
    pedido?: {
        numeroPedidoCliente: string;
    } | null;
}

const AntivahoDestinationModal: React.FC<AntivahoDestinationModalProps> = ({ 
    isOpen, 
    onSelectImpresion, 
    onSelectListoProduccion, 
    onCancel, 
    pedido 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    ¿A dónde enviar el pedido?
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    El antivaho del pedido <span className="font-semibold">{pedido?.numeroPedidoCliente}</span> ha sido completado.
                    <br /><br />
                    Selecciona el siguiente destino:
                </p>
                <div className="flex flex-col gap-3 mb-4">
                    <button
                        onClick={onSelectImpresion}
                        className="px-4 py-3 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Regresar a Impresión
                    </button>
                    <button
                        onClick={onSelectListoProduccion}
                        className="px-4 py-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mover a Listo a Producción
                    </button>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AntivahoDestinationModal;
