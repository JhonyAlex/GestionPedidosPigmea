#!/bin/bash

# Script para aplicar la migración del campo "anonimo"
# Ejecutar este script cuando tengas acceso a la base de datos

echo "🚀 Aplicando migración: Agregar campo Anónimo"
echo "================================================"

# Cargar variables de entorno
if [ -f backend/.env.production ]; then
    source backend/.env.production
    echo "✅ Variables de producción cargadas"
else
    echo "❌ Archivo .env.production no encontrado"
    exit 1
fi

# Verificar conexión
echo "📡 Verificando conexión a la base de datos..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Conexión exitosa"
    
    # Aplicar migración
    echo "📝 Aplicando migración 011-add-anonimo.sql..."
    psql "$DATABASE_URL" -f database/migrations/011-add-anonimo.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Migración aplicada exitosamente"
        echo ""
        echo "El campo 'anonimo' ha sido agregado a la tabla pedidos."
        echo "Ahora puedes usar este campo en tu aplicación."
    else
        echo "❌ Error al aplicar la migración"
        exit 1
    fi
else
    echo "❌ No se pudo conectar a la base de datos"
    echo "La migración se aplicará automáticamente cuando el backend se inicie."
    exit 1
fi
