import React, { useState, useEffect } from 'react';
import { UserRole, Permission, User, UpdateUserRequest } from '../types/admin';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UpdateUserRequest) => void;
  user: User | null;
  permissions: Permission[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  permissions
}) => {
  const [formData, setFormData] = useState<UpdateUserRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions.map(p => p.id)
      });
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (formData.firstName && !formData.firstName.trim()) {
      newErrors.firstName = 'El nombre no puede estar vacío';
    }

    if (formData.lastName && !formData.lastName.trim()) {
      newErrors.lastName = 'El apellido no puede estar vacío';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onClose();
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permissionId]
        : (prev.permissions || []).filter(id => id !== permissionId)
    }));
  };

  const getRolePermissions = (role: UserRole) => {
    const rolePermissions = {
      [UserRole.ADMIN]: permissions.map(p => p.id),
      [UserRole.SUPERVISOR]: permissions.filter(p => p.module !== 'system').map(p => p.id),
      [UserRole.OPERATOR]: permissions.filter(p => ['orders', 'view'].includes(p.module)).map(p => p.id),
      [UserRole.VIEWER]: permissions.filter(p => p.module === 'view').map(p => p.id)
    };
    
    return rolePermissions[role] || [];
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: getRolePermissions(role)
    }));
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-admin-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-admin-900">
              Editar Usuario: {user.username}
            </h2>
            <button
              onClick={handleClose}
              className="text-admin-400 hover:text-admin-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Información de solo lectura */}
          <div className="bg-admin-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-admin-700">Usuario:</span>
                <span className="ml-2 text-admin-900">@{user.username}</span>
              </div>
              <div>
                <span className="font-medium text-admin-700">Creado:</span>
                <span className="ml-2 text-admin-900">
                  {new Date(user.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div>
                <span className="font-medium text-admin-700">Último login:</span>
                <span className="ml-2 text-admin-900">
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString('es-ES')
                    : 'Nunca'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Información editable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-admin-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-admin-300'
                }`}
              />
              {errors.firstName && (
                <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-admin-300'
                }`}
              />
              {errors.lastName && (
                <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Rol
              </label>
              <select
                value={formData.role || user.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={user.role === UserRole.ADMIN} // No permitir cambiar rol de admin
              >
                <option value={UserRole.VIEWER}>Visor - Solo lectura</option>
                <option value={UserRole.OPERATOR}>Operador - Gestión de pedidos</option>
                <option value={UserRole.SUPERVISOR}>Supervisor - Gestión completa</option>
                <option value={UserRole.ADMIN}>Administrador - Control total</option>
              </select>
              {user.role === UserRole.ADMIN && (
                <p className="text-xs text-yellow-600 mt-1">
                  No se puede cambiar el rol de un administrador
                </p>
              )}
            </div>
          </div>

          {/* Estado activo */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive ?? user.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-admin-300 text-primary-600 focus:ring-primary-500"
                disabled={user.role === UserRole.ADMIN} // No permitir desactivar admin
              />
              <span className="ml-2 text-sm text-admin-700">Usuario activo</span>
            </label>
            {user.role === UserRole.ADMIN && (
              <p className="text-xs text-yellow-600 mt-1">
                No se puede desactivar un administrador
              </p>
            )}
          </div>

          {/* Permisos */}
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">
              Permisos específicos
            </label>
            <div className="max-h-40 overflow-y-auto border border-admin-200 rounded-lg p-3">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={(formData.permissions || []).includes(permission.id)}
                    onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                    className="rounded border-admin-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-admin-700">
                    {permission.name}
                    <span className="text-admin-500 ml-1">({permission.module})</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-admin-500 mt-1">
              Los permisos se ajustan automáticamente según el rol seleccionado
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-admin-700 bg-admin-100 rounded-lg hover:bg-admin-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
