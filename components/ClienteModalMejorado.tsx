import React, { useState, useEffect } from 'react';
import { Cliente, ClienteCreateRequest, ClienteUpdateRequest } from '../hooks/useClientesManager';
import { Icons } from './Icons';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClienteCreateRequest | ClienteUpdateRequest, id?: string) => Promise<void>;
  cliente: Cliente | null;
}

type TabType = 'basicos' | 'contacto' | 'direccion' | 'observaciones';

const ClienteModalMejorado: React.FC<ClienteModalProps> = ({ isOpen, onClose, onSave, cliente }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basicos');
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: '',
    razon_social: '',
    cif: '',
    direccion: '',
    poblacion: '',
    codigo_postal: '',
    provincia: '',
    pais: 'España',
    telefono: '',
    email: '',
    persona_contacto: '',
    observaciones: '',
    estado: 'activo',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    } else {
      setFormData({
        nombre: '',
        razon_social: '',
        cif: '',
        direccion: '',
        poblacion: '',
        codigo_postal: '',
        provincia: '',
        pais: 'España',
        telefono: '',
        email: '',
        persona_contacto: '',
        observaciones: '',
        estado: 'activo',
      });
    }
    setActiveTab('basicos');
    setError(null);
    setValidationErrors({});
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    if (!formData.nombre || formData.nombre.trim() === '') {
      errors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.telefono || formData.telefono.trim() === '') {
      errors.telefono = 'El teléfono es obligatorio';
    }

    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    if (!formData.direccion || formData.direccion.trim() === '') {
      errors.direccion = 'La dirección es obligatoria';
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
      if (cliente) {
        // Update
        const updateData: ClienteUpdateRequest = {
            nombre: formData.nombre,
            razon_social: formData.razon_social,
            cif: formData.cif,
            direccion: formData.direccion,
            poblacion: formData.poblacion,
            codigo_postal: formData.codigo_postal,
            provincia: formData.provincia,
            pais: formData.pais,
            telefono: formData.telefono,
            email: formData.email,
            persona_contacto: formData.persona_contacto,
            observaciones: formData.observaciones,
        };
        await onSave(updateData, cliente.id);
      } else {
        // Create
        const createData: ClienteCreateRequest = {
            nombre: formData.nombre!,
            razon_social: formData.razon_social,
            cif: formData.cif!,
            direccion: formData.direccion!,
            poblacion: formData.poblacion,
            codigo_postal: formData.codigo_postal,
            provincia: formData.provincia,
            pais: formData.pais,
            telefono: formData.telefono!,
            email: formData.email!,
            persona_contacto: formData.persona_contacto,
            observaciones: formData.observaciones,
        };
        await onSave(createData);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || "Ocurrió un error al guardar el cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  const getTabClass = (tab: TabType) => {
    const baseClass = "px-6 py-3 font-medium transition-all duration-200 border-b-2";
    const activeClass = "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
    const inactiveClass = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300";
    
    return `${baseClass} ${activeTab === tab ? activeClass : inactiveClass}`;
  };

  const hasTabError = (tab: TabType): boolean => {
    switch (tab) {
      case 'basicos':
        return !!(validationErrors.nombre || validationErrors.cif);
      case 'contacto':
        return !!(validationErrors.telefono || validationErrors.email || validationErrors.persona_contacto);
      case 'direccion':
        return !!(validationErrors.direccion || validationErrors.poblacion || validationErrors.codigo_postal || validationErrors.provincia);
      default:
        return false;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basicos':
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Cliente <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="nombre" 
                id="nombre" 
                value={formData.nombre} 
                onChange={handleChange}
                className={`block w-full rounded-lg border-2 ${validationErrors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors`}
                placeholder="Ej: Empresa ABC S.L."
              />
              {validationErrors.nombre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.nombre}</p>
              )}
            </div>

            <div>
              <label htmlFor="razon_social" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Razón Social
              </label>
              <input 
                type="text" 
                name="razon_social" 
                id="razon_social" 
                value={formData.razon_social} 
                onChange={handleChange}
                className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                placeholder="Ej: ABC Empresa Sociedad Limitada"
              />
            </div>

            <div>
              <label htmlFor="cif" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                CIF/NIF
              </label>
              <input 
                type="text" 
                name="cif" 
                id="cif" 
                value={formData.cif} 
                onChange={handleChange}
                className={`block w-full rounded-lg border-2 ${validationErrors.cif ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors`}
                placeholder="Ej: B12345678"
              />
              {validationErrors.cif && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.cif}</p>
              )}
            </div>

            {cliente && (
              <div>
                <label htmlFor="estado" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select 
                  name="estado" 
                  id="estado" 
                  value={formData.estado} 
                  onChange={handleChange}
                  className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
            )}
          </div>
        );

      case 'contacto':
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="persona_contacto" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Persona de Contacto
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Contact className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="persona_contacto" 
                  id="persona_contacto" 
                  value={formData.persona_contacto} 
                  onChange={handleChange}
                  className="block w-full pl-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="tel" 
                  name="telefono" 
                  id="telefono" 
                  value={formData.telefono} 
                  onChange={handleChange}
                  className={`block w-full pl-10 rounded-lg border-2 ${validationErrors.telefono ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors`}
                  placeholder="Ej: +34 123 456 789"
                />
              </div>
              {validationErrors.telefono && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.telefono}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Email className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  className={`block w-full pl-10 rounded-lg border-2 ${validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors`}
                  placeholder="Ej: contacto@empresa.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
              )}
            </div>
          </div>
        );

      case 'direccion':
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="direccion" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Dirección <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <Icons.Location className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="direccion" 
                  id="direccion" 
                  value={formData.direccion} 
                  onChange={handleChange}
                  className={`block w-full pl-10 rounded-lg border-2 ${validationErrors.direccion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors`}
                  placeholder="Ej: Calle Principal 123, Piso 2"
                />
              </div>
              {validationErrors.direccion && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.direccion}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="codigo_postal" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Código Postal
                </label>
                <input 
                  type="text" 
                  name="codigo_postal" 
                  id="codigo_postal" 
                  value={formData.codigo_postal} 
                  onChange={handleChange}
                  className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                  placeholder="Ej: 28001"
                  maxLength={5}
                />
              </div>

              <div>
                <label htmlFor="poblacion" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Población
                </label>
                <input 
                  type="text" 
                  name="poblacion" 
                  id="poblacion" 
                  value={formData.poblacion} 
                  onChange={handleChange}
                  className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                  placeholder="Ej: Madrid"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="provincia" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Provincia
                </label>
                <input 
                  type="text" 
                  name="provincia" 
                  id="provincia" 
                  value={formData.provincia} 
                  onChange={handleChange}
                  className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                  placeholder="Ej: Madrid"
                />
              </div>

              <div>
                <label htmlFor="pais" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  País
                </label>
                <input 
                  type="text" 
                  name="pais" 
                  id="pais" 
                  value={formData.pais} 
                  onChange={handleChange}
                  className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors"
                  placeholder="Ej: España"
                />
              </div>
            </div>
          </div>
        );

      case 'observaciones':
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="observaciones" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Observaciones y Notas Internas
              </label>
              <textarea 
                name="observaciones" 
                id="observaciones" 
                value={formData.observaciones} 
                onChange={handleChange}
                rows={8}
                className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:text-sm dark:bg-gray-700 dark:text-white px-4 py-3 transition-colors resize-none"
                placeholder="Escribe aquí cualquier información adicional sobre el cliente..."
              ></textarea>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Esta información es solo para uso interno y no será visible para el cliente.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {cliente ? 'Actualiza la información del cliente' : 'Completa los datos del nuevo cliente'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Icons.Close className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('basicos')}
            className={getTabClass('basicos')}
          >
            <div className="flex items-center gap-2">
              Datos Básicos
              {hasTabError('basicos') && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('contacto')}
            className={getTabClass('contacto')}
          >
            <div className="flex items-center gap-2">
              Contacto
              {hasTabError('contacto') && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('direccion')}
            className={getTabClass('direccion')}
          >
            <div className="flex items-center gap-2">
              Dirección
              {hasTabError('direccion') && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('observaciones')}
            className={getTabClass('observaciones')}
          >
            Observaciones
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6">
          {renderTabContent()}

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="text-red-500">*</span> Campos obligatorios
          </p>
          <div className="flex space-x-3">
            <button 
              onClick={onClose} 
              type="button" 
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              type="submit" 
              disabled={isSaving} 
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border-2 border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed dark:disabled:bg-blue-800 transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar Cliente'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteModalMejorado;
