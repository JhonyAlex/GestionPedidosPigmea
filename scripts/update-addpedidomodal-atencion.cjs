// Script para agregar atencionObservaciones a AddPedidoModal
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AddPedidoModal.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// 1. Agregar atencionObservaciones al initialFormData
const initialFormDataPattern = `    anonimo: false,
    anonimoPostImpresion: '',
    // Nuevos campos`;

const newInitialFormData = `    anonimo: false,
    anonimoPostImpresion: '',
    atencionObservaciones: false,
    // Nuevos campos`;

content = content.replace(initialFormDataPattern, newInitialFormData);

// 2. Agregar el checkbox en el formulario (buscar el patrón después del select de Post-Impresión)
const checkboxSectionPattern = `{/* Select de Post-Impresión para Anónimos */}`;

const newCheckboxSection = `{/* Tercera fila: Atención Observaciones - Ocupa todo el ancho */}
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="atencionObservaciones" 
                                                        name="atencionObservaciones" 
                                                        checked={formData.atencionObservaciones} 
                                                        onChange={handleChange} 
                                                        className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                                    />
                                                    <label htmlFor="atencionObservaciones" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Atención Observaciones
                                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Marca el pedido con indicador rosa y fondo rojo suave)</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Select de Post-Impresión para Anónimos */}`;

content = content.replace(checkboxSectionPattern, newCheckboxSection);

// Escribir el archivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ AddPedidoModal actualizado exitosamente con campo atencionObservaciones');
