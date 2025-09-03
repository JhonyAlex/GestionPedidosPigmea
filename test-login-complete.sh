#!/bin/bash

echo "🧪 VERIFICACIÓN COMPLETA DEL LOGIN"
echo "=================================="

echo "1. 🏥 Health Check:"
curl -s "https://planning.pigmea.click/health" | jq .status

echo ""
echo "2. 🔐 Probando login exitoso:"
RESPONSE=$(curl -s -X POST "https://planning.pigmea.click/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin#2025!"}')

echo "Respuesta completa:"
echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo ""
    echo "✅ LOGIN EXITOSO!"
    echo "🔍 Detalles del usuario:"
    echo "$RESPONSE" | jq '.user'
    
    USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
    USER_ROLE=$(echo "$RESPONSE" | jq -r '.user.role')
    
    echo ""
    echo "📊 Datos extraídos:"
    echo "  - ID: $USER_ID (tipo: $(echo $USER_ID | awk '{print (int($1) == $1) ? "número" : "string"}'))"
    echo "  - Rol: $USER_ROLE"
    
else
    echo "❌ LOGIN FALLÓ"
    echo "Error: $(echo "$RESPONSE" | jq -r '.error // "Sin error específico"')"
fi

echo ""
echo "=================================="
