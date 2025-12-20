# Script de diagnóstico de base de datos
# Verifica el estado de la tabla pedidos y detecta columnas duplicadas

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si existe el archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host "Por favor, asegúrese de que el archivo .env exista en la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Cargar variables del archivo .env
Write-Host "📂 Cargando variables de entorno..." -ForegroundColor Yellow
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

# Verificar que DATABASE_URL esté configurado
if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL no está configurado en .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ DATABASE_URL configurado" -ForegroundColor Green
Write-Host ""

# Ejecutar script de diagnóstico
Write-Host "🔍 Ejecutando diagnóstico..." -ForegroundColor Yellow
Write-Host ""

$diagFile = "database/migrations/fix-column-limit.sql"

if (Test-Path $diagFile) {
    # Ejecutar con psql
    $output = & psql $env:DATABASE_URL -f $diagFile 2>&1
    
    # Mostrar resultado
    $output | ForEach-Object {
        $line = $_.ToString()
        if ($line -match "CRÍTICO") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "ADVERTENCIA") {
            Write-Host $line -ForegroundColor Yellow
        } elseif ($line -match "✅") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "NOTICE:") {
            Write-Host $line -ForegroundColor Cyan
        } else {
            Write-Host $line
        }
    }
} else {
    Write-Host "❌ Error: No se encontró el archivo $diagFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO COMPLETADO" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Si hay columnas duplicadas, elimínelas manualmente" -ForegroundColor White
Write-Host "2. Si la tabla está corrupta, considere recrearla desde el archivo de migración" -ForegroundColor White
Write-Host "3. Asegúrese de hacer backup antes de cualquier operación destructiva" -ForegroundColor White
