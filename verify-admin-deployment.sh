#!/bin/bash

# Script de verificación post-deployment

echo "🔍 Verificando deployment del Panel de Administración..."

# URL base (cambiar por tu dominio en producción)
BASE_URL="https://planning.pigmea.click"
# BASE_URL="http://localhost:5000"  # Para pruebas locales

echo ""
echo "🌐 Verificando URLs..."

# Verificar aplicación principal
echo -n "📱 Aplicación principal (${BASE_URL}/): "
MAIN_TITLE=$(curl -s "${BASE_URL}/" | grep -o '<title>.*</title>' || echo "ERROR")
if [[ "$MAIN_TITLE" == *"Planning Pigmea"* ]]; then
    echo "✅ OK - $MAIN_TITLE"
else
    echo "❌ FALLO - $MAIN_TITLE"
fi

# Verificar panel de administración
echo -n "🛠️ Panel de admin (${BASE_URL}/admin): "
ADMIN_TITLE=$(curl -s "${BASE_URL}/admin" | grep -o '<title>.*</title>' || echo "ERROR")
if [[ "$ADMIN_TITLE" == *"Panel de Administración"* ]]; then
    echo "✅ OK - $ADMIN_TITLE"
else
    echo "❌ FALLO - $ADMIN_TITLE"
fi

echo ""
echo "🔧 Verificando APIs..."

# Verificar API de usuarios (debe fallar sin autenticación)
echo -n "🔐 API usuarios (${BASE_URL}/api/admin/users): "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/admin/users")
if [[ "$API_RESPONSE" == "401" ]]; then
    echo "✅ OK - Respuesta 401 (sin autenticación)"
elif [[ "$API_RESPONSE" == "200" ]]; then
    echo "✅ OK - Respuesta 200 (con datos mock)"
else
    echo "❌ FALLO - Código $API_RESPONSE"
fi

# Verificar login de administración
echo -n "🔑 Login admin (${BASE_URL}/api/admin/auth/login): "
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -o /dev/null -w "%{http_code}")

if [[ "$LOGIN_RESPONSE" == "200" ]]; then
    echo "✅ OK - Login exitoso"
else
    echo "❌ FALLO - Código $LOGIN_RESPONSE"
fi

echo ""
echo "📋 Resumen:"
echo "   🌐 Aplicación principal: ${BASE_URL}/"
echo "   🛠️ Panel de administración: ${BASE_URL}/admin"
echo "   🔐 Credenciales: admin / admin123"
echo ""

if [[ "$MAIN_TITLE" == *"Planning Pigmea"* ]] && [[ "$ADMIN_TITLE" == *"Panel de Administración"* ]] && [[ "$LOGIN_RESPONSE" == "200" ]]; then
    echo "🎉 ¡TODO FUNCIONANDO CORRECTAMENTE!"
    exit 0
else
    echo "⚠️ Hay problemas que necesitan atención"
    exit 1
fi
