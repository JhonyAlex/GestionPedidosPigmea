-- ✅ Migración 026: Crear sistema de tracking de operaciones de producción
-- Descripción: Tablas para gestionar operaciones de producción en tiempo real por operadores
-- Idempotente: Puede ejecutarse múltiples veces sin errores

-- ============================================
-- TABLA 1: operaciones_produccion
-- ============================================
CREATE TABLE IF NOT EXISTS operaciones_produccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id VARCHAR(255) NOT NULL,
    operador_id UUID NOT NULL,
    operador_nombre VARCHAR(255) NOT NULL,
    maquina VARCHAR(100) NOT NULL,
    etapa VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'pausada', 'completada', 'cancelada')),
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    tiempo_total_segundos INTEGER DEFAULT 0,
    tiempo_pausado_segundos INTEGER DEFAULT 0,
    metros_producidos NUMERIC(10, 2) DEFAULT 0,
    metros_objetivo NUMERIC(10, 2),
    observaciones TEXT,
    motivo_pausa TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_operacion_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_operaciones_pedido_id ON operaciones_produccion(pedido_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_operador_id ON operaciones_produccion(operador_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_estado ON operaciones_produccion(estado);
CREATE INDEX IF NOT EXISTS idx_operaciones_maquina ON operaciones_produccion(maquina);
CREATE INDEX IF NOT EXISTS idx_operaciones_fecha_inicio ON operaciones_produccion(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_operaciones_activas ON operaciones_produccion(estado, fecha_inicio) WHERE estado IN ('en_progreso', 'pausada');

COMMENT ON TABLE operaciones_produccion IS 'Registro de operaciones de producción realizadas por operadores';

-- ============================================
-- TABLA 2: pausas_operacion
-- ============================================
CREATE TABLE IF NOT EXISTS pausas_operacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacion_id UUID NOT NULL,
    fecha_inicio_pausa TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin_pausa TIMESTAMPTZ,
    duracion_segundos INTEGER,
    motivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pausa_operacion FOREIGN KEY (operacion_id) REFERENCES operaciones_produccion(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pausas_operacion_id ON pausas_operacion(operacion_id);
CREATE INDEX IF NOT EXISTS idx_pausas_fecha_inicio ON pausas_operacion(fecha_inicio_pausa DESC);

-- ============================================
-- TABLA 3: metraje_produccion
-- ============================================
CREATE TABLE IF NOT EXISTS metraje_produccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacion_id UUID NOT NULL,
    pedido_id VARCHAR(255) NOT NULL,
    metros_registrados NUMERIC(10, 2) NOT NULL,
    metros_acumulados NUMERIC(10, 2) NOT NULL,
    observaciones TEXT,
    calidad VARCHAR(50),
    registrado_por UUID NOT NULL,
    registrado_nombre VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_metraje_operacion FOREIGN KEY (operacion_id) REFERENCES operaciones_produccion(id) ON DELETE CASCADE,
    CONSTRAINT fk_metraje_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_metraje_operacion_id ON metraje_produccion(operacion_id);
CREATE INDEX IF NOT EXISTS idx_metraje_pedido_id ON metraje_produccion(pedido_id);
CREATE INDEX IF NOT EXISTS idx_metraje_fecha ON metraje_produccion(fecha_registro DESC);

-- ============================================
-- TABLA 4: observaciones_produccion
-- ============================================
CREATE TABLE IF NOT EXISTS observaciones_produccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacion_id UUID NOT NULL,
    pedido_id VARCHAR(255) NOT NULL,
    observacion TEXT NOT NULL,
    tipo VARCHAR(50),
    creado_por UUID NOT NULL,
    creado_nombre VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_observacion_operacion FOREIGN KEY (operacion_id) REFERENCES operaciones_produccion(id) ON DELETE CASCADE,
    CONSTRAINT fk_observacion_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_observaciones_operacion_id ON observaciones_produccion(operacion_id);
CREATE INDEX IF NOT EXISTS idx_observaciones_pedido_id ON observaciones_produccion(pedido_id);
CREATE INDEX IF NOT EXISTS idx_observaciones_fecha ON observaciones_produccion(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_observaciones_tipo ON observaciones_produccion(tipo);

-- ============================================
-- MODIFICACIONES A TABLA pedidos
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'operador_actual_id') THEN
        ALTER TABLE pedidos ADD COLUMN operador_actual_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'operador_actual_nombre') THEN
        ALTER TABLE pedidos ADD COLUMN operador_actual_nombre VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'operacion_en_curso_id') THEN
        ALTER TABLE pedidos ADD COLUMN operacion_en_curso_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'metros_producidos') THEN
        ALTER TABLE pedidos ADD COLUMN metros_producidos NUMERIC(10, 2) DEFAULT 0;
    END IF;
    
    -- ⚠️ IMPORTANTE: No podemos crear columnas calculadas que referencien 'metros' porque no existe como columna
    -- Los datos están en el campo JSONB 'data'. Creamos columnas simples y las calculamos en el backend.
    
    -- Manejar metros_restantes (eliminar si existe como GENERATED y recrear como columna normal)
    BEGIN
        -- Intentar eliminar la columna si existe (especialmente si es GENERATED)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'metros_restantes') THEN
            RAISE NOTICE '🔄 Eliminando columna metros_restantes existente...';
            ALTER TABLE pedidos DROP COLUMN metros_restantes;
        END IF;
        -- Crear la columna como normal (no GENERATED)
        ALTER TABLE pedidos ADD COLUMN metros_restantes NUMERIC(10, 2) DEFAULT 0;
        RAISE NOTICE '✅ Columna metros_restantes creada correctamente';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error al manejar metros_restantes: %', SQLERRM;
    END;
    
    -- Manejar porcentaje_completado (eliminar si existe como GENERATED y recrear como columna normal)
    BEGIN
        -- Intentar eliminar la columna si existe (especialmente si es GENERATED)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'porcentaje_completado') THEN
            RAISE NOTICE '🔄 Eliminando columna porcentaje_completado existente...';
            ALTER TABLE pedidos DROP COLUMN porcentaje_completado;
        END IF;
        -- Crear la columna como normal (no GENERATED)
        ALTER TABLE pedidos ADD COLUMN porcentaje_completado NUMERIC(5, 2) DEFAULT 0;
        RAISE NOTICE '✅ Columna porcentaje_completado creada correctamente';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error al manejar porcentaje_completado: %', SQLERRM;
    END;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'tiempo_real_produccion_segundos') THEN
        ALTER TABLE pedidos ADD COLUMN tiempo_real_produccion_segundos INTEGER DEFAULT 0;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pedidos_operador_actual ON pedidos(operador_actual_id) WHERE operador_actual_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_operacion_curso ON pedidos(operacion_en_curso_id) WHERE operacion_en_curso_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_metros_producidos ON pedidos(metros_producidos);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_estadisticas_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'completada' AND (OLD.estado IS NULL OR OLD.estado != 'completada') THEN
        UPDATE pedidos 
        SET 
            metros_producidos = COALESCE(metros_producidos, 0) + NEW.metros_producidos,
            tiempo_real_produccion_segundos = COALESCE(tiempo_real_produccion_segundos, 0) + NEW.tiempo_total_segundos,
            operador_actual_id = NULL,
            operador_actual_nombre = NULL,
            operacion_en_curso_id = NULL
        WHERE id = NEW.pedido_id;
    END IF;
    
    IF NEW.estado IN ('en_progreso', 'pausada') THEN
        UPDATE pedidos 
        SET 
            operador_actual_id = NEW.operador_id,
            operador_actual_nombre = NEW.operador_nombre,
            operacion_en_curso_id = NEW.id
        WHERE id = NEW.pedido_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_estadisticas_pedido ON operaciones_produccion;
CREATE TRIGGER trigger_actualizar_estadisticas_pedido
    AFTER INSERT OR UPDATE ON operaciones_produccion
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estadisticas_pedido();

CREATE OR REPLACE FUNCTION calcular_duracion_pausa()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_fin_pausa IS NOT NULL AND OLD.fecha_fin_pausa IS NULL THEN
        NEW.duracion_segundos := EXTRACT(EPOCH FROM (NEW.fecha_fin_pausa - NEW.fecha_inicio_pausa))::INTEGER;
        UPDATE operaciones_produccion
        SET tiempo_pausado_segundos = COALESCE(tiempo_pausado_segundos, 0) + NEW.duracion_segundos
        WHERE id = NEW.operacion_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_duracion_pausa ON pausas_operacion;
CREATE TRIGGER trigger_calcular_duracion_pausa
    BEFORE UPDATE ON pausas_operacion
    FOR EACH ROW
    EXECUTE FUNCTION calcular_duracion_pausa();

-- ============================================
-- VISTAS
-- ============================================
CREATE OR REPLACE VIEW v_operaciones_activas AS
SELECT 
    op.*,
    p.numero_pedido_cliente,
    p.cliente,
    CAST(p.data->>'metros' AS NUMERIC(10,2)) AS metros_totales_pedido,
    p.data->>'producto' AS producto,
    p.data->>'colores' AS colores,
    p.prioridad,
    p.fecha_entrega,
    p.observaciones AS observaciones_pedido,
    EXTRACT(EPOCH FROM (NOW() - op.fecha_inicio))::INTEGER AS segundos_desde_inicio
FROM operaciones_produccion op
INNER JOIN pedidos p ON op.pedido_id = p.id
WHERE op.estado IN ('en_progreso', 'pausada');

CREATE OR REPLACE VIEW v_estadisticas_operador_hoy AS
SELECT 
    operador_id,
    operador_nombre,
    COUNT(*) AS total_operaciones,
    COUNT(*) FILTER (WHERE estado = 'completada') AS operaciones_completadas,
    COUNT(*) FILTER (WHERE estado = 'en_progreso') AS operaciones_en_progreso,
    COUNT(*) FILTER (WHERE estado = 'pausada') AS operaciones_pausadas,
    SUM(metros_producidos) FILTER (WHERE estado = 'completada') AS metros_producidos_hoy,
    SUM(tiempo_total_segundos) FILTER (WHERE estado = 'completada') AS tiempo_trabajado_segundos,
    AVG(tiempo_total_segundos) FILTER (WHERE estado = 'completada') AS tiempo_promedio_operacion
FROM operaciones_produccion
WHERE DATE(fecha_inicio) = CURRENT_DATE
GROUP BY operador_id, operador_nombre;

CREATE OR REPLACE VIEW v_pedidos_disponibles_produccion AS
SELECT 
    p.id,
    p.numero_pedido_cliente,
    p.cliente,
    p.etapa_actual,
    p.sub_etapa_actual,
    -- Extraer metros del campo JSONB data, no hay columna 'metros' directa
    CAST(p.data->>'metros' AS NUMERIC(10,2)) AS metros,
    p.metros_producidos,
    p.metros_restantes,
    p.porcentaje_completado,
    p.data->>'producto' AS producto,
    p.data->>'colores' AS colores,
    p.fecha_entrega,
    p.prioridad,
    p.observaciones,
    p.data->>'tiempoProduccionPlanificado' AS tiempo_produccion_planificado
FROM pedidos p
WHERE 
    p.etapa_actual IN ('IMPRESION', 'POST_IMPRESION', 'PREPARACION')
    AND p.operador_actual_id IS NULL
    AND p.estado_pedido = 'activo'
ORDER BY 
    CASE p.prioridad 
        WHEN 'ALTA' THEN 1
        WHEN 'MEDIA' THEN 2
        WHEN 'BAJA' THEN 3
        ELSE 4
    END,
    p.fecha_entrega ASC NULLS LAST;
