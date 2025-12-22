#!/bin/bash
# Script para disparar actualización después del deployment

# Configuración
API_URL="${API_URL:-http://localhost:8080}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"

echo "🚀 Post-deployment: Disparando actualización de clientes..."

# Hacer login para obtener credenciales (si es necesario)
# Por simplicidad, asumimos que el endpoint usa headers de autenticación directos

# Llamar al endpoint de trigger
RESPONSE=$(curl -s -X POST "${API_URL}/api/admin/trigger-update" \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin" \
  -H "x-user-role: Administrador" \
  -H "x-user-permissions: []")

echo "📡 Respuesta del servidor:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Verificar si fue exitoso
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Actualización disparada exitosamente"
    exit 0
else
    echo "❌ Error al disparar actualización"
    exit 1
fi
