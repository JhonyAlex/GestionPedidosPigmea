-- Migración: Crear tabla de materiales con sistema de estados
-- Fecha: 2025-12-18
-- Descripción: Sistema de estados para gestión de materiales (AZUL -> ROJO -> VERDE)
-- Idempotente: Puede ejecutarse múltiples veces sin error

-- Crear tabla de materiales
CREATE TABLE IF NOT EXISTS materiales (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    pendiente_recibir BOOLEAN DEFAULT true NOT NULL,
    pendiente_gestion BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentarios descriptivos
COMMENT ON TABLE materiales IS 'Gestión de materiales con sistema de estados para seguimiento de compras y recepciones';
COMMENT ON COLUMN materiales.numero IS 'Número único de identificación del material';
COMMENT ON COLUMN materiales.descripcion IS 'Descripción detallada del material';
COMMENT ON COLUMN materiales.pendiente_recibir IS 'true = Pendiente de Recibir (⏳), false = Material Recibido (✅)';
COMMENT ON COLUMN materiales.pendiente_gestion IS 'true = Pendiente Gestión (🕑), false = Gestionado (✅)';

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_materiales_numero ON materiales(numero);
CREATE INDEX IF NOT EXISTS idx_materiales_estados 
    ON materiales(pendiente_recibir, pendiente_gestion) 
    WHERE pendiente_recibir = true OR pendiente_gestion = true;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_materiales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_materiales_updated_at ON materiales;
CREATE TRIGGER trigger_update_materiales_updated_at
    BEFORE UPDATE ON materiales
    FOR EACH ROW
    EXECUTE FUNCTION update_materiales_updated_at();

-- Crear tabla de relación pedidos-materiales (muchos a muchos)
CREATE TABLE IF NOT EXISTS pedidos_materiales (
    id SERIAL PRIMARY KEY,
    pedido_id VARCHAR(255) NOT NULL,
    material_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE CASCADE,
    UNIQUE(pedido_id, material_id)
);

-- Comentarios para tabla de relación
COMMENT ON TABLE pedidos_materiales IS 'Relación muchos a muchos entre pedidos y materiales';

-- Índices para la tabla de relación
CREATE INDEX IF NOT EXISTS idx_pedidos_materiales_pedido ON pedidos_materiales(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_materiales_material ON pedidos_materiales(material_id);

-- Migrar datos existentes de numerosCompra (JSONB) a la tabla de materiales
-- (Solo si no se han migrado antes)
DO $$
DECLARE
    pedido_record RECORD;
    numero_compra_item JSONB;
    numero_compra_text TEXT;
    material_id INTEGER;
BEGIN
    -- Iterar sobre todos los pedidos que tienen números de compra
    FOR pedido_record IN 
        SELECT id, numeros_compra 
        FROM pedidos 
        WHERE numeros_compra IS NOT NULL 
          AND jsonb_typeof(numeros_compra) = 'array'
          AND jsonb_array_length(numeros_compra) > 0
    LOOP
        -- Iterar sobre cada elemento del array JSONB
        FOR numero_compra_item IN 
            SELECT * FROM jsonb_array_elements(pedido_record.numeros_compra)
        LOOP
            -- Convertir JSONB a TEXT (remover comillas si es un string)
            numero_compra_text := numero_compra_item #>> '{}';
            
            -- Omitir si el número está vacío
            IF numero_compra_text IS NULL OR TRIM(numero_compra_text) = '' THEN
                CONTINUE;
            END IF;
            
            -- Insertar el material si no existe (INSERT ... ON CONFLICT DO NOTHING)
            INSERT INTO materiales (numero, pendiente_recibir, pendiente_gestion)
            VALUES (TRIM(numero_compra_text), true, true)
            ON CONFLICT (numero) DO NOTHING
            RETURNING id INTO material_id;
            
            -- Si no se insertó (ya existía), obtener el ID
            IF material_id IS NULL THEN
                SELECT id INTO material_id FROM materiales WHERE numero = TRIM(numero_compra_text);
            END IF;
            
            -- Crear la relación pedido-material si no existe
            INSERT INTO pedidos_materiales (pedido_id, material_id)
            VALUES (pedido_record.id, material_id)
            ON CONFLICT (pedido_id, material_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migración de números de compra a materiales completada';
END $$;
