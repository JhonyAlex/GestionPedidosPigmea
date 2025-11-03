import React, { useState, useEffect } from 'react';
import { Pedido, Prioridad, TipoImpresion, Etapa, EstadoCliché } from '../types';
import { KANBAN_FUNNELS, ETAPAS } from '../constants';
import SequenceBuilder from './SequenceBuilder';
import SeccionDatosTecnicosDeMaterial from './SeccionDatosTecnicosDeMaterial';
import { useClientesManager, ClienteCreateRequest } from '../hooks/useClientesManager';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
import { VendedorCreateRequest } from '../types/vendedor';
import ClienteModalMejorado from './ClienteModalMejorado';
import VendedorModal from './VendedorModal';

interface AddPedidoModalProps {
    onClose: () => void;
    onAdd: (data: {
        pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'etapaActual' | 'subEtapaActual' | 'maquinaImpresion' | 'secuenciaTrabajo' | 'orden' | 'historial'>;
        secuenciaTrabajo: Etapa[];
    }) => void;
    clientePreseleccionado?: { id: string; nombre: string } | null; // ✅ Permitir cliente preseleccionado
}

const initialFormData = {
    cliente: '',
    clienteId: '',  // ✅ Agregar clienteId
    numeroPedidoCliente: '',
    metros: '',
    fechaEntrega: '',
    nuevaFechaEntrega: '',
    vendedorId: '',  // ✅ Cambiar vendedor a vendedorId
    vendedorNombre: '',  // ✅ Agregar vendedorNombre para mostrar
    prioridad: Prioridad.NORMAL,
    tipoImpresion: TipoImpresion.SUPERFICIE,
    desarrollo: '',
    capa: '',
    tiempoProduccionPlanificado: '00:00',
    observaciones: '',
    materialDisponible: false,
    clicheDisponible: false,
    estadoCliché: EstadoCliché.PENDIENTE_CLIENTE,
    clicheInfoAdicional: '',
    compraCliche: '',
    recepcionCliche: '',
    camisa: '',
    antivaho: false,
    microperforado: false,
    macroperforado: false,
    anonimo: false,
    anonimoPostImpresion: '',
    // Nuevos campos
    producto: null,
    materialCapasCantidad: null,
    materialCapas: null,
    materialConsumoCantidad: null,
    materialConsumo: null,
    bobinaMadre: null,
    bobinaFinal: null,
    minAdap: null,
    colores: null,
    minColor: null,
};

const AddPedidoModal: React.FC<AddPedidoModalProps> = ({ onClose, onAdd, clientePreseleccionado }) => {
    const [formData, setFormData] = useState<any>(initialFormData);
    const [secuenciaTrabajo, setSecuenciaTrabajo] = useState<Etapa[]>([]);
    const { clientes, addCliente, fetchClientes } = useClientesManager();
    const { vendedores, addVendedor, fetchVendedores } = useVendedoresManager();
    const [isClienteModalOpen, setClienteModalOpen] = useState(false);
    const [isVendedorModalOpen, setVendedorModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'detalles' | 'gestion'>('detalles');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        fetchClientes();
        fetchVendedores();
    }, []);

    // ✅ Efecto para preseleccionar cliente cuando se proporciona
    useEffect(() => {
        if (clientePreseleccionado) {
            setFormData(prev => ({
                ...prev,
                cliente: clientePreseleccionado.nombre,
                clienteId: clientePreseleccionado.id
            }));
        }
    }, [clientePreseleccionado]);

    // Efecto para controlar el scroll del body
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    // Manejar tecla Escape
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    // Función para validar el formulario
    const validateForm = (): boolean => {
        const errors: string[] = [];

        // Validaciones obligatorias
        if (!formData.cliente.trim()) {
            errors.push('❌ Debe seleccionar un cliente');
        }
        if (!formData.numeroPedidoCliente.trim()) {
            errors.push('❌ Debe ingresar el número de pedido del cliente');
        }
        if (!formData.fechaEntrega) {
            errors.push('❌ Debe especificar la fecha de entrega');
        }
        
        const metrosValue = Number(formData.metros);
        if (!formData.metros || isNaN(metrosValue) || metrosValue <= 0) {
            errors.push('❌ Los metros deben ser un número mayor a 0');
        }

        // Validación de tiempo de producción (solo si no es anónimo)
        if (!formData.anonimo) {
            const timePattern = /^[0-9]{1,2}:[0-9]{2}$/;
            if (!formData.tiempoProduccionPlanificado || !timePattern.test(formData.tiempoProduccionPlanificado)) {
                errors.push('⚠️ El tiempo de producción debe estar en formato HH:mm');
            }
        }

        // Validación para anónimos
        if (formData.anonimo && !formData.anonimoPostImpresion) {
            errors.push('⚠️ Debe seleccionar una opción de Post-Impresión para pedidos anónimos');
        }

        // Validación de secuencia de trabajo para antivaho
        if (formData.antivaho && secuenciaTrabajo.length === 0) {
            errors.push('⚠️ Debe definir la secuencia de trabajo para pedidos con Antivaho');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleDataChange = (field: keyof Pedido, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (name === "cliente" && value === "add_new_cliente") {
            setClienteModalOpen(true);
        } else if (name === "cliente" && value !== "add_new_cliente") {
            // ✅ Cuando se selecciona un cliente, guardar tanto el nombre como el ID
            const clienteSeleccionado = clientes.find(c => c.nombre === value);
            setFormData(prev => ({ 
                ...prev, 
                cliente: value,
                clienteId: clienteSeleccionado?.id || '' 
            }));
        } else if (name === "vendedorId" && value === "add_new_vendedor") {
            setVendedorModalOpen(true);
            setFormData(prev => ({ ...prev, vendedorId: '', vendedorNombre: '' }));
        } else if (name === "vendedorId" && value !== "add_new_vendedor") {
            // Cuando se selecciona un vendedor, guardar tanto el ID como el nombre
            const vendedorSeleccionado = vendedores.find(v => v.id === value);
            setFormData(prev => ({ 
                ...prev, 
                vendedorId: value,
                vendedorNombre: vendedorSeleccionado?.nombre || '' 
            }));
        } else if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            const valueToSet = type === 'number' ? parseInt(value, 10) || 0 : value;
            setFormData(prev => ({ ...prev, [name]: valueToSet }));
        }
    };

    const handleSaveCliente = async (clienteData: ClienteCreateRequest) => {
        try {
            const nuevoCliente = await addCliente(clienteData);
            // ✅ Guardar tanto el nombre como el ID del nuevo cliente
            setFormData(prev => ({ 
                ...prev, 
                cliente: nuevoCliente.nombre,
                clienteId: nuevoCliente.id 
            }));
            setClienteModalOpen(false);
        } catch (error) {
            console.error("Error al crear cliente:", error);
        }
    };

    const handleSaveVendedor = async (vendedorData: VendedorCreateRequest) => {
        try {
            const nuevoVendedor = await addVendedor(vendedorData);
            setFormData(prev => ({ 
                ...prev, 
                vendedorId: nuevoVendedor.id,
                vendedorNombre: nuevoVendedor.nombre 
            }));
            setVendedorModalOpen(false);
        } catch (error) {
            console.error("Error al crear vendedor:", error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar formulario
        if (!validateForm()) {
            // Mostrar errores en un alert
            alert(
                '⚠️ No se puede crear el pedido\n\n' +
                'Por favor, corrija los siguientes errores:\n\n' +
                validationErrors.join('\n')
            );
            return;
        }

        const metrosValue = Number(formData.metros);
        onAdd({ pedidoData: { ...formData, metros: metrosValue }, secuenciaTrabajo });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-8 pb-4 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold">Crear Nuevo Pedido</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {validationErrors.length > 0 && (
                    <div className="mx-8 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">⚠️ Errores de validación:</h4>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                            {validationErrors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-8">
                    <button 
                        onClick={() => setActiveTab('detalles')} 
                        className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${
                            activeTab === 'detalles' 
                                ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        📋 Detalles del Pedido
                    </button>
                    <button 
                        onClick={() => setActiveTab('gestion')} 
                        className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${
                            activeTab === 'gestion' 
                                ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        ⚙️ Gestión y Preparación
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-8">
                    <form onSubmit={handleSubmit} id="addPedidoForm">
                        {activeTab === 'detalles' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Columna Izquierda */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Cliente <span className="text-red-500">*</span>
                                                {clientePreseleccionado && <span className="ml-2 text-green-600 dark:text-green-400">(Preseleccionado)</span>}
                                            </label>
                                            <select 
                                                name="cliente" 
                                                value={formData.cliente} 
                                                onChange={handleChange} 
                                                disabled={!!clientePreseleccionado}
                                                className={`w-full border rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                                    clientePreseleccionado 
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-gray-700 dark:text-gray-300 cursor-not-allowed' 
                                                        : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                                                }`}
                                                required
                                            >
                                                <option value="">Seleccione un cliente</option>
                                                {clientes.map(cliente => (
                                                    <option key={cliente.id} value={cliente.nombre}>{cliente.nombre}</option>
                                                ))}
                                                <option value="add_new_cliente">-- Crear nuevo cliente --</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Número de Pedido Cliente <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                name="numeroPedidoCliente" 
                                                value={formData.numeroPedidoCliente} 
                                                onChange={handleChange} 
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" 
                                                placeholder="Ej: PED-2024-001"
                                                required 
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Desarrollo</label>
                                                <input 
                                                    type="text" 
                                                    name="desarrollo" 
                                                    value={formData.desarrollo} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                                    placeholder="Desarrollo"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Capa</label>
                                                <input 
                                                    type="text" 
                                                    name="capa" 
                                                    value={formData.capa} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" 
                                                    placeholder="Número o texto"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tipo de Impresión</label>
                                            <select 
                                                name="tipoImpresion" 
                                                value={formData.tipoImpresion} 
                                                onChange={handleChange} 
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                            >
                                                {Object.values(TipoImpresion).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 space-y-2">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Características del Pedido</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="antivaho" 
                                                        name="antivaho" 
                                                        checked={formData.antivaho} 
                                                        onChange={handleChange} 
                                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                    />
                                                    <label htmlFor="antivaho" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Antivaho</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="microperforado" 
                                                        name="microperforado" 
                                                        checked={formData.microperforado} 
                                                        onChange={handleChange} 
                                                        className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                                                    />
                                                    <label htmlFor="microperforado" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Microperforado</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="macroperforado" 
                                                        name="macroperforado" 
                                                        checked={formData.macroperforado} 
                                                        onChange={handleChange} 
                                                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" 
                                                    />
                                                    <label htmlFor="macroperforado" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Macroperforado</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="anonimo" 
                                                        name="anonimo" 
                                                        checked={formData.anonimo} 
                                                        onChange={handleChange} 
                                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                    />
                                                    <label htmlFor="anonimo" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Anónimo</label>
                                                </div>
                                            </div>

                                            {/* Select de Post-Impresión para Anónimos */}
                                            {formData.anonimo && (
                                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                                                    <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        📦 Post-Impresión (Anónimo) <span className="text-red-500">*</span>
                                                    </label>
                                                    <select 
                                                        name="anonimoPostImpresion" 
                                                        value={formData.anonimoPostImpresion || ''} 
                                                        onChange={handleChange} 
                                                        className="w-full bg-white dark:bg-gray-700 border border-yellow-400 dark:border-yellow-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-yellow-500"
                                                        required={formData.anonimo}
                                                    >
                                                        <option value="">Seleccione una opción</option>
                                                        <option value="Rebobinado">Rebobinado</option>
                                                        <option value="Laminación y rebobinado">Laminación y rebobinado</option>
                                                        <option value="MacroPerforado y Rebobinado">MacroPerforado y Rebobinado</option>
                                                        <option value="MicroPerforado y Rebobinado">MicroPerforado y Rebobinado</option>
                                                    </select>
                                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                                        ⚠️ Requerido para pedidos anónimos
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    Metros <span className="text-red-500">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    inputMode="numeric" 
                                                    pattern="[0-9]*" 
                                                    name="metros" 
                                                    value={formData.metros} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" 
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    Tiempo Prod. (HH:mm)
                                                    {formData.anonimo && <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">(Auto)</span>}
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="tiempoProduccionPlanificado" 
                                                    value={formData.tiempoProduccionPlanificado} 
                                                    onChange={handleChange} 
                                                    disabled={formData.anonimo}
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-blue-500 focus:border-blue-500" 
                                                    placeholder="HH:mm" 
                                                    pattern="[0-9]{1,2}:[0-9]{2}" 
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    Fecha de Entrega <span className="text-red-500">*</span>
                                                </label>
                                                <input 
                                                    type="date" 
                                                    name="fechaEntrega" 
                                                    value={formData.fechaEntrega} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" 
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Nueva Fecha Entrega</label>
                                                <input 
                                                    type="date" 
                                                    name="nuevaFechaEntrega" 
                                                    value={formData.nuevaFechaEntrega} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Vendedor</label>
                                            <select 
                                                name="vendedorId" 
                                                value={formData.vendedorId} 
                                                onChange={handleChange} 
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Seleccione un vendedor</option>
                                                {vendedores.filter(v => v.activo).map(vendedor => (
                                                    <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
                                                ))}
                                                <option value="add_new_vendedor">-- Crear nuevo vendedor --</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Prioridad</label>
                                                <select 
                                                    name="prioridad" 
                                                    value={formData.prioridad} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                                >
                                                    {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Camisa</label>
                                                <input 
                                                    type="text" 
                                                    name="camisa" 
                                                    value={formData.camisa} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5" 
                                                    placeholder="Info de la camisa"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">📝 Observaciones</label>
                                            <textarea 
                                                name="observaciones" 
                                                value={formData.observaciones} 
                                                onChange={handleChange} 
                                                rows={4} 
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                                placeholder="Notas importantes, instrucciones especiales..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Secuencia de Trabajo */}
                                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                            🔄 Secuencia de Trabajo Post-Impresión
                                        </h3>
                                        {formData.antivaho && secuenciaTrabajo.length === 0 && (
                                            <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                                ⚠️ Requerido para pedidos con Antivaho
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                                        <SequenceBuilder
                                            sequence={secuenciaTrabajo}
                                            onChange={setSecuenciaTrabajo}
                                            isReadOnly={false}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'gestion' && (
                            <>
                                {/* Resumen del estado */}
                                <div className={`rounded-lg p-4 mb-6 border-2 ${
                                    formData.materialDisponible && formData.clicheDisponible 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                }`}>
                                    <h3 className={`text-lg font-semibold mb-2 ${
                                        formData.materialDisponible && formData.clicheDisponible 
                                            ? 'text-green-800 dark:text-green-200' 
                                            : 'text-yellow-800 dark:text-yellow-200'
                                    }`}>
                                        📋 Resumen del Estado de Preparación
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${formData.materialDisponible ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {formData.materialDisponible ? '✓' : '○'} Material:
                                            </span>
                                            <span className={formData.materialDisponible ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-500'}>
                                                {formData.materialDisponible ? 'Disponible' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${formData.clicheDisponible ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {formData.clicheDisponible ? '✓' : '○'} Cliché:
                                            </span>
                                            <span className={formData.clicheDisponible ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-500'}>
                                                {formData.clicheDisponible ? 'Disponible' : formData.estadoCliché || 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuración de Preparación */}
                                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                                        ⚙️ Configuración de Preparación
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Estado del Cliché</label>
                                            <select 
                                                name="estadoCliché" 
                                                value={formData.estadoCliché} 
                                                onChange={handleChange} 
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                            >
                                                {Object.values(EstadoCliché).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Información Adicional Cliché
                                            </label>
                                            <input 
                                                type="text" 
                                                name="clicheInfoAdicional" 
                                                value={formData.clicheInfoAdicional || ''} 
                                                onChange={handleChange} 
                                                placeholder="Ej: Recibido 27/10, ID: CLH-123"
                                                maxLength={200}
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {formData.clicheInfoAdicional && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formData.clicheInfoAdicional.length}/200 caracteres
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Compra Cliché</label>
                                            <input 
                                                type="date" 
                                                name="compraCliche" 
                                                value={formData.compraCliche || ''} 
                                                onChange={handleChange} 
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Recepción Cliché</label>
                                            <input 
                                                type="date" 
                                                name="recepcionCliche" 
                                                value={formData.recepcionCliche || ''} 
                                                onChange={handleChange} 
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex items-center pt-2">
                                            <input 
                                                type="checkbox" 
                                                id="clicheDisponible" 
                                                name="clicheDisponible" 
                                                checked={formData.clicheDisponible} 
                                                onChange={handleChange} 
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                            />
                                            <label htmlFor="clicheDisponible" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Cliché Disponible
                                            </label>
                                        </div>
                                        <div className="flex items-center pt-2">
                                            <input 
                                                type="checkbox" 
                                                id="materialDisponible" 
                                                name="materialDisponible" 
                                                checked={formData.materialDisponible} 
                                                onChange={handleChange} 
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                            />
                                            <label htmlFor="materialDisponible" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Material Disponible
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección de Materiales */}
                                <SeccionDatosTecnicosDeMaterial
                                    formData={formData}
                                    onDataChange={handleDataChange}
                                    isReadOnly={false}
                                    handleChange={handleChange}
                                />
                            </>
                        )}
                    </form>
                </div>

                {/* Footer con botones */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="text-red-500">*</span> Campos obligatorios
                        </div>
                        <div className="flex gap-4">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2.5 px-6 rounded-lg transition-colors duration-200"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                form="addPedidoForm"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Crear Pedido
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isClienteModalOpen && (
                <ClienteModalMejorado
                    isOpen={isClienteModalOpen}
                    onClose={() => setClienteModalOpen(false)}
                    onSave={handleSaveCliente}
                    cliente={null}
                    isEmbedded={true}
                />
            )}

            {isVendedorModalOpen && (
                <VendedorModal
                    isOpen={isVendedorModalOpen}
                    onClose={() => setVendedorModalOpen(false)}
                    onSave={handleSaveVendedor}
                    vendedor={null}
                    isEmbedded={true}
                />
            )}
        </div>
    );
};

export default AddPedidoModal;