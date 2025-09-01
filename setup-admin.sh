#!/bin/bash

echo "🔧 Configurando Sistema Administrativo de Pigmea..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd /workspaces/GestionPedidosPigmea/backend
npm install

# Instalar dependencias del admin frontend
echo "📦 Instalando dependencias del panel administrativo..."
cd /workspaces/GestionPedidosPigmea/admin
npm install

echo "✅ Dependencias instaladas correctamente"

# Crear archivo .env para el admin si no existe
if [ ! -f /workspaces/GestionPedidosPigmea/admin/.env ]; then
    echo "🔐 Creando archivo de configuración del admin..."
    cat > /workspaces/GestionPedidosPigmea/admin/.env << EOL
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=Panel de Administración - Pigmea
EOL
fi

# Crear archivo .env para el backend si no existe
if [ ! -f /workspaces/GestionPedidosPigmea/backend/.env ]; then
    echo "🔐 Creando archivo de configuración del backend..."
    cat > /workspaces/GestionPedidosPigmea/backend/.env << EOL
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-admin-key-change-in-production-please
DATABASE_URL=postgresql://username:password@localhost:5432/pigmea_db
EOL
fi

echo "📋 Próximos pasos:"
echo "1. Configurar la base de datos PostgreSQL"
echo "2. Ejecutar las migraciones de base de datos"
echo "3. Crear el usuario administrador inicial"
echo "4. Iniciar el backend: cd backend && npm start"
echo "5. Iniciar el admin: cd admin && npm run dev"
echo ""
echo "🌐 URLs del sistema:"
echo "- Aplicación principal: http://localhost:3000"
echo "- Panel administrativo: http://localhost:3001"
echo "- API Backend: http://localhost:5000"
echo ""
echo "✅ Sistema administrativo configurado correctamente!"
