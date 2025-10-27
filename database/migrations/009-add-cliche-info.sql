-- Migración para añadir campo de información adicional del cliché
-- Fecha: 2025-10-27
-- Descripción: Añade columna para almacenar información adicional sobre el cliché
--              (ej. fecha de recepción, ID de arte, notas, etc.)

-- Añadir la columna si no existe
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cliche_info_adicional VARCHAR(200);

-- Añadir comentario descriptivo
COMMENT ON COLUMN pedidos.cliche_info_adicional IS 'Información adicional para el cliché (ej. fecha de recepción, ID arte, notas)';

-- Verificar que el campo se añadió correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pedidos'
        AND column_name = 'cliche_info_adicional'
    ) THEN
        RAISE NOTICE 'Columna cliche_info_adicional añadida exitosamente a la tabla pedidos';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo añadir la columna cliche_info_adicional';
    END IF;
END $$;
