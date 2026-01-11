# Script para aplicar la migración 030-add-velocidad-posible.sql
# Usar en entorno de desarrollo local

Write-Host "=== APLICANDO MIGRACIÓN 030: velocidad_posible ===" -ForegroundColor Cyan
Write-Host ""

# Configuración de conexión local
$env:PGPASSWORD = "pigmea2025"
$pgHost = "localhost"
$pgUser = "pigmea"
$pgDatabase = "pigmea_db"
$pgPort = "5432"

# Ruta al archivo de migración
$migrationFile = "database/migrations/030-add-velocidad-posible.sql"

# Verificar si existe el archivo
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: No se encontró el archivo de migración: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Archivo de migración encontrado: $migrationFile" -ForegroundColor Green
Write-Host "🔗 Conectando a: $pgHost`:$pgPort/$pgDatabase" -ForegroundColor Yellow
Write-Host ""

# Intentar ejecutar con psql
try {
    # Buscar psql en ubicaciones comunes
    $psqlPaths = @(
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\14\bin\psql.exe",
        "psql"  # Si está en PATH
    )

    $psqlExe = $null
    foreach ($path in $psqlPaths) {
        if (Get-Command $path -ErrorAction SilentlyContinue) {
            $psqlExe = $path
            break
        }
    }

    if (-not $psqlExe) {
        Write-Host "❌ No se encontró psql. Opciones:" -ForegroundColor Red
        Write-Host "   1. Usa Docker: docker exec -i pigmea-postgres psql -U pigmea -d pigmea_db < $migrationFile" -ForegroundColor Yellow
        Write-Host "   2. La migración se aplicará automáticamente al reiniciar el backend" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "✅ Ejecutando migración con psql..." -ForegroundColor Green
    & $psqlExe -h $pgHost -U $pgUser -d $pgDatabase -p $pgPort -f $migrationFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ MIGRACIÓN 030 APLICADA EXITOSAMENTE!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Cambios realizados:" -ForegroundColor Cyan
        Write-Host "   • Campo 'velocidad_posible' agregado a tabla 'pedidos'" -ForegroundColor White
        Write-Host "   • Tipo: INTEGER (máx 3 dígitos, 0-999)" -ForegroundColor White
        Write-Host "   • Constraint de validación agregado" -ForegroundColor White
        Write-Host "   • Índice creado para búsquedas optimizadas" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Error al aplicar la migración (código: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternativa: La migración se aplicará automáticamente cuando reinicies el backend" -ForegroundColor Yellow
    exit 1
}
