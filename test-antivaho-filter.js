// Script de prueba para verificar la lógica del filtro de antivaho
const testPedidos = [
    { id: '1', numeroPedidoCliente: 'CON-ANTIVAHO', antivaho: true },
    { id: '2', numeroPedidoCliente: 'SIN-ANTIVAHO', antivaho: false },
    { id: '3', numeroPedidoCliente: 'UNDEFINED-ANTIVAHO', antivaho: undefined },
    { id: '4', numeroPedidoCliente: 'NULL-ANTIVAHO', antivaho: null }
];

function testFilter(antivahoFilter, pedidos) {
    return pedidos.filter(p => {
        const antivahoMatch = antivahoFilter === 'all' || 
            (antivahoFilter === 'con' && p.antivaho === true) || 
            (antivahoFilter === 'sin' && p.antivaho !== true);
        return antivahoMatch;
    });
}

console.log('=== PRUEBAS DEL FILTRO DE ANTIVAHO ===\n');

console.log('Filtro "all" (todos):');
console.log(testFilter('all', testPedidos).map(p => p.numeroPedidoCliente));

console.log('\nFiltro "con" (con antivaho):');
console.log(testFilter('con', testPedidos).map(p => p.numeroPedidoCliente));

console.log('\nFiltro "sin" (sin antivaho):');
console.log(testFilter('sin', testPedidos).map(p => p.numeroPedidoCliente));
