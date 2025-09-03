#!/bin/bash

echo "🧪 DEBUGGING COMPLETO DEL LOGIN"
echo "==============================="

# Test 1: Health check
echo "1. 🏥 Health Check:"
curl -s "https://planning.pigmea.click/health" | jq .status

# Test 2: Probar múltiples contraseñas
echo ""
echo "2. 🔐 Probando múltiples passwords:"

echo "   - Probando 'admin123':"
RESPONSE1=$(curl -s -X POST "https://planning.pigmea.click/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "   Respuesta: $RESPONSE1"

echo "   - Probando 'Admin#2025!':"
RESPONSE2=$(curl -s -X POST "https://planning.pigmea.click/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin#2025!"}')
echo "   Respuesta: $RESPONSE2"

# Test 3: Probar con usuario inexistente
echo ""
echo "3. 👤 Probando usuario inexistente:"
RESPONSE3=$(curl -s -X POST "https://planning.pigmea.click/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"noexiste","password":"test"}')
echo "   Respuesta: $RESPONSE3"

# Test 4: Verificar conexión a base de datos
echo ""
echo "4. 🗃️ Verificando base de datos (endpoint health):"
curl -s "https://planning.pigmea.click/health" | jq .totalUsuarios

echo ""
echo "==============================="
echo "✅ Tests completados"
echo "⚠️  Si 'Contraseña incorrecta' persiste, el problema está en el hash o comparación"
echo "⚠️  Si 'Usuario no encontrado', el problema está en la consulta SQL"
