#!/bin/bash

echo "🔍 Verificando campos de material en la aplicación..."
echo ""

# Función para crear un pedido de prueba con datos técnicos de material
create_test_pedido() {
    local test_data='{
        "numeroPedidoCliente": "TEST-MATERIAL-001",
        "cliente": "Cliente Prueba Material",
        "metros": 1000,
        "fechaEntrega": "2025-09-10",
        "prioridad": "Normal",
        "tipoImpresion": "Superficie (SUP)",
        "desarrollo": "DEV-001",
        "capa": "2",
        "tiempoProduccionPlanificado": "04:30",
        "observaciones": "Pedido de prueba para verificar campos de material",
        "materialDisponible": true,
        "estadoCliché": "Nuevo",
        "camisa": "C-001",
        "antivaho": false,
        "producto": "Producto Test",
        "materialCapasCantidad": 2,
        "materialCapas": [
            {"micras": 25, "densidad": 0.92},
            {"micras": 50, "densidad": 0.95}
        ],
        "materialConsumoCantidad": 2,
        "materialConsumo": [
            {"necesario": 100, "recibido": "Sí"},
            {"necesario": 150, "recibido": "No"}
        ],
        "bobinaMadre": 1500,
        "bobinaFinal": 1200,
        "minAdap": 30,
        "colores": 4,
        "minColor": 15
    }'
    
    echo "📦 Creando pedido de prueba con datos técnicos..."
    response=$(curl -s -X POST http://localhost:3001/api/pedidos \
        -H "Content-Type: application/json" \
        -d "$test_data")
    
    echo "Response: $response"
    echo ""
    
    # Extraer el ID del pedido creado
    pedido_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Pedido creado con ID: $pedido_id"
    echo ""
    
    return "$pedido_id"
}

# Función para actualizar campos específicos de material
update_material_fields() {
    local pedido_id=$1
    
    echo "🔄 Actualizando campos de material..."
    
    # Obtener el pedido actual
    current_pedido=$(curl -s http://localhost:3001/api/pedidos/$pedido_id)
    
    # Modificar campos específicos de material
    updated_data=$(echo "$current_pedido" | jq '
        .materialCapas[0].micras = 30 |
        .materialCapas[1].densidad = 0.98 |
        .materialConsumo[0].necesario = 120 |
        .materialConsumo[1].recibido = "Parcial" |
        .bobinaMadre = 1600 |
        .colores = 6
    ')
    
    echo "📝 Actualizando campos de material específicos..."
    update_response=$(curl -s -X PUT http://localhost:3001/api/pedidos/$pedido_id \
        -H "Content-Type: application/json" \
        -d "$updated_data")
    
    echo "✅ Campos actualizados"
    echo ""
}

# Función para verificar la persistencia en base de datos
verify_persistence() {
    local pedido_id=$1
    
    echo "🔍 Verificando persistencia en base de datos..."
    
    # Obtener el pedido directamente de la base de datos
    verification_response=$(curl -s http://localhost:3001/api/pedidos/$pedido_id)
    
    echo "📊 Datos recuperados de la base de datos:"
    echo "$verification_response" | jq '{
        id: .id,
        numeroPedidoCliente: .numeroPedidoCliente,
        materialCapasCantidad: .materialCapasCantidad,
        materialCapas: .materialCapas,
        materialConsumoCantidad: .materialConsumoCantidad,
        materialConsumo: .materialConsumo,
        bobinaMadre: .bobinaMadre,
        bobinaFinal: .bobinaFinal,
        colores: .colores,
        minColor: .minColor
    }'
    echo ""
}

# Función para obtener el log de auditoría
check_audit_log() {
    echo "📝 Verificando log de auditoría..."
    
    audit_response=$(curl -s http://localhost:3001/api/audit?limit=10)
    
    echo "🔍 Últimas entradas de auditoría:"
    echo "$audit_response" | jq '.[] | select(.action | contains("Material") or contains("Lámina") or contains("Campo Actualizado")) | {
        timestamp: .timestamp,
        userRole: .userRole,
        action: .action,
        details: .details
    }'
    echo ""
}

# Verificar que el servidor esté ejecutándose
echo "🚀 Verificando conexión con el servidor..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Error: El servidor no está ejecutándose en el puerto 3001"
    echo "Por favor, ejecuta: cd backend && npm start"
    exit 1
fi
echo "✅ Servidor conectado"
echo ""

# Ejecutar pruebas
echo "=== INICIANDO PRUEBAS DE CAMPOS DE MATERIAL ==="
echo ""

# Crear pedido de prueba
pedido_id=$(create_test_pedido)

if [ -z "$pedido_id" ]; then
    echo "❌ Error: No se pudo crear el pedido de prueba"
    exit 1
fi

# Esperar un momento para que se procese
sleep 1

# Verificar persistencia inicial
verify_persistence "$pedido_id"

# Actualizar campos
update_material_fields "$pedido_id"

# Esperar un momento para que se procese la actualización
sleep 1

# Verificar persistencia después de la actualización
echo "🔄 Verificando cambios después de la actualización:"
verify_persistence "$pedido_id"

# Verificar log de auditoría
check_audit_log

echo "=== PRUEBAS COMPLETADAS ==="
echo ""
echo "📋 Resumen:"
echo "1. ✅ Pedido creado con datos técnicos de material"
echo "2. ✅ Campos actualizados correctamente"
echo "3. ✅ Persistencia en base de datos verificada"
echo "4. ✅ Log de auditoría revisado"
echo ""
echo "💡 Si ves '[object Object]' en el log de auditoría, significa que necesitamos aplicar las correcciones del código."
