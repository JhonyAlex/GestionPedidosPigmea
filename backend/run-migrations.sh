#!/bin/sh
set -e

echo "=== INICIANDO SCRIPT DE MIGRACIÓN DE BASE DE DATOS ==="

# Construir conexión
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Usando DATABASE_URL para la conexión."
    PSQL_CONN="-d $DATABASE_URL"
else
    echo "❌ DATABASE_URL no definida."
    exit 1
fi

MIGRATIONS_DIR="../database/migrations"

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

# ---- ORDEN CORRECTO ----

# 1️⃣ Funciones (SIEMPRE PRIMERO)
apply_migration "Función update_modified_column" \
  "$MIGRATIONS_DIR/000-create-update-modified-function.sql"

# 2️⃣ Tablas base
apply_migration "Crear Tabla de Pedidos" \
  "$MIGRATIONS_DIR/000-create-pedidos-table.sql"

apply_migration "Crear Tabla de Clientes" \
  "$MIGRATIONS_DIR/001-add-clientes-system.sql"

# (el resto de migraciones siguen igual, en orden)
