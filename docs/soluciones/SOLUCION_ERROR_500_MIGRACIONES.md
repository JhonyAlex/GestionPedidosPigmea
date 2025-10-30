# 🚨 SOLUCIÓN AL ERROR 500: Columnas Faltantes en Base de Datos

## ❌ Problema Identificado

El error `Error interno del servidor al actualizar el pedido` se debe a que faltan columnas en la tabla `pedidos`:

1. **`nueva_fecha_entrega`** - Causa el error 500 inmediato
2. **`numero_compra`** - Necesaria para la nueva funcionalidad

## ✅ Solución Inmediata (PRODUCCIÓN)

### Opción A: Ejecutar SQL Directamente en Producción

Conecta a tu base de datos PostgreSQL de producción y ejecuta estos comandos SQL:

```sql
-- Migración 1: Agregar nueva_fecha_entrega (OBLIGATORIA para resolver el 500)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'nueva_fecha_entrega'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN nueva_fecha_entrega TIMESTAMP;
        CREATE INDEX IF NOT EXISTS idx_pedidos_nueva_fecha_entrega ON pedidos(nueva_fecha_entrega);
        RAISE NOTICE 'Columna nueva_fecha_entrega agregada';
    ELSE
        RAISE NOTICE 'Columna nueva_fecha_entrega ya existe';
    END IF;
END $$;

-- Migración 2: Agregar numero_compra (NUEVA FUNCIONALIDAD)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'numero_compra'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN numero_compra VARCHAR(50);
        CREATE INDEX IF NOT EXISTS idx_pedidos_numero_compra ON pedidos(numero_compra);
        RAISE NOTICE 'Columna numero_compra agregada';
    ELSE
        RAISE NOTICE 'Columna numero_compra ya existe';
    END IF;
END $$;

-- Opcional: Índice para búsquedas de texto avanzadas
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_compra_text 
ON pedidos USING gin(numero_compra gin_trgm_ops);
```

### Opción B: Usar el Script Automatizado

He creado un script que puedes ejecutar en tu servidor de producción:

```bash
# 1. Subir el archivo scripts/apply-migrations.cjs a tu servidor
# 2. En el servidor, navegar al directorio del proyecto
# 3. Ejecutar:

node scripts/apply-migrations.cjs
```

El script utiliza las variables de entorno ya configuradas en tu servidor.

### Opción C: SSH al Contenedor de BD

Si tienes acceso SSH al contenedor de PostgreSQL:

```bash
# Conectar al contenedor PostgreSQL
docker exec -it <container_name> psql -U pigmea_user -d gestion_pedidos

# Luego ejecutar los SQL de arriba
```

## 🔍 Verificación

Después de aplicar las migraciones, verifica que las columnas existen:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND column_name IN ('nueva_fecha_entrega', 'numero_compra')
ORDER BY column_name;
```

Deberías ver:
```
     column_name      |      data_type      | is_nullable 
----------------------+---------------------+-------------
 nueva_fecha_entrega  | timestamp without   | YES
 numero_compra        | character varying   | YES
```

## 🎯 Resultado Esperado

Una vez aplicadas las migraciones:

1. ✅ **El error 500 desaparecerá** - Los pedidos se podrán actualizar normalmente
2. ✅ **Campo "Nº Compra" funcionará** - Aparecerá en formularios, listas y búsquedas
3. ✅ **Búsqueda optimizada** - Podrás buscar por número de compra
4. ✅ **Sincronización en tiempo real** - Los cambios se reflejarán automáticamente

## 🚀 Archivos ya Preparados

El frontend ya está completamente actualizado con:

- ✅ Tipos TypeScript actualizados
- ✅ Formularios con el nuevo campo
- ✅ Listas y vistas actualizadas
- ✅ Sistema de búsqueda integrado
- ✅ Exportaciones incluyen el campo

## ⚡ Acción Inmediata Requerida

**PRIORIDAD ALTA**: Ejecuta al menos la migración de `nueva_fecha_entrega` inmediatamente para resolver el error 500:

```sql
ALTER TABLE pedidos ADD COLUMN nueva_fecha_entrega TIMESTAMP;
CREATE INDEX idx_pedidos_nueva_fecha_entrega ON pedidos(nueva_fecha_entrega);
```

## 📞 Soporte

Si tienes problemas aplicando las migraciones:

1. Verifica la conexión a PostgreSQL
2. Confirma que tienes permisos ALTER TABLE
3. Revisa los logs de PostgreSQL para errores específicos
4. El script `apply-migrations.cjs` incluye logging detallado

---

**Estado**: ✅ Frontend preparado | ⏳ Migraciones pendientes en producción  
**Impacto**: 🔴 Error 500 hasta que se aplique `nueva_fecha_entrega`  
**Urgencia**: 🚨 ALTA - Aplicar lo antes posible