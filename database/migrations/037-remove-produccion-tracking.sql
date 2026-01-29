-- ✅ Migración 037: Eliminar sistema de tracking de operaciones de producción
-- Descripción: Elimina todas las tablas, vistas, funciones y triggers relacionados con el modo operador
-- Idempotente: Puede ejecutarse múltiples veces sin errores

-- ============================================
-- ELIMINAR VISTAS
-- ============================================
DROP VIEW IF EXISTS v_pedidos_disponibles_produccion CASCADE;
DROP VIEW IF EXISTS v_estadisticas_operador_hoy CASCADE;
DROP VIEW IF EXISTS v_operaciones_activas CASCADE;

-- ============================================
-- ELIMINAR TRIGGERS Y FUNCIONES
-- ============================================
DROP TRIGGER IF EXISTS trigger_actualizar_estadisticas_pedido ON operaciones_produccion;
DROP TRIGGER IF EXISTS trigger_calcular_duracion_pausa ON pausas_operacion;

DROP FUNCTION IF EXISTS actualizar_estadisticas_pedido() CASCADE;
DROP FUNCTION IF EXISTS calcular_duracion_pausa() CASCADE;

-- ============================================
-- ELIMINAR COLUMNAS DE TABLA pedidos
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'operador_actual_id') THEN
        ALTER TABLE pedidos DROP COLUMN operador_actual_id;
        RAISE NOTICE '✅ Columna operador_actual_id eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'operador_actual_nombre') THEN
        ALTER TABLE pedidos DROP COLUMN operador_actual_nombre;
        RAISE NOTICE '✅ Columna operador_actual_nombre eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'operacion_en_curso_id') THEN
        ALTER TABLE pedidos DROP COLUMN operacion_en_curso_id;
        RAISE NOTICE '✅ Columna operacion_en_curso_id eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'metros_producidos') THEN
        ALTER TABLE pedidos DROP COLUMN metros_producidos;
        RAISE NOTICE '✅ Columna metros_producidos eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'metros_restantes') THEN
        ALTER TABLE pedidos DROP COLUMN metros_restantes;
        RAISE NOTICE '✅ Columna metros_restantes eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'porcentaje_completado') THEN
        ALTER TABLE pedidos DROP COLUMN porcentaje_completado;
        RAISE NOTICE '✅ Columna porcentaje_completado eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'tiempo_real_produccion_segundos') THEN
        ALTER TABLE pedidos DROP COLUMN tiempo_real_produccion_segundos;
        RAISE NOTICE '✅ Columna tiempo_real_produccion_segundos eliminada';
    END IF;
END $$;

-- ============================================
-- ELIMINAR TABLAS (en orden inverso de dependencias)
-- ============================================
DROP TABLE IF EXISTS observaciones_produccion CASCADE;
DROP TABLE IF EXISTS metraje_produccion CASCADE;
DROP TABLE IF EXISTS pausas_operacion CASCADE;
DROP TABLE IF EXISTS operaciones_produccion CASCADE;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Sistema de tracking de operaciones de producción eliminado completamente';
END $$;
