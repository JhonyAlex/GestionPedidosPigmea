#!/bin/bash

# =================================================================
# SCRIPT PARA APLICAR LA CORRECCIÓN DE ESTRUCTURA DE CLIENTES
# =================================================================
# Este script aplica la migración 002-fix-clientes-structure.sql
# para resolver el error 500 en el endpoint POST /api/clientes

echo "🔧 Iniciando corrección de estructura de tabla clientes..."
echo "=================================================="

# Cargar variables de entorno
if [ -f .env ]; then
    source .env
    echo "✅ Variables de entorno cargadas desde .env"
else
    echo "⚠️ Archivo .env no encontrado, usando variables del sistema"
fi

# Configurar variables de conexión a PostgreSQL
DB_HOST=${POSTGRES_HOST:-${DB_HOST:-localhost}}
DB_PORT=${POSTGRES_PORT:-${DB_PORT:-5432}}
DB_NAME=${POSTGRES_DB:-${DB_NAME:-gestion_pedidos}}
DB_USER=${POSTGRES_USER:-${DB_USER:-pigmea_user}}
DB_PASSWORD=${POSTGRES_PASSWORD:-${DB_PASSWORD}}

# Si existe DATABASE_URL, usarla directamente
if [ ! -z "$DATABASE_URL" ]; then
    echo "🔗 Usando DATABASE_URL para conexión"
    CONNECTION_STRING="$DATABASE_URL"
else
    echo "🔗 Usando parámetros individuales de conexión"
    CONNECTION_STRING="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
fi

echo "📊 Parámetros de conexión:"
echo "   Host: $DB_HOST"
echo "   Puerto: $DB_PORT"
echo "   Base de datos: $DB_NAME"
echo "   Usuario: $DB_USER"
echo ""

# Verificar conexión a la base de datos
echo "🔍 Verificando conexión a la base de datos..."
if command -v psql >/dev/null 2>&1; then
    psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Conexión exitosa a PostgreSQL"
    else
        echo "❌ Error: No se pudo conectar a la base de datos"
        echo "   Verifica la configuración de conexión"
        exit 1
    fi
else
    echo "⚠️ psql no está disponible, continuando sin verificación de conexión"
fi

# Verificar si la tabla clientes existe
echo ""
echo "🔍 Verificando existencia de tabla clientes..."
TABLE_EXISTS=$(psql "$CONNECTION_STRING" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clientes');" 2>/dev/null | tr -d ' \n')

if [ "$TABLE_EXISTS" = "t" ]; then
    echo "✅ Tabla clientes encontrada"
    
    # Mostrar estructura actual
    echo ""
    echo "📋 Estructura actual de la tabla clientes:"
    echo "----------------------------------------"
    psql "$CONNECTION_STRING" -c "
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' AND table_schema = 'public'
        ORDER BY ordinal_position;
    " 2>/dev/null || echo "⚠️ No se pudo mostrar la estructura actual"
else
    echo "❌ Error: La tabla clientes no existe"
    echo "   Ejecuta primero la migración 001-add-clientes-system.sql"
    exit 1
fi

# Aplicar la migración de corrección
echo ""
echo "🚀 Aplicando migración 002-fix-clientes-structure.sql..."
echo "======================================================"

MIGRATION_FILE="./migrations/002-fix-clientes-structure.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Archivo de migración no encontrado: $MIGRATION_FILE"
    exit 1
fi

# Ejecutar la migración
psql "$CONNECTION_STRING" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migración aplicada exitosamente!"
    
    # Mostrar estructura final
    echo ""
    echo "📋 Estructura final de la tabla clientes:"
    echo "----------------------------------------"
    psql "$CONNECTION_STRING" -c "
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' AND table_schema = 'public'
        ORDER BY ordinal_position;
    " 2>/dev/null || echo "⚠️ No se pudo mostrar la estructura final"
    
    # Verificar que las columnas necesarias existen
    echo ""
    echo "🔍 Verificando columnas requeridas por el código..."
    REQUIRED_COLUMNS=("cif" "direccion_fiscal" "codigo_postal" "poblacion" "provincia" "pais" "persona_contacto" "notas")
    
    for column in "${REQUIRED_COLUMNS[@]}"; do
        COLUMN_EXISTS=$(psql "$CONNECTION_STRING" -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clientes' AND table_schema = 'public' AND column_name = '$column');" 2>/dev/null | tr -d ' \n')
        if [ "$COLUMN_EXISTS" = "t" ]; then
            echo "   ✅ $column"
        else
            echo "   ❌ $column (FALTA)"
        fi
    done
    
    echo ""
    echo "🎉 CORRECCIÓN COMPLETADA"
    echo "========================"
    echo "El error 500 en POST /api/clientes debería estar resuelto."
    echo "Puedes probar crear un cliente desde la aplicación."
    
else
    echo ""
    echo "❌ Error al aplicar la migración"
    echo "Revisa los errores mostrados arriba y corrige antes de continuar"
    exit 1
fi