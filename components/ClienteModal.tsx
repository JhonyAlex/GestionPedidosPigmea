import React, { useState, useEffect } from 'react';
import { Cliente, ClienteCreateRequest, ClienteUpdateRequest } from '../hooks/useClientesManager';
import { Icons } from './Icons';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClienteCreateRequest | ClienteUpdateRequest, id?: string) => Promise<void>;
  cliente: Cliente | null;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ isOpen, onClose, onSave, cliente }) => {
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
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    // Basic validation
    if (!formData.nombre) {
        setError("El nombre es un campo obligatorio.");
        setIsSaving(false);
        return;
    }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <Icons.Close className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
                <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" required />
              </div>
              <div>
                <label htmlFor="razon_social" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Razón Social</label>
                <input type="text" name="razon_social" id="razon_social" value={formData.razon_social} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="cif" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CIF</label>
                <input type="text" name="cif" id="cif" value={formData.cif} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="persona_contacto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</label>
                <input type="text" name="persona_contacto" id="persona_contacto" value={formData.persona_contacto} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                <input type="tel" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                <input type="text" name="direccion" id="direccion" value={formData.direccion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="poblacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Población</label>
                    <input type="text" name="poblacion" id="poblacion" value={formData.poblacion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="codigo_postal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">C. Postal</label>
                    <input type="text" name="codigo_postal" id="codigo_postal" value={formData.codigo_postal} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provincia</label>
                    <input type="text" name="provincia" id="provincia" value={formData.provincia} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="pais" className="block text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
                    <input type="text" name="pais" id="pais" value={formData.pais} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                  </div>
              </div>
              <div>
                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                <textarea name="observaciones" id="observaciones" value={formData.observaciones} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"></textarea>
              </div>
              {cliente && (
                <div>
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                  <select name="estado" id="estado" value={formData.estado} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="archivado">Archivado</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-4 text-center p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
                {error}
            </div>
          )}
        </form>

        <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
            Cancelar
          </button>
          <button onClick={handleSubmit} type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClienteModal;
