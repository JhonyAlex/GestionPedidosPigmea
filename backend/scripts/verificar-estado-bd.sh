#!/bin/bash

# Script para verificar el estado actual de la base de datos
# Ejecutar en el servidor de producción

set -e

echo "=== VERIFICACIÓN DEL ESTADO DE LA BASE DE DATOS ==="
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Construir URL de conexión
if [ -n "$DATABASE_URL" ]; then
    PSQL_CONN="$DATABASE_URL"
else
    PSQL_CONN="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
fi

echo "✅ Conectando a: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# 1. Verificar si existe la columna 'estado'
echo "📋 1. Verificando columna 'estado' en tabla pedidos..."
psql "$PSQL_CONN" -t -c "
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'pedidos' AND column_name = 'estado'
            ) THEN '✅ Columna estado EXISTE'
            ELSE '❌ Columna estado NO EXISTE - Ejecutar migración 022'
        END AS resultado;
"

# 2. Verificar índices de rendimiento
echo ""
echo "📋 2. Verificando índices de rendimiento..."
psql "$PSQL_CONN" -t -c "
    SELECT 
        COUNT(*) || ' índices encontrados' 
    FROM pg_indexes 
    WHERE tablename = 'pedidos' 
    AND indexname LIKE 'idx_pedidos_%';
"

echo ""
echo "📋 Lista de índices existentes:"
psql "$PSQL_CONN" -c "
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'pedidos' 
    AND indexname LIKE 'idx_pedidos_%'
    ORDER BY indexname;
"

# 3. Contar pedidos por estado
echo ""
echo "📊 3. Distribución de pedidos por estado:"
psql "$PSQL_CONN" -c "
    SELECT 
        COALESCE(estado, 'NULL') as estado,
        COUNT(*) as cantidad
    FROM pedidos
    GROUP BY estado
    ORDER BY cantidad DESC;
"

# 4. Contar pedidos completados antiguos (>2 meses)
echo ""
echo "📊 4. Pedidos completados hace más de 2 meses (candidatos a INACTIVO):"
psql "$PSQL_CONN" -t -c "
    SELECT COUNT(*) || ' pedidos' 
    FROM pedidos 
    WHERE data->>'etapaActual' = 'COMPLETADO' 
    AND (data->>'fechaEntrega')::date < CURRENT_DATE - INTERVAL '2 months';
"

# 5. Tamaño de la tabla
echo ""
echo "💾 5. Tamaño actual de la tabla pedidos:"
psql "$PSQL_CONN" -c "
    SELECT 
        pg_size_pretty(pg_total_relation_size('pedidos')) as tamaño_total,
        pg_size_pretty(pg_relation_size('pedidos')) as tamaño_tabla,
        pg_size_pretty(pg_indexes_size('pedidos')) as tamaño_indices
    FROM pedidos 
    LIMIT 1;
"

echo ""
echo "=== VERIFICACIÓN COMPLETADA ==="
