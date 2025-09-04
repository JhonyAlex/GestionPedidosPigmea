#!/bin/bash

# Script para deployar el panel de administración

echo "🚀 Desplegando Panel de Administración..."

# 1. Compilar el panel de administración
echo "📦 Compilando panel de administración..."
cd /workspaces/GestionPedidosPigmea/admin
npm run build

# 2. Copiar archivos al backend (si es necesario)
echo "📋 Verificando archivos compilados..."
ls -la dist/

# 3. Mostrar instrucciones
echo ""
echo "✅ Panel de administración compilado exitosamente!"
echo ""
echo "🌐 Para acceder al panel en producción:"
echo "   URL: https://planning.pigmea.click/admin"
echo ""
echo "🔐 Credenciales de acceso:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo "📋 Usuarios disponibles (modo sin BD):"
echo "   - admin (Administrador total)"
echo "   - supervisor (Gestión limitada)"
echo ""
echo "⚙️ Backend debe estar corriendo en planning.pigmea.click"
echo "   con las rutas /api/admin/* habilitadas"
echo ""
echo "🔧 Si no funciona, verificar:"
echo "   1. Backend corriendo con rutas admin habilitadas"
echo "   2. CORS configurado para el dominio"
echo "   3. Archivos estáticos servidos desde /admin/"
echo ""
