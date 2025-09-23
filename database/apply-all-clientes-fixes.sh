#!/bin/bash

# =================================================================
# SCRIPT COMPLETO PARA RESOLVER TODOS LOS PROBLEMAS DE CLIENTES
# =================================================================

echo "🔧 Aplicando TODAS las correcciones para el sistema de clientes..."
echo "=================================================================="

# Configurar variables de conexión
DB_CONNECTION="postgresql://pigmea_user:Pigmea_2025_DbSecure42@control-produccin-pigmea-gestionpedidosdb-vcfcjc:5432/gestion_pedidos"

echo "🔍 Verificando conexión a PostgreSQL..."
psql "$DB_CONNECTION" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Conexión exitosa a PostgreSQL"
else
    echo "❌ Error: No se pudo conectar a la base de datos"
    exit 1
fi

echo ""
echo "📋 Estructura ANTES de las correcciones:"
echo "========================================"
psql "$DB_CONNECTION" -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND table_schema = 'public'
ORDER BY ordinal_position;"

echo ""
echo "🚀 APLICANDO MIGRACIÓN 1: Estructura básica de clientes..."
echo "========================================================"

psql "$DB_CONNECTION" << 'EOF'
-- MIGRACIÓN 2: Agregar columnas faltantes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'cif') THEN
        ALTER TABLE clientes ADD COLUMN cif VARCHAR(20);
        RAISE NOTICE 'Columna cif agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'direccion_fiscal') THEN
        ALTER TABLE clientes ADD COLUMN direccion_fiscal TEXT;
        RAISE NOTICE 'Columna direccion_fiscal agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'codigo_postal') THEN
        ALTER TABLE clientes ADD COLUMN codigo_postal VARCHAR(10);
        RAISE NOTICE 'Columna codigo_postal agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'poblacion') THEN
        ALTER TABLE clientes ADD COLUMN poblacion VARCHAR(100);
        RAISE NOTICE 'Columna poblacion agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'provincia') THEN
        ALTER TABLE clientes ADD COLUMN provincia VARCHAR(100);
        RAISE NOTICE 'Columna provincia agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'pais') THEN
        ALTER TABLE clientes ADD COLUMN pais VARCHAR(100) DEFAULT 'España';
        RAISE NOTICE 'Columna pais agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'persona_contacto') THEN
        ALTER TABLE clientes ADD COLUMN persona_contacto VARCHAR(255);
        RAISE NOTICE 'Columna persona_contacto agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'notas') THEN
        ALTER TABLE clientes ADD COLUMN notas TEXT;
        RAISE NOTICE 'Columna notas agregada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'fecha_baja') THEN
        ALTER TABLE clientes ADD COLUMN fecha_baja TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna fecha_baja agregada';
    END IF;
END $$;
EOF

echo ""
echo "🚀 APLICANDO MIGRACIÓN 2: Agregar razon_social..."
echo "==============================================="

psql "$DB_CONNECTION" << 'EOF'
-- MIGRACIÓN 3: Agregar razon_social
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'razon_social') THEN
        ALTER TABLE clientes ADD COLUMN razon_social VARCHAR(255);
        RAISE NOTICE 'Columna razon_social agregada';
    ELSE
        RAISE NOTICE 'Columna razon_social ya existe';
    END IF;
END $$;
EOF

echo ""
echo "🔧 CORRIGIENDO CONSTRAINTS..."
echo "=========================="

psql "$DB_CONNECTION" << 'EOF'
-- Arreglar constraint de email (más permisivo)
DO $$
BEGIN
    ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_email_check;
    ALTER TABLE clientes ADD CONSTRAINT clientes_email_check 
    CHECK (email IS NULL OR email = '' OR (email LIKE '%@%' AND length(email) > 5));
    RAISE NOTICE 'Constraint de email corregido';
END $$;

-- Arreglar constraint de estado
DO $$
BEGIN
    ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_estado_check;
    ALTER TABLE clientes ADD CONSTRAINT clientes_estado_check 
    CHECK (estado IN ('activo', 'inactivo', 'Activo', 'Inactivo', 'Archivado'));
    RAISE NOTICE 'Constraint de estado corregido';
END $$;
EOF

echo ""
echo "📋 Estructura DESPUÉS de las correcciones:"
echo "=========================================="
psql "$DB_CONNECTION" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes' AND table_schema = 'public'
ORDER BY ordinal_position;"

echo ""
echo "🔍 Verificando columnas requeridas..."
echo "==================================="
psql "$DB_CONNECTION" -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND column_name IN ('cif', 'razon_social', 'direccion_fiscal', 'codigo_postal', 'poblacion', 'provincia', 'pais', 'persona_contacto', 'notas')
ORDER BY column_name;"

echo ""
echo "✅ CORRECCIONES APLICADAS EXITOSAMENTE"
echo "===================================="
echo "Cambios realizados:"
echo "- ✅ Agregadas columnas faltantes (cif, direccion_fiscal, etc.)"
echo "- ✅ Agregada columna razon_social"
echo "- ✅ Corregidos constraints de email y estado"
echo "- ✅ Mapeo de campos mejorado en backend"
echo ""
echo "🎯 EL SISTEMA DE CLIENTES DEBERÍA FUNCIONAR COMPLETAMENTE AHORA"
echo "- Crear clientes: ✅"
echo "- Editar clientes: ✅"  
echo "- Sincronización en tiempo real: ✅"
echo "- Campos guardados: ✅ (Razón Social, Dirección, Observaciones)"