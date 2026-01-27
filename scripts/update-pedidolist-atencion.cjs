// Script para actualizar PedidoList con soporte para atencionObservaciones
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'PedidoList.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// 1. Modificar la línea 158 para agregar el fondo rojo suave cuando atencionObservaciones esté marcado
const trClassPattern = `className={\`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer \${pedido.id === highlightedPedidoId ? 'card-highlight' : ''}\`}`;

const newTrClass = `className={\`\${pedido.atencionObservaciones ? 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} cursor-pointer \${pedido.id === highlightedPedidoId ? 'card-highlight' : ''}\`}`;

content = content.replace(trClassPattern, newTrClass);

// 2. Modificar la línea 179 para cambiar el color del badge de prioridad cuando atencionObservaciones esté marcado
const priorityBadgePattern = `<span className={\`px-2 py-1 text-xs font-semibold rounded-full text-white \${(PRIORIDAD_COLORS[pedido.prioridad] || PRIORIDAD_COLORS[Prioridad.NORMAL] || 'border-blue-500').replace('border', 'bg').replace('-500', '-900')}\`}>
                    {pedido.prioridad}
                </span>`;

const newPriorityBadge = `<span className={\`px-2 py-1 text-xs font-semibold rounded-full text-white \${pedido.atencionObservaciones ? 'bg-pink-600' : (PRIORIDAD_COLORS[pedido.prioridad] || PRIORIDAD_COLORS[Prioridad.NORMAL] || 'border-blue-500').replace('border', 'bg').replace('-500', '-900')}\`}>
                    {pedido.prioridad}
                </span>`;

content = content.replace(priorityBadgePattern, newPriorityBadge);

// Escribir el archivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ PedidoList actualizado exitosamente con soporte para atencionObservaciones');
