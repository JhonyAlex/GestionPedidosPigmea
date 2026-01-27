// Script para agregar el checkbox de Atención Observaciones
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'PedidoModal.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Buscar el patrón donde termina el grid de checkboxes
const searchPattern = `                                            </div>

                                            {/* Select de Post-Impresión para Anónimos */}`;

// Nuevo contenido a insertar
const newContent = `                                            </div>

                                            {/* Tercera fila: Atención Observaciones - Ocupa todo el ancho */}
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="atencionObservaciones" 
                                                        name="atencionObservaciones" 
                                                        checked={!!formData.atencionObservaciones} 
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

// Reemplazar
if (content.includes(searchPattern)) {
    content = content.replace(searchPattern, newContent);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Checkbox de Atención Observaciones agregado exitosamente');
} else {
    console.log('❌ No se encontró el patrón de búsqueda');
    console.log('Buscando patrones alternativos...');

    // Intentar con un patrón más simple
    const simplePattern = `{/* Select de Post-Impresión para Anónimos */}`;
    const insertBefore = `
                                            {/* Tercera fila: Atención Observaciones - Ocupa todo el ancho */}
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="atencionObservaciones" 
                                                        name="atencionObservaciones" 
                                                        checked={!!formData.atencionObservaciones} 
                                                        onChange={handleChange} 
                                                        className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                                    />
                                                    <label htmlFor="atencionObservaciones" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Atención Observaciones
                                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Marca el pedido con indicador rosa y fondo rojo suave)</span>
                                                    </label>
                                                </div>
                                            </div>

                                            `;

    if (content.includes(simplePattern)) {
        content = content.replace(simplePattern, insertBefore + simplePattern);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Checkbox de Atención Observaciones agregado exitosamente (método alternativo)');
    } else {
        console.log('❌ Tampoco se encontró el patrón alternativo');
    }
}
