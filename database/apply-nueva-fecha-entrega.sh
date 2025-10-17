#!/bin/bash

# Script para aplicar la migración 006-add-nueva-fecha-entrega.sql

echo "🔄 Aplicando migración: Agregar columna nueva_fecha_entrega..."

# Variables de conexión a la base de datos desde variables de entorno o valores predeterminados
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-gestion_pedidos}
DB_USER=${POSTGRES_USER:-pigmea_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-}

# Archivo de migración
MIGRATION_FILE="./migrations/006-add-nueva-fecha-entrega.sql"

# Verificar que el archivo de migración existe
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Archivo de migración no encontrado en $MIGRATION_FILE"
  exit 1
fi

echo "✅ Archivo de migración encontrado"

# Ejecutar la migración
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Migración aplicada exitosamente"
  echo "🎉 La columna 'nueva_fecha_entrega' ha sido agregada a la tabla 'pedidos'"
else
  echo "❌ Error al aplicar la migración"
  echo "ℹ️  Por favor, ejecuta manualmente el siguiente comando:"
  echo "   PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -p \$DB_PORT -d \$DB_NAME -U \$DB_USER -f $MIGRATION_FILE"
  exit 1
fi
