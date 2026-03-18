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

# ---- MIGRACIONES INCREMENTALES PARA REDEPLOY ----
# Las migraciones históricas base fueron aplicadas manualmente.
# En redeploy reaplicamos solo migraciones idempotentes necesarias para alinear funciones/vistas.

apply_migration "Agregar Campo Antivaho Realizado" \
  "$MIGRATIONS_DIR/036-add-antivaho-realizado.sql"

apply_migration "Agregar etapa POST_DNT a producción activa" \
    "$MIGRATIONS_DIR/042-add-dnt-stage.sql"

apply_migration "Habilitar seguimiento manual de metros llevados" \
    "$MIGRATIONS_DIR/043-add-metros-llevados-jsonb.sql"

echo ""
echo "✅ ¡MIGRACIÓN COMPLETADA!"
echo "=== FIN DEL SCRIPT DE MIGRACIÓN ==="
