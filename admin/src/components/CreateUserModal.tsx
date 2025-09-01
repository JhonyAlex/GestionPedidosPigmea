import React, { useState } from 'react';
import { UserRole, Permission, CreateUserRequest } from '../types/admin';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: CreateUserRequest) => void;
  permissions: Permission[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  permissions
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.VIEWER,
    password: '',
    permissions: []
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: UserRole.VIEWER,
      password: '',
      permissions: []
    });
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-admin-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-admin-900">Crear Nuevo Usuario</h2>
            <button
              onClick={handleClose}
              className="text-admin-400 hover:text-admin-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Nombre de usuario *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.username ? 'border-red-300' : 'border-admin-300'
                }`}
                placeholder="usuario123"
              />
              {errors.username && (
                <p className="text-red-600 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-admin-300'
                }`}
                placeholder="usuario@ejemplo.com"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-admin-300'
                }`}
                placeholder="Juan"
              />
              {errors.firstName && (
                <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-admin-300'
                }`}
                placeholder="Pérez"
              />
              {errors.lastName && (
                <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-1">
              Rol *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={UserRole.VIEWER}>Visor - Solo lectura</option>
              <option value={UserRole.OPERATOR}>Operador - Gestión de pedidos</option>
              <option value={UserRole.SUPERVISOR}>Supervisor - Gestión completa</option>
              <option value={UserRole.ADMIN}>Administrador - Control total</option>
            </select>
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-admin-300'
                }`}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-700 mb-1">
                Confirmar contraseña *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-300' : 'border-admin-300'
                }`}
                placeholder="Repetir contraseña"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
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
                    checked={formData.permissions.includes(permission.id)}
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
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
