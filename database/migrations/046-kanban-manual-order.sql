-- Migración 046: Tabla para orden manual del Kanban
-- Reemplaza el localStorage como fuente de verdad del orden visual en cada etapa de producción.
-- Se sincroniza en tiempo real vía WebSocket (evento 'kanban-order-updated').

CREATE TABLE IF NOT EXISTS kanban_manual_order (
    etapa VARCHAR(100) NOT NULL,
    pedido_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    PRIMARY KEY (etapa)
);

CREATE INDEX IF NOT EXISTS idx_kanban_order_updated
    ON kanban_manual_order(updated_at);

COMMENT ON TABLE kanban_manual_order IS 'Orden manual de pedidos en el tablero Kanban de producción. Sincronizado en tiempo real entre todos los usuarios.';
COMMENT ON COLUMN kanban_manual_order.etapa IS 'Identificador de la etapa de producción (ej: IMPRESION_FLEXO_1, DNT, CORTE)';
COMMENT ON COLUMN kanban_manual_order.pedido_ids IS 'Array ordenado de IDs de pedidos que define el orden visual en esa etapa';
