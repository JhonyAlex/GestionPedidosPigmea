#!/bin/bash

echo "🚀 SCRIPT DE DESPLIEGUE - GESTION PEDIDOS PIGMEA"
echo "================================================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "💡 Instala Node.js 18+ antes de continuar"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ npm $(npm --version) encontrado"

# Instalar dependencias
echo "📦 Instalando dependencias del backend..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

# Ejecutar migraciones de base de datos
echo "

📜 Ejecutando migraciones de la base de datos..."
./run-migrations.sh

if [ $? -ne 0 ]; then
    echo "❌ Error ejecutando las migraciones de la base de datos. Revisa el log anterior."
    exit 1
fi

# Configurar archivo .env para producción
echo "⚙️ Configurando variables de entorno para producción..."
if [ ! -f ".env" ]; then
    cp .env.production .env
    echo "✅ Archivo .env creado desde .env.production"
else
    echo "⚠️ Archivo .env ya existe. Verificando configuración..."
fi

# Verificar configuración de base de datos
if grep -q "control-produccin-pigmea-gestionpedidosdb-vcfcjc" .env; then
    echo "✅ Configuración de base de datos PostgreSQL detectada"
else
    echo "⚠️ Verificar configuración de base de datos en .env"
fi

# Verificar que existe el directorio dist
if [ ! -d "dist" ]; then
    echo "❌ Directorio 'dist' no encontrado"
    echo "� Ejecuta 'npm run build' en el directorio raíz del frontend primero"
    exit 1
fi

echo "✅ Frontend build encontrado en directorio 'dist'"

echo ""
echo "🎯 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo "✅ Dependencias instaladas"
echo "✅ Variables de entorno configuradas"
echo "✅ Frontend build disponible"
echo "✅ Base de datos: PostgreSQL configurada"
echo ""
echo "🚀 PARA INICIAR EL SERVIDOR:"
echo "npm start"
echo ""
echo "🔍 PARA VERIFICAR ESTADO:"
echo "curl http://localhost:3001/health"
echo ""
echo "🌐 URLS DE ACCESO:"
echo "Frontend: http://localhost:3001"
echo "API: http://localhost:3001/api"
echo "Health: http://localhost:3001/health"
