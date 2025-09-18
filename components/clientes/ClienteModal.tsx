import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useCliente } from '../../contexts/ClienteContext';
import { Cliente } from '../../types/cliente';
import { ClienteFormSchema } from '../../schemas/clienteSchema';
import ClienteForm, { ClienteFormHandle } from './ClienteForm';

interface ClienteModalProps {
  cliente: Cliente | null; // null for creating, a client object for editing
  onClose: () => void;
  // We need access to setError from the form, which is tricky.
  // A better way is to pass the setError function from the form to the modal.
  // But for now, we will handle it inside the modal.
}

const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, onClose }) => {
  const { crearCliente, actualizarCliente } = useCliente();
  const [isSaving, setIsSaving] = useState(false);
  const formRef = React.useRef<ClienteFormHandle>(null);

  const isEditMode = !!cliente;

  const handleSave = async (data: ClienteFormSchema) => {
    setIsSaving(true);
    try {
      if (isEditMode && cliente) {
        await actualizarCliente?.(cliente.id, data);
      } else {
        await crearCliente?.(data);
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving client:", error);
      if (error.message.includes('Ya existe')) {
        if(formRef.current) {
          formRef.current.setError('nombre', {
            type: 'manual',
            message: error.message,
          });
        }
      }
      // Other errors are handled by the context's error handler
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {isEditMode ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Form is now a single unit controlled by react-hook-form */}
          <div className="p-6 overflow-y-auto">
            <ClienteForm
              ref={formRef}
              initialData={cliente}
              onSubmit={handleSave}
              isSaving={isSaving}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="cliente-form" // This ID should be on the <form> tag in ClienteForm
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClienteModal;
