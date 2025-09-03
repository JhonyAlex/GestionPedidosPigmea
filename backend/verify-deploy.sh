#!/bin/bash

echo "🔍 VERIFICACIÓN DE DESPLIEGUE"
echo "============================"

# Verificar que el servidor esté corriendo
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Servidor respondiendo en puerto 3001"
    
    # Obtener información de salud
    echo ""
    echo "📊 Estado del Sistema:"
    curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
    
else
    echo "❌ Servidor no responde en puerto 3001"
    echo "💡 Verificar que el servidor esté iniciado: npm start"
    exit 1
fi

echo ""
echo "🔐 Probando autenticación..."

# Probar login
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$AUTH_RESPONSE" | grep -q "success"; then
    echo "✅ Autenticación funcionando correctamente"
    echo "Usuario admin puede iniciar sesión"
else
    echo "❌ Problema con autenticación"
    echo "Respuesta: $AUTH_RESPONSE"
fi

echo ""
echo "🌐 URLs de Acceso:"
echo "Frontend: http://localhost:3001"
echo "API: http://localhost:3001/api"
echo "Health: http://localhost:3001/health"

echo ""
echo "✅ Verificación completada"
