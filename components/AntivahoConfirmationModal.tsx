import React from 'react';

interface AntivahoConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const AntivahoConfirmationModal: React.FC<AntivahoConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmación de Antivaho</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">¿Se ha realizado el proceso de antivaho para este pedido?</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                    >
                        Sí, continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AntivahoConfirmationModal;
