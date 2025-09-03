#!/bin/bash

echo "🚀 VERIFICACIÓN COMPLETA DEL SISTEMA EN DOKPLOY"
echo "============================================================"

# Configuración
DOMAIN="https://planning.pigmea.click"
ADMIN_USER="admin"
ADMIN_PASS="Admin#2025!"

echo "📡 1. Verificando estado general del sistema..."
curl -s "$DOMAIN/health" | jq . || echo "❌ /health no responde o no es JSON válido"

echo ""
echo "🔐 2. Probando login de administrador..."
LOGIN_RESPONSE=$(curl -s -X POST "$DOMAIN/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}" \
  -w "\nHTTP_CODE:%{http_code}")

echo "Respuesta del login:"
echo "$LOGIN_RESPONSE"

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login exitoso"
else
    echo "❌ Login falló con código: $HTTP_CODE"
fi

echo ""
echo "👥 3. Verificando endpoint de usuarios..."
curl -s "$DOMAIN/api/admin/users" -w "\nHTTP_CODE:%{http_code}" || echo "❌ Error en endpoint usuarios"

echo ""
echo "📊 4. Verificando endpoints principales..."
curl -s "$DOMAIN/api/pedidos" -w "\nHTTP_CODE:%{http_code}" | head -n 5

echo ""
echo "🌐 5. Verificando WebSocket (simples ping)..."
curl -s "$DOMAIN/socket.io/?EIO=4&transport=polling" -w "\nHTTP_CODE:%{http_code}" | head -n 3

echo ""
echo "============================================================"
echo "✅ VERIFICACIÓN COMPLETADA"
echo ""
echo "📋 INSTRUCCIONES PARA CONFIGURAR EN DOKPLOY:"
echo "1. Ve a tu app ProduccionPigmea > Environment"
echo "2. Agrega estas variables:"
echo "   JWT_SECRET=PigmeaProd2025_JWT_SuperSecure_Random_Key_987654321"
echo "   SESSION_SECRET=PigmeaProd2025_Session_Ultra_Secret_Key_123456789"
echo "   TRUST_PROXY=1"
echo "3. Reinicia la aplicación"
echo "4. Ejecuta el SQL en tu base de datos PostgreSQL"
echo "5. Prueba el login con: admin / Admin#2025!"
