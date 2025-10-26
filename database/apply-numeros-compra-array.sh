#!/bin/bash

# =================================================================
# Script: apply-numeros-compra-array.sh
# Descripción: Aplica la migración para convertir numero_compra a array
# Fecha: Octubre 26, 2025
# =================================================================

set -e  # Detener el script si hay algún error

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Migración: numeros_compra (array)    ${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Variables de conexión (leer desde variables de entorno)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-gestion_pedidos}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Archivo de migración
MIGRATION_FILE="$(dirname "$0")/migrations/008-convert-numero-compra-to-array.sql"

# Verificar que el archivo de migración existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo de migración no encontrado${NC}"
    echo -e "   Ruta esperada: $MIGRATION_FILE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Archivo de migración encontrado"
echo -e "  Host: $DB_HOST:$DB_PORT"
echo -e "  Base de datos: $DB_NAME"
echo ""

# Función para ejecutar SQL y capturar resultado
execute_sql() {
    if [ -n "$DB_PASSWORD" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
    fi
}

# Verificar conexión a la base de datos
echo -e "${YELLOW}→${NC} Verificando conexión a la base de datos..."
if execute_sql -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Conexión exitosa"
else
    echo -e "${RED}❌ Error: No se pudo conectar a la base de datos${NC}"
    exit 1
fi

# Verificar si la migración ya fue aplicada
echo -e "${YELLOW}→${NC} Verificando estado de la migración..."
COLUMN_EXISTS=$(execute_sql -t -c "
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'numeros_compra'
    );" | tr -d '[:space:]')

if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${YELLOW}⚠${NC}  La columna 'numeros_compra' ya existe"
    echo -e "   La migración podría haber sido aplicada previamente"
    read -p "   ¿Desea continuar de todos modos? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}→${NC} Migración cancelada"
        exit 0
    fi
fi

# Crear backup antes de la migración
echo -e "${YELLOW}→${NC} Creando backup de seguridad..."
BACKUP_FILE="/tmp/pedidos_backup_$(date +%Y%m%d_%H%M%S).sql"
execute_sql -c "\copy (SELECT * FROM pedidos) TO '$BACKUP_FILE' WITH CSV HEADER" 2>/dev/null || true
if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓${NC} Backup creado: $BACKUP_FILE"
else
    echo -e "${YELLOW}⚠${NC}  No se pudo crear backup (continuando...)"
fi

# Aplicar la migración
echo -e "${YELLOW}→${NC} Aplicando migración..."
if execute_sql -f "$MIGRATION_FILE"; then
    echo -e "${GREEN}✓${NC} Migración aplicada exitosamente"
else
    echo -e "${RED}❌ Error al aplicar la migración${NC}"
    exit 1
fi

# Verificaciones post-migración
echo ""
echo -e "${YELLOW}→${NC} Ejecutando verificaciones..."

# 1. Verificar que la columna nueva existe
NEW_COL_EXISTS=$(execute_sql -t -c "
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'numeros_compra'
    );" | tr -d '[:space:]')

if [ "$NEW_COL_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓${NC} Columna 'numeros_compra' creada"
else
    echo -e "${RED}❌ Error: Columna 'numeros_compra' no existe${NC}"
    exit 1
fi

# 2. Verificar que la columna antigua fue eliminada
OLD_COL_EXISTS=$(execute_sql -t -c "
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'numero_compra'
    );" | tr -d '[:space:]')

if [ "$OLD_COL_EXISTS" = "f" ]; then
    echo -e "${GREEN}✓${NC} Columna 'numero_compra' eliminada"
else
    echo -e "${YELLOW}⚠${NC}  Columna 'numero_compra' aún existe"
fi

# 3. Verificar índices
INDEX_COUNT=$(execute_sql -t -c "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE tablename = 'pedidos' 
    AND indexname LIKE '%numeros_compra%';" | tr -d '[:space:]')

echo -e "${GREEN}✓${NC} Índices creados: $INDEX_COUNT"

# 4. Contar registros migrados
MIGRATED_COUNT=$(execute_sql -t -c "
    SELECT COUNT(*) 
    FROM pedidos 
    WHERE jsonb_array_length(numeros_compra) > 0;" | tr -d '[:space:]')

echo -e "${GREEN}✓${NC} Registros con números de compra: $MIGRATED_COUNT"

# 5. Verificar función auxiliar
FUNCTION_EXISTS=$(execute_sql -t -c "
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'search_numeros_compra'
    );" | tr -d '[:space:]')

if [ "$FUNCTION_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓${NC} Función 'search_numeros_compra' creada"
else
    echo -e "${YELLOW}⚠${NC}  Función de búsqueda no encontrada"
fi

# Resumen final
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Migración completada exitosamente  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Próximos pasos:"
echo -e "  1. Reiniciar el backend para que use la nueva estructura"
echo -e "  2. Verificar que el frontend muestra los campos correctamente"
echo -e "  3. Probar la búsqueda por números de compra"
echo ""
echo -e "Para rollback, consultar el archivo de migración:"
echo -e "  $MIGRATION_FILE"
echo ""
