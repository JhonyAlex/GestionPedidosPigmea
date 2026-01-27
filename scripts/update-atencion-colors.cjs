// Script para actualizar los colores de atencionObservaciones a un tono más fuerte
const fs = require('fs');
const path = require('path');

// Actualizar PedidoCard.tsx
const pedidoCardPath = path.join(__dirname, '..', 'components', 'PedidoCard.tsx');
let pedidoCardContent = fs.readFileSync(pedidoCardPath, 'utf8');

// Cambiar de red-50 a red-100 (más fuerte) y red-100 a red-200 en hover
const oldBgPattern1 = `bg-red-50 dark:bg-red-950/20`;
const newBgPattern1 = `bg-red-100 dark:bg-red-950/30`;

const oldBgPattern2 = `hover:bg-red-100 dark:hover:bg-red-950/30`;
const newBgPattern2 = `hover:bg-red-200 dark:hover:bg-red-950/40`;

if (pedidoCardContent.includes(oldBgPattern1)) {
    pedidoCardContent = pedidoCardContent.replace(new RegExp(oldBgPattern1.replace(/\//g, '\\/'), 'g'), newBgPattern1);
    console.log('✅ PedidoCard: Actualizado bg-red-50 → bg-red-100');
}

if (pedidoCardContent.includes(oldBgPattern2)) {
    pedidoCardContent = pedidoCardContent.replace(new RegExp(oldBgPattern2.replace(/\//g, '\\/'), 'g'), newBgPattern2);
    console.log('✅ PedidoCard: Actualizado hover:bg-red-100 → hover:bg-red-200');
}

fs.writeFileSync(pedidoCardPath, pedidoCardContent, 'utf8');

// Actualizar PedidoList.tsx
const pedidoListPath = path.join(__dirname, '..', 'components', 'PedidoList.tsx');
let pedidoListContent = fs.readFileSync(pedidoListPath, 'utf8');

if (pedidoListContent.includes(oldBgPattern1)) {
    pedidoListContent = pedidoListContent.replace(new RegExp(oldBgPattern1.replace(/\//g, '\\/'), 'g'), newBgPattern1);
    console.log('✅ PedidoList: Actualizado bg-red-50 → bg-red-100');
}

if (pedidoListContent.includes(oldBgPattern2)) {
    pedidoListContent = pedidoListContent.replace(new RegExp(oldBgPattern2.replace(/\//g, '\\/'), 'g'), newBgPattern2);
    console.log('✅ PedidoList: Actualizado hover:bg-red-100 → hover:bg-red-200');
}

fs.writeFileSync(pedidoListPath, pedidoListContent, 'utf8');

console.log('\n✅ Colores actualizados a un tono más fuerte (red-100 en lugar de red-50)');
