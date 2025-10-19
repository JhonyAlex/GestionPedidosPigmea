# Script de Prueba: Bulk Delete Endpoint
# PowerShell Script para probar el endpoint bulk-delete

Write-Host "🧪 SCRIPT DE PRUEBA: Bulk Delete Endpoint" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$API_URL = "http://localhost:5000"  # Cambia esto si tu servidor está en otro puerto
$ENDPOINT = "/api/pedidos/bulk-delete"

Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "   API URL: $API_URL" -ForegroundColor White
Write-Host "   Endpoint: $ENDPOINT" -ForegroundColor White
Write-Host ""

# Solicitar datos del usuario
Write-Host "🔑 Por favor ingresa los siguientes datos:" -ForegroundColor Yellow
Write-Host ""

$userId = Read-Host "   User ID (obtén esto del localStorage del navegador)"
$userRole = Read-Host "   User Role (Administrador/Supervisor/Operador/Visualizador)"

if ([string]::IsNullOrWhiteSpace($userId)) {
    Write-Host "❌ User ID es requerido" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($userRole)) {
    $userRole = "Administrador"
    Write-Host "   ℹ️  Usando rol por defecto: Administrador" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📦 Ingresa los IDs de pedidos a eliminar (uno por línea, línea vacía para terminar):" -ForegroundColor Yellow

$pedidoIds = @()
$counter = 1

while ($true) {
    $id = Read-Host "   Pedido $counter"
    if ([string]::IsNullOrWhiteSpace($id)) {
        break
    }
    $pedidoIds += $id
    $counter++
}

if ($pedidoIds.Count -eq 0) {
    Write-Host "❌ Debes ingresar al menos un ID de pedido" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Datos ingresados:" -ForegroundColor Green
Write-Host "   Usuario: $userId" -ForegroundColor White
Write-Host "   Rol: $userRole" -ForegroundColor White
Write-Host "   Pedidos a eliminar: $($pedidoIds.Count)" -ForegroundColor White
Write-Host "   IDs: $($pedidoIds -join ', ')" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "¿Continuar con la prueba? (s/n)"
if ($confirmation -ne "s" -and $confirmation -ne "S") {
    Write-Host "❌ Prueba cancelada" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Enviando request..." -ForegroundColor Cyan
Write-Host ""

# Preparar headers
$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = $userId
    "x-user-role" = $userRole
}

# Preparar body
$body = @{
    ids = $pedidoIds
} | ConvertTo-Json

# Mostrar request
Write-Host "📤 REQUEST:" -ForegroundColor Magenta
Write-Host "   URL: $API_URL$ENDPOINT" -ForegroundColor White
Write-Host "   Method: DELETE" -ForegroundColor White
Write-Host "   Headers:" -ForegroundColor White
$headers.GetEnumerator() | ForEach-Object {
    Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor Gray
}
Write-Host "   Body:" -ForegroundColor White
Write-Host "      $body" -ForegroundColor Gray
Write-Host ""

# Realizar la request
try {
    $response = Invoke-WebRequest `
        -Uri "$API_URL$ENDPOINT" `
        -Method DELETE `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ RESPUESTA EXITOSA" -ForegroundColor Green
    Write-Host ""
    Write-Host "📥 RESPONSE:" -ForegroundColor Magenta
    Write-Host "   Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor White
    Write-Host "   Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor White
    Write-Host "   Body:" -ForegroundColor White
    
    $responseBody = $response.Content | ConvertFrom-Json
    $responseBody | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "✅ Test completado exitosamente" -ForegroundColor Green
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDescription = $_.Exception.Response.StatusDescription
    
    Write-Host "❌ ERROR EN LA REQUEST" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 RESPONSE:" -ForegroundColor Magenta
    Write-Host "   Status: $statusCode $statusDescription" -ForegroundColor White
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $reader.Close()
            
            Write-Host "   Body:" -ForegroundColor White
            
            try {
                $errorJson = $errorBody | ConvertFrom-Json
                $errorJson | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Yellow
            } catch {
                Write-Host "      $errorBody" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   No se pudo leer el cuerpo de la respuesta" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "🔍 ANÁLISIS DEL ERROR:" -ForegroundColor Cyan
    
    switch ($statusCode) {
        401 {
            Write-Host "   ❌ 401 No Autenticado" -ForegroundColor Red
            Write-Host "      - Verifica que el User ID sea correcto" -ForegroundColor Yellow
            Write-Host "      - Verifica que el usuario exista en la base de datos" -ForegroundColor Yellow
            Write-Host "      - Revisa los logs del backend para más detalles" -ForegroundColor Yellow
        }
        403 {
            Write-Host "   ❌ 403 Acceso Denegado" -ForegroundColor Red
            Write-Host "      - El usuario no tiene el permiso 'pedidos.delete'" -ForegroundColor Yellow
            Write-Host "      - Cambia el rol del usuario a 'Administrador'" -ForegroundColor Yellow
            Write-Host "      - O asigna el permiso específico desde la interfaz de admin" -ForegroundColor Yellow
        }
        404 {
            Write-Host "   ❌ 404 Endpoint No Encontrado" -ForegroundColor Red
            Write-Host "      - Verifica que el servidor esté corriendo en $API_URL" -ForegroundColor Yellow
            Write-Host "      - Verifica que la ruta sea correcta: $ENDPOINT" -ForegroundColor Yellow
            Write-Host "      - Revisa que el endpoint esté registrado en backend/index.js" -ForegroundColor Yellow
        }
        500 {
            Write-Host "   ❌ 500 Error Interno del Servidor" -ForegroundColor Red
            Write-Host "      - Revisa los logs del backend para ver el stack trace" -ForegroundColor Yellow
            Write-Host "      - Verifica que la base de datos esté conectada" -ForegroundColor Yellow
            Write-Host "      - Puede ser un error en la implementación del endpoint" -ForegroundColor Yellow
        }
        503 {
            Write-Host "   ❌ 503 Servicio No Disponible" -ForegroundColor Red
            Write-Host "      - La base de datos no está disponible" -ForegroundColor Yellow
            Write-Host "      - Verifica la conexión a PostgreSQL" -ForegroundColor Yellow
        }
        default {
            Write-Host "   ❌ Error desconocido: $statusCode" -ForegroundColor Red
            Write-Host "      - Revisa los logs del backend" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "💡 RECOMENDACIONES:" -ForegroundColor Cyan
    Write-Host "   1. Revisa los logs del backend en la consola" -ForegroundColor White
    Write-Host "   2. Verifica que el backend esté corriendo" -ForegroundColor White
    Write-Host "   3. Asegúrate de que el User ID sea válido" -ForegroundColor White
    Write-Host "   4. Verifica los permisos del usuario en la BD" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host ""
Write-Host "📝 NOTAS:" -ForegroundColor Cyan
Write-Host "   - Los logs detallados del backend deberían aparecer en la consola del servidor" -ForegroundColor White
Write-Host "   - Busca líneas que comiencen con 🔑, 🔐, 🔍 para ver el flujo de autenticación" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para salir"
