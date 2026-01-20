import React from 'react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onUpdateDate: () => void;
  onUpdateMachine: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onCancel: () => void;
}

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
  </svg>
);

const MachineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ArchiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onUpdateDate,
  onUpdateMachine,
  onDelete,
  onArchive,
  onCancel,
}) => {
  if (selectedCount < 1) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-600 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Contador */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {selectedCount}
            </div>
            <span className="text-gray-700 dark:text-gray-200 font-medium">
              {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
          </div>

          {/* Separador */}
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUpdateDate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
              title="Cambiar Nueva Fecha de Entrega"
            >
              <CalendarIcon />
              <span className="hidden sm:inline">Cambiar Nueva Fecha de Entrega</span>
              <span className="sm:hidden">Fecha</span>
            </button>

            <button
              onClick={onUpdateMachine}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 font-medium"
              title="Cambiar Máquina de Impresión"
            >
              <MachineIcon />
              <span className="hidden sm:inline">Cambiar Máquina</span>
              <span className="sm:hidden">Máquina</span>
            </button>

            <button
              onClick={onArchive}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 font-medium"
              title="Archivar seleccionados"
            >
              <ArchiveIcon />
              <span className="hidden sm:inline">Archivar</span>
            </button>

            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
              title="Eliminar seleccionados"
            >
              <TrashIcon />
              <span className="hidden sm:inline">Eliminar</span>
            </button>

            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
              title="Cancelar selección"
            >
              <XMarkIcon />
              <span className="hidden sm:inline">Cancelar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
