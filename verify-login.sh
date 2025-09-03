#!/bin/bash

echo "🧪 VERIFICACIÓN COMPLETA DE LOGIN"
echo "=================================="

echo "1. Verificando health endpoint..."
curl -s "https://planning.pigmea.click/health" | head -n 3

echo ""
echo "2. Probando login con credenciales..."
RESPONSE=$(curl -s -X POST "https://planning.pigmea.click/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin#2025!"}')

echo "Respuesta del login:"
echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "token\|success"; then
    echo "✅ Login exitoso!"
else
    echo "❌ Login falló"
fi

echo ""
echo "Hash actual que debe estar en la BD:"
echo '$2a$12$5BdWlcgMih/aBp/QfBOHI.2z5Nxjv8YoBr1OHAelRHtnZ2EhJpcLi'
