// Script para actualizar PedidoCard con soporte para atencionObservaciones
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'PedidoCard.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// 1. Modificar la línea donde se define priorityColor para que tome en cuenta atencionObservaciones
const priorityColorPattern = `    // Usar valor por defecto si la prioridad no existe en PRIORIDAD_COLORS
    const priorityColor = PRIORIDAD_COLORS[pedido.prioridad] || PRIORIDAD_COLORS[Prioridad.NORMAL] || 'border-blue-500';`;

const newPriorityColor = `    // Usar valor por defecto si la prioridad no existe en PRIORIDAD_COLORS
    // Si atencionObservaciones está marcado, usar color rosa fuerte
    const priorityColor = pedido.atencionObservaciones 
        ? 'border-pink-600' 
        : (PRIORIDAD_COLORS[pedido.prioridad] || PRIORIDAD_COLORS[Prioridad.NORMAL] || 'border-blue-500');`;

content = content.replace(priorityColorPattern, newPriorityColor);

// 2. Modificar el className del div principal para agregar fondo rojo suave cuando atencionObservaciones esté marcado
const cardDivPattern = `className={\`bg-white dark:bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 \${priorityColor} shadow-md \${pedido.id === highlightedPedidoId ? 'card-highlight' : ''} \${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''} relative\`}`;

const newCardDiv = `className={\`\${pedido.atencionObservaciones ? 'bg-red-50 dark:bg-red-950/20' : 'bg-white dark:bg-gray-900'} rounded-lg p-3 cursor-pointer \${pedido.atencionObservaciones ? 'hover:bg-red-100 dark:hover:bg-red-950/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} border-l-4 \${priorityColor} shadow-md \${pedido.id === highlightedPedidoId ? 'card-highlight' : ''} \${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''} relative\`}`;

content = content.replace(cardDivPattern, newCardDiv);

// 3. Modificar el badge de prioridad para usar rosa cuando atencionObservaciones esté marcado
const priorityBadgePattern = `<span className={\`text-xs font-semibold px-2 py-1 rounded-full \${priorityColor.replace('border', 'bg').replace('-500','-900')} text-white\`}>
                            {pedido.prioridad}
                        </span>`;

const newPriorityBadge = `<span className={\`text-xs font-semibold px-2 py-1 rounded-full \${pedido.atencionObservaciones ? 'bg-pink-600' : priorityColor.replace('border', 'bg').replace('-500','-900')} text-white\`}>
                            {pedido.prioridad}
                        </span>`;

content = content.replace(priorityBadgePattern, newPriorityBadge);

// Escribir el archivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ PedidoCard actualizado exitosamente con soporte para atencionObservaciones');
