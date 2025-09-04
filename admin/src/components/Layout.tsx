import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('🔍 Layout - Estado auth:', { isAuthenticated, isLoading, hasUser: !!user });

  if (isLoading) {
    console.log('⏳ Layout - Mostrando loading...');
    return (
      <div className="min-h-screen bg-admin-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 Layout - No autenticado, redirigiendo a login...');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Layout - Usuario autenticado, mostrando dashboard...');

  return (
    <div className="min-h-screen bg-admin-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
