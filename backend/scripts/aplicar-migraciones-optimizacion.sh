#!/bin/bash

# Script para aplicar las migraciones de optimización
# Ejecutar en el servidor de producción

set -e

echo "=== APLICANDO MIGRACIONES DE OPTIMIZACIÓN ==="
echo ""
echo "⚠️  IMPORTANTE: Este script modificará la base de datos"
echo "    Asegúrate de tener un backup reciente antes de continuar"
echo ""
read -p "¿Deseas continuar? (si/no): " confirmacion

if [ "$confirmacion" != "si" ]; then
    echo "❌ Operación cancelada por el usuario"
    exit 1
fi

echo ""
echo "✅ Iniciando aplicación de migraciones..."
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

echo "🔗 Conectando a: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# MIGRACIÓN 022: Agregar campo estado
echo "🔄 Aplicando Migración 022: Campo 'estado' para archivado..."
psql "$PSQL_CONN" -v ON_ERROR_STOP=1 -f ../database/migrations/022-add-estado-pedido.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración 022 aplicada exitosamente"
else
    echo "❌ Error al aplicar Migración 022"
    exit 1
fi

echo ""

# MIGRACIÓN 023: Agregar índices de rendimiento
echo "🔄 Aplicando Migración 023: Índices de rendimiento..."
psql "$PSQL_CONN" -v ON_ERROR_STOP=1 -f ../database/migrations/023-add-performance-indexes.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración 023 aplicada exitosamente"
else
    echo "❌ Error al aplicar Migración 023"
    exit 1
fi

echo ""
echo "=== MIGRACIONES APLICADAS EXITOSAMENTE ==="
echo ""
echo "📊 Resumen de cambios:"
echo "   1. ✅ Columna 'estado' agregada a tabla pedidos"
echo "   2. ✅ Pedidos antiguos marcados como INACTIVO automáticamente"
echo "   3. ✅ 9 índices de rendimiento creados"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Ejecutar: node scripts/auto-archive-old-pedidos.js (opcional)"
echo "   2. Reiniciar el backend para aplicar cambios de código"
echo "   3. Verificar logs del backend"
echo ""
