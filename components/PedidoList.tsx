import React from 'react';
import { Pedido, Etapa, UserRole } from '../types';
import { ETAPAS, PRIORIDAD_COLORS } from '../constants';

interface PedidoListProps {
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    isArchivedView: boolean;
    currentUserRole: UserRole;
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const ArchiveBoxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
);

const UnarchiveBoxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);


const PedidoList: React.FC<PedidoListProps> = ({ pedidos, onSelectPedido, onArchiveToggle, isArchivedView, currentUserRole }) => {
    return (
        <main className="flex-grow p-4 md:p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">N° Pedido</th>
                                <th scope="col" className="px-6 py-3">Cliente</th>
                                <th scope="col" className="px-6 py-3">Desarrollo</th>
                                <th scope="col" className="px-6 py-3 text-center">Capa</th>
                                <th scope="col" className="px-6 py-3">Prioridad</th>
                                <th scope="col" className="px-6 py-3">Etapa Actual</th>
                                <th scope="col" className="px-6 py-3 text-right">Metros</th>
                                <th scope="col" className="px-6 py-3 text-center">T. Planificado</th>
                                <th scope="col" className="px-6 py-3 text-center">F. Entrega</th>
                                <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-10 text-gray-500">
                                        No se encontraron pedidos.
                                    </td>
                                </tr>
                            ) : (
                                pedidos.map((pedido) => (
                                <tr key={pedido.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{pedido.numeroPedido}</th>
                                    <td className="px-6 py-4">{pedido.cliente}</td>
                                    <td className="px-6 py-4">{pedido.desarrollo}</td>
                                    <td className="px-6 py-4 text-center">{pedido.capa}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${PRIORIDAD_COLORS[pedido.prioridad].replace('border', 'bg').replace('-500', '-900')}`}>
                                            {pedido.prioridad}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{ETAPAS[pedido.etapaActual].title}</td>
                                    <td className="px-6 py-4 text-right">{pedido.metros} m</td>
                                    <td className="px-6 py-4 text-center">{pedido.tiempoProduccionPlanificado}</td>
                                    <td className="px-6 py-4 text-center">{pedido.fechaEntrega}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center space-x-3">
                                            <button onClick={() => onSelectPedido(pedido)} className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300" title="Ver/Editar">
                                                <EditIcon />
                                            </button>
                                            {currentUserRole === 'Administrador' && (
                                                <>
                                                    {isArchivedView ? (
                                                        <button onClick={() => onArchiveToggle(pedido)} className="text-green-500 hover:text-green-400 dark:text-green-400 dark:hover:text-green-300" title="Desarchivar">
                                                            <UnarchiveBoxIcon />
                                                        </button>
                                                    ) : (
                                                        pedido.etapaActual === Etapa.COMPLETADO && (
                                                            <button onClick={() => onArchiveToggle(pedido)} className="text-yellow-500 hover:text-yellow-400 dark:text-yellow-400 dark:hover:text-yellow-300" title="Archivar">
                                                                <ArchiveBoxIcon />
                                                            </button>
                                                        )
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default PedidoList;