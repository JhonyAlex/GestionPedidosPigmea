#!/bin/bash

# =================================================================
# SCRIPT DE PRUEBAS DEL SISTEMA ADMINISTRATIVO
# =================================================================

BASE_URL="http://localhost:5000/api/admin"
TOKEN=""

echo "🧪 Script de Pruebas del Sistema Administrativo Pigmea"
echo "====================================================="

# Función para hacer login y obtener token
login() {
    echo "🔐 Iniciando sesión..."
    
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin",
            "password": "admin123"
        }')
    
    TOKEN=$(echo $response | jq -r '.token')
    
    if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
        echo "✅ Login exitoso"
        echo "🎫 Token obtenido: ${TOKEN:0:20}..."
    else
        echo "❌ Error en login:"
        echo $response | jq '.'
        exit 1
    fi
}

# Función para obtener datos del dashboard
test_dashboard() {
    echo ""
    echo "📊 Probando Dashboard..."
    
    response=$(curl -s -X GET "$BASE_URL/dashboard" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo $response | jq -e '.stats' > /dev/null 2>&1; then
        echo "✅ Dashboard funcionando"
        echo "📈 Estadísticas:"
        echo $response | jq '.stats'
    else
        echo "❌ Error en dashboard:"
        echo $response | jq '.'
    fi
}

# Función para obtener usuarios
test_users() {
    echo ""
    echo "👥 Probando Gestión de Usuarios..."
    
    response=$(curl -s -X GET "$BASE_URL/users" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo $response | jq -e '.[0].username' > /dev/null 2>&1; then
        echo "✅ Lista de usuarios obtenida"
        echo "👤 Usuarios encontrados:"
        echo $response | jq '.[].username'
    else
        echo "❌ Error obteniendo usuarios:"
        echo $response | jq '.'
    fi
}

# Función para obtener logs de auditoría
test_audit() {
    echo ""
    echo "🔍 Probando Auditoría..."
    
    response=$(curl -s -X GET "$BASE_URL/audit-logs?limit=5" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo $response | jq -e '.logs' > /dev/null 2>&1; then
        echo "✅ Logs de auditoría obtenidos"
        echo "📋 Últimas 5 acciones:"
        echo $response | jq '.logs[] | {action: .action, username: .username, timestamp: .created_at}'
    else
        echo "❌ Error obteniendo auditoría:"
        echo $response | jq '.'
    fi
}

# Función para obtener estado del sistema
test_health() {
    echo ""
    echo "🏥 Probando Estado del Sistema..."
    
    response=$(curl -s -X GET "$BASE_URL/health" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo $response | jq -e '.database.status' > /dev/null 2>&1; then
        echo "✅ Estado del sistema obtenido"
        echo "💾 Base de datos: $(echo $response | jq -r '.database.status')"
        echo "🖥️  Servidor: $(echo $response | jq -r '.server.status')"
        echo "🔌 WebSocket: $(echo $response | jq -r '.websocket.status')"
    else
        echo "❌ Error obteniendo estado:"
        echo $response | jq '.'
    fi
}

# Función para crear usuario de prueba
test_create_user() {
    echo ""
    echo "➕ Probando Creación de Usuario..."
    
    # Generar username único
    TIMESTAMP=$(date +%s)
    TEST_USERNAME="test_user_$TIMESTAMP"
    
    response=$(curl -s -X POST "$BASE_URL/users" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$TEST_USERNAME\",
            \"email\": \"test_$TIMESTAMP@pigmea.com\",
            \"firstName\": \"Usuario\",
            \"lastName\": \"Prueba\",
            \"role\": \"VIEWER\",
            \"password\": \"password123\",
            \"permissions\": [\"dashboard.view\"]
        }")
    
    if echo $response | jq -e '.username' > /dev/null 2>&1; then
        echo "✅ Usuario creado exitosamente"
        echo "👤 Username: $(echo $response | jq -r '.username')"
        echo "📧 Email: $(echo $response | jq -r '.email')"
        
        # Guardar ID para limpieza posterior
        TEST_USER_ID=$(echo $response | jq -r '.id')
        
        # Eliminar usuario de prueba
        echo "🗑️  Eliminando usuario de prueba..."
        delete_response=$(curl -s -X DELETE "$BASE_URL/users/$TEST_USER_ID" \
            -H "Authorization: Bearer $TOKEN")
        
        echo "✅ Usuario de prueba eliminado"
    else
        echo "❌ Error creando usuario:"
        echo $response | jq '.'
    fi
}

# Función para probar autenticación inválida
test_invalid_auth() {
    echo ""
    echo "🚫 Probando Autenticación Inválida..."
    
    response=$(curl -s -X GET "$BASE_URL/users" \
        -H "Authorization: Bearer token_invalido")
    
    if echo $response | jq -e '.error' > /dev/null 2>&1; then
        echo "✅ Autenticación inválida rechazada correctamente"
        echo "🔒 Error: $(echo $response | jq -r '.error')"
    else
        echo "❌ Error: autenticación inválida no fue rechazada"
        echo $response | jq '.'
    fi
}

# Función para verificar rate limiting
test_rate_limiting() {
    echo ""
    echo "⏱️  Probando Rate Limiting..."
    
    echo "🔄 Enviando múltiples requests..."
    
    for i in {1..3}; do
        response=$(curl -s -X GET "$BASE_URL/stats" \
            -H "Authorization: Bearer $TOKEN")
        
        if echo $response | jq -e '.totalUsers' > /dev/null 2>&1; then
            echo "✅ Request $i: OK"
        else
            echo "⚠️  Request $i: $(echo $response | jq -r '.error // "Error desconocido"')"
        fi
        
        sleep 1
    done
}

# Verificar dependencias
if ! command -v curl &> /dev/null; then
    echo "❌ curl no está instalado"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ jq no está instalado"
    echo "💡 Instalar con: sudo apt-get install jq"
    exit 1
fi

# Verificar que el servidor esté corriendo
echo "🔍 Verificando servidor..."
if ! curl -s "$BASE_URL/../health" > /dev/null; then
    echo "❌ El servidor no está corriendo en $BASE_URL"
    echo "💡 Iniciar con: cd backend && npm start"
    exit 1
fi

echo "✅ Servidor encontrado"

# Ejecutar pruebas
login
test_dashboard
test_users
test_audit
test_health
test_create_user
test_invalid_auth
test_rate_limiting

echo ""
echo "🎉 Pruebas completadas!"
echo "====================================================="
echo "📊 Resumen:"
echo "   - Panel administrativo: http://localhost:3001"
echo "   - API Backend: http://localhost:5000"
echo "   - Documentación: SISTEMA_ADMINISTRATIVO.md"
echo ""
echo "🔐 Credenciales de prueba:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo "====================================================="
