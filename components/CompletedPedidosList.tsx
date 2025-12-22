import React from 'react';
import { Pedido, UserRole, Etapa } from '../types';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { usePermissions } from '../hooks/usePermissions';
import { formatDateDDMMYYYY } from '../utils/date';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
const ArchiveBoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;

interface CompletedPedidosListProps {
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    highlightedPedidoId: string | null;
}

const CompletedPedidosList: React.FC<CompletedPedidosListProps> = ({ pedidos, onSelectPedido, onArchiveToggle, currentUserRole, highlightedPedidoId }) => {
    const { canArchivePedidos } = usePermissions();
    
    return (
        <div className="flex flex-col bg-gray-200 dark:bg-gray-800 rounded-xl shadow-lg h-full">
            <div className="bg-green-600 px-4 py-2 rounded-t-xl">
                <div className="flex justify-center items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Completado</h2>
                    <span className="bg-black bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pedidos.length}
                    </span>
                </div>
            </div>
            <div className="p-2 md:p-4 overflow-y-auto" style={{ minHeight: '150px' }}>
                {pedidos.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-300/50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-4 py-2">N° Pedido</th>
                                    <th scope="col" className="px-4 py-2">Cliente</th>
                                    <th scope="col" className="px-4 py-2">Nº Compra</th>
                                    <th scope="col" className="px-4 py-2">Camisa</th>
                                    <th scope="col" className="px-4 py-2">F. Entrega</th>
                                    <th scope="col" className="px-4 py-2">F. Finalización</th>
                                    <th scope="col" className="px-4 py-2 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <Droppable droppableId={Etapa.COMPLETADO}>
                                {(provided) => (
                                    <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                        {pedidos.map((pedido, index) => (
                                            <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <tr 
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`border-b border-gray-300 dark:border-gray-700 hover:bg-gray-300/50 dark:hover:bg-gray-900/50 ${snapshot.isDragging ? 'shadow-2xl' : ''} ${pedido.id === highlightedPedidoId ? 'card-highlight' : ''}`}
                                                    >
                                                        <th scope="row" className="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">{pedido.numeroPedidoCliente}</th>
                                                        <td className="px-4 py-2">{pedido.cliente}</td>
                                                        <td className="px-4 py-2">
                                                            {pedido.numerosCompra && pedido.numerosCompra.length > 0 ? (
                                                                pedido.numerosCompra.length === 1 ? (
                                                                    pedido.numerosCompra[0]
                                                                ) : (
                                                                    <div className="flex flex-col gap-0.5">
                                                                        {pedido.numerosCompra.map((numero, index) => (
                                                                            numero && (
                                                                                <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">
                                                                                    #{index + 1}: {numero}
                                                                                </span>
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                )
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-4 py-2">{pedido.camisa || '-'}</td>
                                                        <td className="px-4 py-2">{formatDateDDMMYYYY(pedido.fechaEntrega)}</td>
                                                        <td className="px-4 py-2">{pedido.fechaFinalizacion ? formatDateDDMMYYYY(pedido.fechaFinalizacion) : 'N/A'}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <div className="flex justify-center items-center space-x-3">
                                                                <button onClick={() => onSelectPedido(pedido)} className="text-blue-500 hover:text-blue-400" title="Ver/Editar">
                                                                    <EditIcon />
                                                                </button>
                                                                {canArchivePedidos() && pedido.etapaActual === Etapa.COMPLETADO && (
                                                                    <button onClick={() => onArchiveToggle(pedido)} className="text-yellow-500 hover:text-yellow-400" title="Archivar">
                                                                        <ArchiveBoxIcon />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </tbody>
                                )}
                            </Droppable>
                        </table>
                    </div>
                ) : (
                    <Droppable droppableId={Etapa.COMPLETADO}>
                        {(provided, snapshot) => (
                             <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps}
                                className={`flex items-center justify-center h-full text-sm text-gray-500 p-4 rounded-b-xl ${snapshot.isDraggingOver ? 'bg-gray-300 dark:bg-gray-700' : ''}`}
                            >
                                No hay pedidos completados. Arrastre un pedido aquí para marcarlo como completado.
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                )}
            </div>
        </div>
    );
};

export default CompletedPedidosList;