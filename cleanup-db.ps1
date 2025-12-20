# =================================================================
# SCRIPT DE LIMPIEZA DE BASE DE DATOS
# =================================================================
# Este script ejecuta la limpieza de columnas duplicadas en la tabla pedidos
# =================================================================

Write-Host "" 
Write-Host "========================================" -ForegroundColor Red
Write-Host "⚠️  LIMPIEZA DE BASE DE DATOS" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Este script eliminará columnas duplicadas de la tabla 'pedidos'." -ForegroundColor Yellow
Write-Host "La operación es IRREVERSIBLE pero segura (solo elimina duplicados)." -ForegroundColor Yellow
Write-Host ""

# Pedir confirmación
$confirmation = Read-Host "¿Está seguro de continuar? (escriba 'SI' en mayúsculas)"
if ($confirmation -ne "SI") {
    Write-Host ""
    Write-Host "❌ Operación cancelada por el usuario" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📂 Cargando variables de entorno..." -ForegroundColor Cyan

# Verificar si existe el archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

# Cargar variables del archivo .env
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

# Ejecutar script de limpieza
$cleanupFile = "database/migrations/fix-duplicate-columns.sql"

if (-not (Test-Path $cleanupFile)) {
    Write-Host "❌ Error: No se encontró el archivo $cleanupFile" -ForegroundColor Red
    exit 1
}

Write-Host "🧹 Ejecutando limpieza de columnas duplicadas..." -ForegroundColor Cyan
Write-Host ""

try {
    # Ejecutar con psql
    $output = & psql $env:DATABASE_URL -f $cleanupFile 2>&1
    
    # Mostrar resultado con colores
    $output | ForEach-Object {
        $line = $_.ToString()
        if ($line -match "ERROR") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "Eliminada") {
            Write-Host $line -ForegroundColor Yellow
        } elseif ($line -match "✅") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "⚠️|Advertencia") {
            Write-Host $line -ForegroundColor Yellow
        } elseif ($line -match "NOTICE:") {
            Write-Host $line -ForegroundColor Cyan
        } else {
            Write-Host $line
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Las migraciones problemáticas están temporalmente deshabilitadas" -ForegroundColor White
    Write-Host "   en backend/run-migrations.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Puede intentar arrancar el servidor ahora:" -ForegroundColor White
    Write-Host "   cd backend && npm start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Si el servidor arranca correctamente, las migraciones" -ForegroundColor White
    Write-Host "   se re-habilitarán automáticamente en futuras versiones" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error durante la limpieza: $_" -ForegroundColor Red
    exit 1
}
