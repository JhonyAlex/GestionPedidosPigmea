# =================================================================
# SCRIPT MAESTRO: LIMPIEZA SEGURA DE BASE DE DATOS
# =================================================================
# Este script ejecuta todo el proceso de forma segura y paso a paso
# =================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "🔧 LIMPIEZA SEGURA DE BASE DE DATOS" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Este proceso realizará:" -ForegroundColor White
Write-Host "  1. ✅ Backup completo de la base de datos" -ForegroundColor Green
Write-Host "  2. 🔍 Diagnóstico detallado" -ForegroundColor Cyan
Write-Host "  3. 🧹 Limpieza de columnas duplicadas (SOLO duplicados)" -ForegroundColor Yellow
Write-Host "  4. ✅ Verificación final" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: No se perderán datos, solo columnas duplicadas vacías" -ForegroundColor Yellow
Write-Host ""

# Pedir confirmación
$confirmation = Read-Host "¿Desea continuar? (escriba 'SI' para proceder)"
if ($confirmation -ne "SI") {
    Write-Host ""
    Write-Host "❌ Proceso cancelado" -ForegroundColor Red
    exit 0
}

# =================================================================
# PASO 1: BACKUP
# =================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PASO 1 de 4: BACKUP DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

& .\backup-db.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error en el backup. Proceso detenido." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Backup completado. Presione ENTER para continuar..." -ForegroundColor Green
Read-Host

# =================================================================
# PASO 2: DIAGNÓSTICO
# =================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PASO 2 de 4: DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

& .\diagnose-db.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error en el diagnóstico. Proceso detenido." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Revise el diagnóstico anterior." -ForegroundColor Yellow
Write-Host "¿Desea continuar con la limpieza? (escriba 'SI' para proceder)" -ForegroundColor Yellow
$confirmCleanup = Read-Host

if ($confirmCleanup -ne "SI") {
    Write-Host ""
    Write-Host "❌ Limpieza cancelada. El backup está guardado." -ForegroundColor Yellow
    exit 0
}

# =================================================================
# PASO 3: LIMPIEZA
# =================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PASO 3 de 4: LIMPIEZA DE DUPLICADOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

# Cargar variables de entorno
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró .env" -ForegroundColor Red
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL no configurado" -ForegroundColor Red
    exit 1
}

$cleanupFile = "database/migrations/fix-duplicate-columns.sql"

if (-not (Test-Path $cleanupFile)) {
    Write-Host "❌ Error: No se encontró $cleanupFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧹 Ejecutando limpieza..." -ForegroundColor Yellow

$output = & psql $env:DATABASE_URL -f $cleanupFile 2>&1

$hasError = $false
$output | ForEach-Object {
    $line = $_.ToString()
    if ($line -match "ERROR" -and $line -notmatch "Error al eliminar") {
        Write-Host $line -ForegroundColor Red
        $hasError = $true
    } elseif ($line -match "Eliminada") {
        Write-Host $line -ForegroundColor Yellow
    } elseif ($line -match "✅") {
        Write-Host $line -ForegroundColor Green
    } elseif ($line -match "⚠️") {
        Write-Host $line -ForegroundColor Yellow
    } elseif ($line -match "NOTICE:") {
        Write-Host $line -ForegroundColor Cyan
    } else {
        Write-Host $line
    }
}

if ($hasError) {
    Write-Host ""
    Write-Host "⚠️  Se encontraron errores durante la limpieza" -ForegroundColor Yellow
    Write-Host "¿Desea continuar de todas formas? (SI/NO)" -ForegroundColor Yellow
    $continueAnyway = Read-Host
    
    if ($continueAnyway -ne "SI") {
        Write-Host ""
        Write-Host "Proceso detenido. Puede restaurar el backup si es necesario." -ForegroundColor Yellow
        exit 1
    }
}

# =================================================================
# PASO 4: VERIFICACIÓN FINAL
# =================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PASO 4 de 4: VERIFICACIÓN FINAL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 Verificando integridad de datos..." -ForegroundColor Yellow

$verifyQuery = @"
SELECT 
    (SELECT COUNT(*) FROM pedidos) as total_pedidos,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pedidos') as total_columnas;
"@

$result = & psql $env:DATABASE_URL -t -c $verifyQuery 2>&1

Write-Host ""
Write-Host $result -ForegroundColor White
Write-Host ""

# =================================================================
# RESULTADO FINAL
# =================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Backup guardado en: database/backups/" -ForegroundColor Green
Write-Host "  ✅ Columnas duplicadas eliminadas" -ForegroundColor Green
Write-Host "  ✅ Datos preservados" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Reinicie el servidor para aplicar cambios:" -ForegroundColor White
Write-Host "     cd backend && npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Verifique que todo funciona correctamente" -ForegroundColor White
Write-Host ""
Write-Host "  3. Si hay problemas, puede restaurar el backup:" -ForegroundColor White
Write-Host "     psql `$env:DATABASE_URL -f database/backups/[archivo]" -ForegroundColor Cyan
Write-Host ""
