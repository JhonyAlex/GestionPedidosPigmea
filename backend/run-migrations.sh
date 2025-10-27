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

# Construir la cadena de conexión para psql
PSQL_CONN=""
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Usando DATABASE_URL para la conexión."
    PSQL_CONN="-d $DATABASE_URL"
elif [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    echo "✅ Usando variables de entorno DB_* para la conexión."
    export PGPASSWORD=$DB_PASSWORD
    PSQL_CONN="-h $DB_HOST -p ${DB_PORT:-5432} -d $DB_NAME -U $DB_USER"
else
    echo "❌ Error: No se encontraron variables de conexión a la base de datos (ni DATABASE_URL ni DB_HOST/DB_USER/etc)."
    exit 1
fi

echo "✅ Variables de conexión configuradas."

# Definir rutas a los archivos de migración
MIGRATIONS_DIR="../database/migrations"
PEDIDOS_MIGRATION="$MIGRATIONS_DIR/000-create-pedidos-table.sql"
PERMISSIONS_MIGRATION="$MIGRATIONS_DIR/create_user_permissions_table.sql"
CLIENTES_MIGRATION="$MIGRATIONS_DIR/001-add-clientes-system.sql"
NUEVA_FECHA_MIGRATION="$MIGRATIONS_DIR/006-add-nueva-fecha-entrega.sql"
NUMERO_COMPRA_MIGRATION="$MIGRATIONS_DIR/007-add-numero-compra.sql"
NUMEROS_COMPRA_ARRAY_MIGRATION="$MIGRATIONS_DIR/008-convert-numero-compra-to-array.sql"
CLICHE_INFO_MIGRATION="$MIGRATIONS_DIR/009-add-cliche-info.sql"
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
    psql $PSQL_CONN -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migración '$MIGRATION_NAME' aplicada exitosamente."
    else
        echo "❌ Error al aplicar la migración '$MIGRATION_NAME'."
        exit 1
    fi
}

# --- EJECUTAR MIGRACIONES ---
# Las migraciones están diseñadas para ser idempotentes (se pueden ejecutar varias veces sin problemas)

apply_migration "Crear Tabla de Pedidos" "$PEDIDOS_MIGRATION"
apply_migration "Crear Tabla de Permisos" "$PERMISSIONS_MIGRATION"
apply_migration "Crear Tabla de Clientes" "$CLIENTES_MIGRATION"
apply_migration "Agregar Nueva Fecha Entrega" "$NUEVA_FECHA_MIGRATION"
apply_migration "Agregar Número de Compra" "$NUMERO_COMPRA_MIGRATION"
apply_migration "Convertir Número Compra a Array" "$NUMEROS_COMPRA_ARRAY_MIGRATION"
apply_migration "Agregar Info Adicional Cliché" "$CLICHE_INFO_MIGRATION"

# Añade llamadas a futuras migraciones aquí
# apply_migration "Nombre de tu nueva migración" "$MIGRATIONS_DIR/tu_nuevo_archivo.sql"

echo "=== SCRIPT DE MIGRACIÓN COMPLETADO ==="
