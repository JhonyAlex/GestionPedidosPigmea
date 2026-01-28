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

# ---- SOLO MIGRACIÓN NUEVA ----
# Las demás migraciones (000-033) ya fueron aplicadas manualmente

# Solo ejecutar la migración nueva que agrega el campo antivaho_realizado
apply_migration "Agregar Campo Antivaho Realizado" \
  "$MIGRATIONS_DIR/036-add-antivaho-realizado.sql"

echo ""
echo "✅ ¡MIGRACIÓN COMPLETADA!"
echo "=== FIN DEL SCRIPT DE MIGRACIÓN ==="
