#!/bin/bash

# Script para configurar la base de datos PostgreSQL

echo "🗄️ Configurando base de datos PostgreSQL..."

# Verificar si el archivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Archivo .env no encontrado. Copiando desde .env.example..."
    cp .env.example .env
fi

echo ""
echo "📝 Configuración actual:"
echo "------------------------"
if grep -q "^DATABASE_URL=" .env; then
    echo "DATABASE_URL: $(grep '^DATABASE_URL=' .env | cut -d'=' -f2)"
else
    echo "DATABASE_URL: No configurado"
fi

echo ""
echo "🔧 Para configurar la base de datos, edita el archivo .env y establece:"
echo "DATABASE_URL=postgresql://usuario:contraseña@host:puerto/basededatos"
echo ""
echo "Ejemplo:"
echo "DATABASE_URL=postgresql://myuser:mypass@localhost:5432/gestion_pedidos"
echo ""
echo "💡 Una vez configurado, ejecuta: npm start"
