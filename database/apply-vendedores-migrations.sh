#!/bin/bash
# Script para aplicar las migraciones de vendedores
# Ejecutar desde el directorio raíz del proyecto: bash database/apply-vendedores-migrations.sh

set -e

echo "🚀 Iniciando migraciones de vendedores..."

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuración de PostgreSQL
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-gestion_pedidos}"
DB_USER="${POSTGRES_USER:-pigmea_user}"

# Verificar conexión
echo "📡 Verificando conexión a PostgreSQL..."
if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "❌ Error: No se puede conectar a la base de datos"
    exit 1
fi

echo "✅ Conexión exitosa"

# Aplicar migración 014: Crear tabla vendedores
echo ""
echo "📋 Aplicando migración 014: Crear tabla vendedores..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/014-create-vendedores-table.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración 014 aplicada correctamente"
else
    echo "❌ Error al aplicar migración 014"
    exit 1
fi

# Aplicar migración 015: Añadir vendedor_id a pedidos
echo ""
echo "📋 Aplicando migración 015: Añadir vendedor_id a pedidos..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/015-add-vendedor-fk-to-pedidos.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración 015 aplicada correctamente"
else
    echo "❌ Error al aplicar migración 015"
    exit 1
fi

echo ""
echo "🎉 Todas las migraciones de vendedores aplicadas exitosamente"

# Mostrar resumen
echo ""
echo "📊 Resumen de vendedores:"
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as total_vendedores, COUNT(CASE WHEN activo = true THEN 1 END) as activos FROM vendedores;"

echo ""
echo "📊 Pedidos por vendedor:"
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT v.nombre, COUNT(p.id) as total_pedidos FROM vendedores v LEFT JOIN pedidos p ON v.id = p.vendedor_id GROUP BY v.id, v.nombre ORDER BY total_pedidos DESC;"
