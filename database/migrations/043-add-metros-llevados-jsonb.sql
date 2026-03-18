-- Migracion 043: Seguimiento manual de metros llevados por pedido
--
-- Objetivo:
-- Registrar en el payload JSONB `data` de `pedidos` el nuevo campo opcional:
--   - metrosLlevados (numero entero >= 0 y <= metros base en la UI)
--
-- Nota:
-- No se agrega columna SQL porque el modelo actual persiste los campos de pedido en JSONB.
-- La validacion y limite de negocio se aplican en frontend (PedidoModal).

DO $$
BEGIN
    RAISE NOTICE 'Migracion 043 aplicada: campo JSONB metrosLlevados habilitado en la capa de aplicacion.';
END $$;
