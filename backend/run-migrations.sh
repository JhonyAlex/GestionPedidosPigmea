#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../database/migrations"

echo "=== INICIANDO SCRIPT DE MIGRACIÓN DE BASE DE DATOS ==="

# Construir conexión
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Usando DATABASE_URL para la conexión."
    PSQL_CONN="-d $DATABASE_URL"
else
    echo "❌ DATABASE_URL no definida."
    exit 1
fi

# Función para aplicar migraciones
apply_migration() {
    NAME=$1
    FILE=$2

    if [ ! -f "$FILE" ]; then
        echo "❌ Archivo no encontrado: $FILE"
        exit 1
    fi

    echo "🔄 Aplicando migración: $NAME..."
    psql $PSQL_CONN -v ON_ERROR_STOP=1 -f "$FILE"
    echo "✅ Migración '$NAME' aplicada."
}

# ---- MIGRACIONES CRÍTICAS ----
# Solo las migraciones más recientes que necesitan aplicarse automáticamente
# Las migraciones antiguas (000-031) ya fueron aplicadas manualmente

# Migraciones recientes que sí necesitan ejecutarse
apply_migration "Agregar Menciones a Comentarios" \
  "$MIGRATIONS_DIR/032-add-mentions-to-comments.sql"

apply_migration "Crear Tabla de Historial de Acciones" \
  "$MIGRATIONS_DIR/033-create-action-history-table.sql"

apply_migration "Agregar Campo Antivaho Realizado" \
  "$MIGRATIONS_DIR/036-add-antivaho-realizado.sql"

echo ""
echo "✅ ¡MIGRACIONES CRÍTICAS COMPLETADAS!"
echo "=== FIN DEL SCRIPT DE MIGRACIÓN ==="
