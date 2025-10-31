/**
 * Hace scroll suave hacia un elemento del pedido
 * @param pedidoId - ID del pedido al que hacer scroll
 * @param offset - Offset adicional desde el top (para headers fijos)
 */
export const scrollToPedido = (pedidoId: string, offset: number = 100) => {
    // Pequeño delay para asegurar que el DOM se ha actualizado
    setTimeout(() => {
        // Buscar la tarjeta del pedido en el DOM
        const pedidoElement = document.querySelector(`[data-pedido-id="${pedidoId}"]`);
        
        if (pedidoElement) {
            const elementPosition = pedidoElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            console.log(`✅ Scroll automático al pedido ${pedidoId}`);
        } else {
            console.warn(`⚠️ No se encontró el elemento del pedido ${pedidoId} para hacer scroll`);
        }
    }, 300);
};

/**
 * Asegura que un elemento sea visible en su contenedor con scroll
 * Útil para columnas Kanban con scroll interno
 */
export const scrollIntoViewIfNeeded = (element: HTMLElement | null) => {
    if (!element) return;

    const parent = element.parentElement;
    if (!parent) return;

    const elementRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    // Verificar si el elemento está fuera del área visible
    if (elementRect.top < parentRect.top || elementRect.bottom > parentRect.bottom) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
};
