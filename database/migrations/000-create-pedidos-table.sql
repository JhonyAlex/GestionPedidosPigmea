-- Migración para crear la tabla de pedidos
-- Este script debe ejecutarse antes que cualquier otra migración que dependa de la tabla de pedidos.

CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(255) PRIMARY KEY,
    numero_pedido_cliente VARCHAR(255),
    cliente VARCHAR(255),
    fecha_pedido TIMESTAMP,
    fecha_entrega TIMESTAMP,
    etapa_actual VARCHAR(100),
    prioridad VARCHAR(50),
    secuencia_pedido INTEGER,
    cantidad_piezas INTEGER,
    observaciones TEXT,
    datos_tecnicos JSONB,
    antivaho BOOLEAN DEFAULT false,
    camisa VARCHAR(100),
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_etapa ON pedidos(etapa_actual);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_pedidos_secuencia ON pedidos(secuencia_pedido);
