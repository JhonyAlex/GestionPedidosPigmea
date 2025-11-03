import React, { useState, useEffect } from 'react';
import { Vendedor, VendedorCreateRequest, VendedorUpdateRequest } from '../types/vendedor';
import { Icons } from './Icons';

interface VendedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VendedorCreateRequest | VendedorUpdateRequest, id?: string) => Promise<void>;
  vendedor: Vendedor | null;
  isEmbedded?: boolean; // ✅ Nueva prop para indicar que se llama desde otro modal
}

const VendedorModal: React.FC<VendedorModalProps> = ({ isOpen, onClose, onSave, vendedor, isEmbedded = false }) => {
  const [formData, setFormData] = useState<Partial<Vendedor>>({
    nombre: '',
    email: '',
    telefono: '',
    activo: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vendedor) {
      setFormData(vendedor);
    } else {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        activo: true,
      });
    }
    setError(null);
    setValidationErrors({});
  }, [vendedor, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
    
    // Limpiar error de validación cuando el usuario escribe
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Solo validar nombre obligatorio si NO está en modo embedded
    if (!isEmbedded && (!formData.nombre || formData.nombre.trim() === '')) {
      errors.nombre = 'El nombre es obligatorio';
    }

    // En modo embedded, al menos necesitamos el nombre
    if (isEmbedded && (!formData.nombre || formData.nombre.trim() === '')) {
      errors.nombre = 'El nombre es necesario para crear un vendedor';
    }

    if (formData.email && formData.email.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'El email no es válido';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError('Por favor, completa todos los campos obligatorios correctamente.');
      return;
    }

    setIsSaving(true);

    try {
      if (vendedor) {
        // Update
        const updateData: VendedorUpdateRequest = {
          nombre: formData.nombre,
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          activo: formData.activo,
        };
        await onSave(updateData, vendedor.id);
      } else {
        // Create
        const createData: VendedorCreateRequest = {
          nombre: formData.nombre!,
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          activo: formData.activo !== undefined ? formData.activo : true,
        };
        await onSave(createData);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || "Ocurrió un error al guardar el vendedor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">
              {vendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <Icons.Close className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Vendedor <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  id="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange}
                  className={`block w-full rounded-lg border-2 ${validationErrors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors`}
                  placeholder="Ej: Juan Pérez"
                />
                {validationErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.nombre}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  className={`block w-full rounded-lg border-2 ${validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors`}
                  placeholder="juan.perez@ejemplo.com"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <input 
                  type="tel" 
                  name="telefono" 
                  id="telefono" 
                  value={formData.telefono} 
                  onChange={handleChange}
                  className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                  placeholder="+34 600 000 000"
                />
              </div>

              {/* Estado (solo en edición) */}
              {vendedor && (
                <div>
                  <label htmlFor="activo" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select 
                    name="activo" 
                    id="activo" 
                    value={formData.activo ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.value === 'true' }))}
                    className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  'Guardando...'
                ) : (
                  <>
                    <Icons.Check className="-ml-1 mr-2 h-5 w-5" />
                    {vendedor ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendedorModal;
