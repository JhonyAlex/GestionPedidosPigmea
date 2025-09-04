#!/bin/bash

echo "🔧 Script de debug para el panel de administración"

# Verificar que los archivos existan
echo "📁 Verificando archivos del panel de admin..."

if [ -f "/workspaces/GestionPedidosPigmea/admin/dist/index.html" ]; then
    echo "✅ index.html existe"
else
    echo "❌ index.html NO existe"
fi

if [ -d "/workspaces/GestionPedidosPigmea/admin/dist/assets" ]; then
    echo "✅ Carpeta assets existe"
    echo "📂 Contenido de assets:"
    ls -la /workspaces/GestionPedidosPigmea/admin/dist/assets/
else
    echo "❌ Carpeta assets NO existe"
fi

echo ""
echo "📄 Contenido del index.html:"
cat /workspaces/GestionPedidosPigmea/admin/dist/index.html

echo ""
echo "🚀 Iniciando servidor backend..."
cd /workspaces/GestionPedidosPigmea/backend
PORT=5000 node index.js &
SERVER_PID=$!

echo "⏱️ Esperando 5 segundos..."
sleep 5

echo "🧪 Probando endpoints..."

echo "📱 GET /admin:"
curl -I http://localhost:5000/admin 2>/dev/null || echo "❌ Falló"

echo ""
echo "🎨 GET /admin/assets/index.DhNV4Fb8.js:"
curl -I http://localhost:5000/admin/assets/index.DhNV4Fb8.js 2>/dev/null || echo "❌ Falló"

echo ""
echo "🎨 GET /admin/assets/index.ZnGRgaoG.css:"
curl -I http://localhost:5000/admin/assets/index.ZnGRgaoG.css 2>/dev/null || echo "❌ Falló"

echo ""
echo "🛑 Deteniendo servidor..."
kill $SERVER_PID 2>/dev/null || true
