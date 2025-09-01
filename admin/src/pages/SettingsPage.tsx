import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { SystemConfig } from '../types/admin';

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_secure: true,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const configData = await settingsService.getConfig();
      setConfig(configData);
      
      // Cargar configuraciones específicas
      const emailConfig = await settingsService.getEmailSettings();
      setEmailSettings(emailConfig);
      
      setError(null);
    } catch (err) {
      setError('Error al cargar configuración');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (key: string, value: any) => {
    if (!config) return;

    try {
      const updatedConfig = { ...config, [key]: value };
      setConfig(updatedConfig);
      setUnsavedChanges(true);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await settingsService.updateConfig(config);
      setUnsavedChanges(false);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailSettingsUpdate = async () => {
    try {
      setSaving(true);
      await settingsService.updateEmailSettings(emailSettings);
      alert('Configuración de email guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración de email:', error);
      alert('Error al guardar configuración de email');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const result = await settingsService.testEmailConnection(emailSettings);
      if (result.success) {
        alert('Conexión de email probada exitosamente');
      } else {
        alert(`Error probando email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error probando email:', error);
      alert('Error al probar conexión de email');
    }
  };

  const handleExportConfig = async () => {
    try {
      const configData = await settingsService.exportConfig();
      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando configuración:', error);
      alert('Error al exportar configuración');
    }
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const configData = JSON.parse(text);
      
      if (confirm('¿Importar esta configuración? Esto sobrescribirá la configuración actual.')) {
        await settingsService.importConfig(configData);
        loadSettings();
        alert('Configuración importada exitosamente');
      }
    } catch (error) {
      console.error('Error importando configuración:', error);
      alert('Error al importar configuración');
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleResetToDefaults = async () => {
    if (!confirm('¿Restablecer toda la configuración a los valores predeterminados? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await settingsService.resetToDefaults();
      loadSettings();
      alert('Configuración restablecida a valores predeterminados');
    } catch (error) {
      console.error('Error restableciendo configuración:', error);
      alert('Error al restablecer configuración');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-900">Configuración del Sistema</h1>
          <p className="text-admin-600">Gestión de configuraciones generales y específicas</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportConfig}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📤 Exportar
          </button>
          <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            📥 Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
            />
          </label>
          <button
            onClick={handleSaveConfig}
            disabled={!unsavedChanges || saving}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={loadSettings}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {unsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-lg">
          ⚠️ Tienes cambios sin guardar. No olvides guardar antes de salir.
        </div>
      )}

      {config && (
        <>
          {/* Configuración General */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Configuración General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Nombre de la Aplicación
                </label>
                <input
                  type="text"
                  value={config.app_name || ''}
                  onChange={(e) => handleConfigUpdate('app_name', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  URL Base
                </label>
                <input
                  type="url"
                  value={config.base_url || ''}
                  onChange={(e) => handleConfigUpdate('base_url', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Zona Horaria
                </label>
                <select
                  value={config.timezone || 'America/Mexico_City'}
                  onChange={(e) => handleConfigUpdate('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="America/Mexico_City">América/Ciudad de México</option>
                  <option value="America/New_York">América/Nueva York</option>
                  <option value="Europe/Madrid">Europa/Madrid</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Idioma
                </label>
                <select
                  value={config.default_language || 'es'}
                  onChange={(e) => handleConfigUpdate('default_language', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuración de Sesiones */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Configuración de Sesiones</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Duración de Sesión (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={config.session_timeout || 8}
                  onChange={(e) => handleConfigUpdate('session_timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Intentos de Login Máximos
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.max_login_attempts || 5}
                  onChange={(e) => handleConfigUpdate('max_login_attempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.require_password_change || false}
                  onChange={(e) => handleConfigUpdate('require_password_change', e.target.checked)}
                  className="rounded border-admin-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-admin-700">Requerir cambio de contraseña en primer login</span>
              </label>
            </div>
          </div>

          {/* Configuración de Email */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Configuración de Email</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  value={emailSettings.smtp_host}
                  onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Puerto SMTP
                </label>
                <input
                  type="number"
                  value={emailSettings.smtp_port}
                  onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Usuario SMTP
                </label>
                <input
                  type="text"
                  value={emailSettings.smtp_user}
                  onChange={(e) => setEmailSettings({...emailSettings, smtp_user: e.target.value})}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Contraseña SMTP
                </label>
                <input
                  type="password"
                  value={emailSettings.smtp_password}
                  onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Email de Envío
                </label>
                <input
                  type="email"
                  value={emailSettings.from_email}
                  onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Nombre de Envío
                </label>
                <input
                  type="text"
                  value={emailSettings.from_name}
                  onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.smtp_secure}
                  onChange={(e) => setEmailSettings({...emailSettings, smtp_secure: e.target.checked})}
                  className="rounded border-admin-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-admin-700">Usar conexión segura (SSL/TLS)</span>
              </label>
            </div>

            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleEmailSettingsUpdate}
                disabled={saving}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? '⏳ Guardando...' : '💾 Guardar Email'}
              </button>
              <button
                onClick={handleTestEmail}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📧 Probar Conexión
              </button>
            </div>
          </div>

          {/* Configuración de Backups */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Configuración de Backups</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Frecuencia de Backup Automático
                </label>
                <select
                  value={config.backup_frequency || 'daily'}
                  onChange={(e) => handleConfigUpdate('backup_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="hourly">Cada hora</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="disabled">Deshabilitado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Retener Backups (días)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={config.backup_retention_days || 30}
                  onChange={(e) => handleConfigUpdate('backup_retention_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Acciones de Configuración */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Acciones de Configuración</h3>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleResetToDefaults}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🔄 Restablecer a Predeterminados
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Nota:</strong> Algunos cambios pueden requerir reiniciar la aplicación para tomar efecto.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
