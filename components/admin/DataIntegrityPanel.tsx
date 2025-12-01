import React, { useState } from 'react';

interface IntegrityCheckResults {
  pedidos_sin_cliente_id: { count: number; items: { id: string; cliente: string }[] };
  pedidos_con_cliente_id_invalido: { count: number; items: { id: string; cliente_id: string }[] };
  clientes_duplicados_cif: { count: number; items: { cif: string; count: number, ids: string[] }[] };
  clientes_duplicados_nombre: { count: number; items: { nombre: string; count: number, ids: string[] }[] };
}

const DataIntegrityPanel: React.FC = () => {
  const [results, setResults] = useState<IntegrityCheckResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixMessage, setFixMessage] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const getAuthHeaders = () => {
    const userString = localStorage.getItem('pigmea_user');
    const user = userString ? JSON.parse(userString) : null;
    if (!user) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'x-user-id': String(user.id),
      'x-user-role': user.role || 'OPERATOR'
    };
  };

  const checkIntegrity = async () => {
    setIsLoading(true);
    setError(null);
    setFixMessage(null);
    setResults(null);
    try {
      const response = await fetch(`${API_URL}/admin/data-integrity/run-checks`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('No tienes permiso para realizar esta acción o ha ocurrido un error.');
      }
      const data: IntegrityCheckResults = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar la integridad');
    } finally {
      setIsLoading(false);
    }
  };

  const fixMissingClientIds = async () => {
    setIsFixing(true);
    setError(null);
    setFixMessage(null);
    try {
      const response = await fetch(`${API_URL}/admin/data-integrity/fix-missing-client-ids`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('No se pudo ejecutar la reparación.');
      }
      const data = await response.json();
      setFixMessage(data.message || 'Reparación completada.');
      // Refresh the list after attempting a repair
      await checkIntegrity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reparar el problema');
    } finally {
      setIsFixing(false);
    }
  };

  const hasIssues = results && (
    results.pedidos_sin_cliente_id.count > 0 ||
    results.pedidos_con_cliente_id_invalido.count > 0 ||
    results.clientes_duplicados_cif.count > 0 ||
    results.clientes_duplicados_nombre.count > 0
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2 text-2xl">🛡️</span>
        Panel de Integridad de Datos
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Esta herramienta verifica la consistencia de los datos entre pedidos y clientes, y detecta duplicados.
      </p>

      <button
        onClick={checkIntegrity}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
        disabled={isLoading}
      >
        {isLoading ? 'Verificando...' : 'Verificar Integridad Ahora'}
      </button>

      {error && <div className="my-2 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      {fixMessage && <div className="my-2 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg">{fixMessage}</div>}

      {results && !isLoading && (
        <div className="space-y-4">
          {!hasIssues ? (
            <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-lg">
              <span className="text-2xl mr-3">✅</span>
              <span className="text-sm text-green-800 dark:text-green-200">¡Excelente! No se encontraron problemas de integridad.</span>
            </div>
          ) : (
            <>
              <IntegrityIssue
                title="Pedidos sin ID de Cliente"
                issue={results.pedidos_sin_cliente_id}
                actionButton={
                  <button
                    onClick={fixMissingClientIds}
                    disabled={isFixing}
                    className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 flex items-center disabled:bg-green-400"
                  >
                    <span className="mr-1">🔧</span>
                    {isFixing ? 'Reparando...' : 'Intentar Reparación Automática'}
                  </button>
                }
              />
              <IntegrityIssue title="Pedidos con ID de Cliente Inválido" issue={results.pedidos_con_cliente_id_invalido} />
              <IntegrityIssue title="Clientes Duplicados por CIF" issue={results.clientes_duplicados_cif} />
              <IntegrityIssue title="Clientes Duplicados por Nombre" issue={results.clientes_duplicados_nombre} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

const IntegrityIssue: React.FC<{ title: string; issue: { count: number; items: any[] }; actionButton?: React.ReactNode }> = ({ title, issue, actionButton }) => {
  if (issue.count === 0) return null;

  return (
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 rounded-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{title} ({issue.count} encontrados)</span>
        </div>
        {actionButton}
      </div>
      <div className="mt-2 pl-8 text-xs text-yellow-700 dark:text-yellow-300">
        <ul className="list-disc list-inside">
          {issue.items.slice(0, 5).map((item, index) => (
            <li key={index}>{JSON.stringify(item)}</li>
          ))}
          {issue.count > 5 && <li>...y {issue.count - 5} más.</li>}
        </ul>
      </div>
    </div>
  );
};

export default DataIntegrityPanel;
