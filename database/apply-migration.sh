#!/bin/bash

# Script para apli# Ejecutar las migraciones
echo "🔄 Aplicando migración de permisos..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Migración de permisos aplicada exitosamente"
  
  echo "🔄 Aplicando migración de auditoría..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f "$AUDIT_FILE"
  
  if [ $? -eq 0 ]; then
    echo "✅ Migración de auditoría aplicada exitosamente"
    echo "🎉 Todas las migraciones completadas!"
  else
    echo "❌ Error al aplicar migración de auditoría"
    exit 1
  fi
else
  echo "❌ Error al aplicar migración de permisos"
  exit 1
fición SQL para crear la tabla de permisos
# Este script debe ejecutarse como parte del proceso de despliegue

echo "🔄 Iniciando migración para crear tablas de permisos y auditoría..."

# Variables de conexión a la base de datos
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-gestion_pedidos}
DB_USER=${POSTGRES_USER:-pigmea_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-}

# Rutas a los archivos de migración
MIGRATION_FILE="./database/migrations/create_user_permissions_table.sql"
AUDIT_FILE="./database/create-audit-log.sql"

# Verificar que los archivos de migración existen
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Archivo de migración no encontrado en $MIGRATION_FILE"
  exit 1
fi

if [ ! -f "$AUDIT_FILE" ]; then
  echo "❌ Error: Archivo de auditoría no encontrado en $AUDIT_FILE"
  exit 1
fi

echo "✅ Archivos de migración encontrados"

# Ejecutar el archivo de migración
echo "🔄 Aplicando migración SQL..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Migración SQL aplicada exitosamente"
else
  echo "❌ Error al aplicar la migración SQL"
  exit 1
fi

echo "🎉 Proceso de migración completado con éxito"
