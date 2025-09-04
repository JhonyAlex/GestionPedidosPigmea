import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Settings,
  Database,
  Activity,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, checkPermission } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      permission: 'dashboard.view'
    },
    {
      name: 'Usuarios Admin',
      icon: Users,
      path: '/users',
      permission: 'users.view'
    },
    {
      name: 'Usuarios Sistema',
      icon: UserCheck,
      path: '/main-users',
      permission: 'users.view' // Usar el mismo permiso por ahora
    },
    {
      name: 'Auditoría',
      icon: FileText,
      path: '/audit',
      permission: 'audit.view'
    },
    {
      name: 'Sistema',
      icon: Activity,
      path: '/system',
      permission: 'system.view'
    },
    {
      name: 'Base de Datos',
      icon: Database,
      path: '/database',
      permission: 'database.view'
    },
    {
      name: 'Configuración',
      icon: Settings,
      path: '/settings',
      permission: 'settings.view'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || checkPermission(item.permission)
  );

  return (
    <div className={`bg-admin-800 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-admin-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-admin-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-admin-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-admin-400 truncate">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-admin-300 hover:bg-admin-700 hover:text-white'
                  }`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-admin-700">
        <button
          onClick={logout}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-admin-300 hover:bg-admin-700 hover:text-white transition-colors w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
