import React, { useState } from 'react';
import { ShieldCheck, Wrench, AlertTriangle } from 'lucide-react';
import { clienteService } from '../../services/clienteService';
import { DataIntegrityIssue } from '../../types/cliente';

const DataIntegrityPanel: React.FC = () => {
  const [issues, setIssues] = useState<DataIntegrityIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIntegrity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await clienteService.checkDataIntegrity();
      setIssues(results.issues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar la integridad');
    } finally {
      setIsLoading(false);
    }
  };

  const repairIssue = async (issueId: string) => {
    try {
      await clienteService.repairDataIssue(issueId);
      // Refresh the list after attempting a repair
      await checkIntegrity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reparar el problema');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <ShieldCheck className="mr-2 text-blue-500" />
        Panel de Integridad de Datos de Clientes
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Esta herramienta verifica problemas comunes, como pedidos con referencias a clientes que han sido eliminados.
      </p>

      <button
        onClick={checkIntegrity}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
        disabled={isLoading}
      >
        {isLoading ? 'Verificando...' : 'Verificar Integridad Ahora'}
      </button>

      {error && <div className="my-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      <div className="space-y-3">
        {issues.length > 0 ? (
          issues.map(issue => (
            <div key={issue.id} className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">{issue.description}</span>
              </div>
              <button
                onClick={() => repairIssue(issue.id)}
                className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 flex items-center"
              >
                <Wrench className="mr-1 h-4 w-4" />
                Reparar
              </button>
            </div>
          ))
        ) : (
          !isLoading && <p className="text-gray-500 dark:text-gray-400">No se encontraron problemas de integridad.</p>
        )}
      </div>
    </div>
  );
};

export default DataIntegrityPanel;
