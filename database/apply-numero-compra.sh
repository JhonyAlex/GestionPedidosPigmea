#!/bin/bash

# =====================================================================
# Script para aplicar la migración del campo "Número de Compra"
# =====================================================================
# 
# Este script aplica la migración 007-add-numero-compra.sql que agrega
# el campo numero_compra a la tabla pedidos con las siguientes características:
#
# - Tipo: VARCHAR(50) alfanumérico
# - Opcional (NULL permitido) 
# - Indexado para búsquedas optimizadas
# - Soporte para búsqueda parcial y completa
#
# Uso: ./apply-numero-compra.sh
# =====================================================================

# Variables de configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/migrations/007-add-numero-compra.sql"

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Variables de conexión a la base de datos
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-gestion_pedidos}
DB_USER=${POSTGRES_USER:-pigmea_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-}

# Función para ejecutar consultas SQL
function run_query() {
    local query=$1
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$query"
    else
        psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$query"
    fi
}

# Función para ejecutar archivo SQL
function run_sql_file() {
    local file=$1
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f "$file"
    else
        psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f "$file"
    fi
}

# Banner
echo "======================================================================="
print_message $BLUE "🔧 MIGRACIÓN: CAMPO NÚMERO DE COMPRA"
echo "======================================================================="
print_message $YELLOW "Aplicando migración 007-add-numero-compra.sql"
echo "Conexión: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "======================================================================="

# Verificar que el archivo de migración existe
if [ ! -f "$MIGRATION_FILE" ]; then
    print_message $RED "❌ Error: No se encontró el archivo de migración en $MIGRATION_FILE"
    exit 1
fi

print_message $BLUE "📄 Archivo de migración encontrado: $MIGRATION_FILE"

# Verificar la conexión a la base de datos
print_message $BLUE "🔍 Verificando conexión a la base de datos..."
if ! run_query "SELECT 1;" > /dev/null 2>&1; then
    print_message $RED "❌ Error: No se pudo conectar a la base de datos."
    print_message $YELLOW "Verifique las variables de entorno:"
    print_message $YELLOW "  - POSTGRES_HOST=$DB_HOST"
    print_message $YELLOW "  - POSTGRES_PORT=$DB_PORT"
    print_message $YELLOW "  - POSTGRES_DB=$DB_NAME"
    print_message $YELLOW "  - POSTGRES_USER=$DB_USER"
    print_message $YELLOW "  - POSTGRES_PASSWORD=[configurado: $([ -n "$DB_PASSWORD" ] && echo "SÍ" || echo "NO")]"
    exit 1
fi

print_message $GREEN "✅ Conexión a la base de datos exitosa"

# Verificar que la tabla pedidos existe
print_message $BLUE "🔍 Verificando que la tabla pedidos existe..."
if ! run_query "SELECT 1 FROM pedidos LIMIT 1;" > /dev/null 2>&1; then
    print_message $RED "❌ Error: La tabla pedidos no existe."
    print_message $YELLOW "Ejecute primero la migración 000-create-pedidos-table.sql"
    exit 1
fi

print_message $GREEN "✅ Tabla pedidos encontrada"

# Verificar si la columna ya existe
print_message $BLUE "🔍 Verificando si la columna numero_compra ya existe..."
COLUMN_EXISTS=$(run_query "SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'numero_compra';" 2>/dev/null | grep -c "numero_compra" || echo "0")

if [ "$COLUMN_EXISTS" -gt 0 ]; then
    print_message $YELLOW "⚠️  La columna numero_compra ya existe. ¿Desea continuar? (s/N)"
    read -r response
    if [[ ! "$response" =~ ^[sS]$ ]]; then
        print_message $BLUE "🚫 Migración cancelada por el usuario"
        exit 0
    fi
fi

# Ejecutar la migración
print_message $BLUE "🚀 Ejecutando migración..."
echo "======================================================================="

if run_sql_file "$MIGRATION_FILE"; then
    print_message $GREEN "✅ Migración ejecutada exitosamente"
else
    print_message $RED "❌ Error ejecutando la migración"
    exit 1
fi

echo "======================================================================="

# Verificación post-migración
print_message $BLUE "🔍 Verificando resultado de la migración..."

# Verificar columna
print_message $BLUE "📋 Verificando columna numero_compra:"
run_query "SELECT column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'numero_compra';"

echo ""

# Verificar índices
print_message $BLUE "📋 Verificando índices creados:"
run_query "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'pedidos' AND indexname LIKE '%numero_compra%';"

echo ""

# Verificación final
FINAL_CHECK=$(run_query "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'numero_compra';" 2>/dev/null | grep -E "^\s*1\s*$" || echo "0")

if [ "$FINAL_CHECK" = "1" ] || echo "$FINAL_CHECK" | grep -q "1"; then
    echo "======================================================================="
    print_message $GREEN "🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!"
    echo "======================================================================="
    print_message $GREEN "✅ Campo numero_compra agregado a la tabla pedidos"
    print_message $GREEN "✅ Índices creados para búsquedas optimizadas"
    print_message $GREEN "✅ Listo para implementación en backend y frontend"
    echo ""
    print_message $BLUE "📝 Próximos pasos:"
    print_message $BLUE "   1. Actualizar tipos TypeScript (types.ts)"
    print_message $BLUE "   2. Modificar consultas en postgres-client.js"
    print_message $BLUE "   3. Actualizar componentes del frontend"
    print_message $BLUE "   4. Implementar en el sistema de búsqueda"
    echo "======================================================================="
else
    print_message $RED "❌ Error: La migración no se completó correctamente"
    exit 1
fi