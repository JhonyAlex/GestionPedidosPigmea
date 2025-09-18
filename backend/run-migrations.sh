#!/bin/sh

set -e

echo "=== INICIANDO SCRIPT DE MIGRACIÓN DE BASE DE DATOS ==="

# Cargar variables de entorno desde el archivo .env si existe
if [ -f .env ]; then
    echo "Cargando variables de entorno desde .env..."
    export $(grep -v '^#' .env | xargs)
else
    echo "ADVERTENCIA: Archivo .env no encontrado. Se usarán variables de entorno del sistema."
fi

# Validar que las variables de conexión a la BD están presentes
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: Faltan una o más variables de entorno de la base de datos."
    echo "Asegúrate de que DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD estén definidas."
    exit 1
fi

echo "✅ Variables de base de datos encontradas."

# Definir rutas a los archivos de migración
MIGRATIONS_DIR="../database/migrations"
PEDIDOS_MIGRATION="$MIGRATIONS_DIR/000-create-pedidos-table.sql"
PERMISSIONS_MIGRATION="$MIGRATIONS_DIR/create_user_permissions_table.sql"
CLIENTES_MIGRATION="$MIGRATIONS_DIR/001-add-clientes-system.sql"
# Añade aquí futuras migraciones

# Función para aplicar una migración
apply_migration() {
    local MIGRATION_NAME=$1
    local MIGRATION_FILE=$2

    if [ ! -f "$MIGRATION_FILE" ]; then
        echo "❌ Error: Archivo de migración no encontrado: $MIGRATION_FILE"
        return 1
    fi

    echo "🔄 Aplicando migración: $MIGRATION_NAME..."
    
    # Ejecutar el script SQL
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$MIGRATION_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migración '$MIGRATION_NAME' aplicada exitosamente."
    else
        echo "❌ Error al aplicar la migración '$MIGRATION_NAME'."
        # Considera si quieres que el script falle por completo si una migración falla
        # exit 1 
    fi
}

# --- EJECUTAR MIGRACIONES ---
# Las migraciones están diseñadas para ser idempotentes (se pueden ejecutar varias veces sin problemas)

apply_migration "Crear Tabla de Pedidos" "$PEDIDOS_MIGRATION"
apply_migration "Crear Tabla de Permisos" "$PERMISSIONS_MIGRATION"
apply_migration "Crear Tabla de Clientes" "$CLIENTES_MIGRATION"

# Añade llamadas a futuras migraciones aquí
# apply_migration "Nombre de tu nueva migración" "$MIGRATIONS_DIR/tu_nuevo_archivo.sql"

echo "=== SCRIPT DE MIGRACIÓN COMPLETADO ==="
