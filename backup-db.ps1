# =================================================================
# SCRIPT DE BACKUP SEGURO DE BASE DE DATOS
# =================================================================
# Crea un backup completo de la base de datos PostgreSQL
# =================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📦 BACKUP DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cargar variables del archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Cargando configuración..." -ForegroundColor Yellow
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL no está configurado" -ForegroundColor Red
    exit 1
}

# Crear carpeta de backups si no existe
$backupDir = "database/backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "✅ Carpeta de backups creada: $backupDir" -ForegroundColor Green
}

# Generar nombre de archivo con timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$backupDir/backup_$timestamp.sql"

Write-Host ""
Write-Host "🔄 Creando backup..." -ForegroundColor Yellow
Write-Host "📁 Archivo: $backupFile" -ForegroundColor Cyan

try {
    # Ejecutar pg_dump
    $dumpCommand = "pg_dump"
    $arguments = @(
        $env:DATABASE_URL,
        "--file=$backupFile",
        "--verbose",
        "--format=plain",
        "--no-owner",
        "--no-acl"
    )
    
    & $dumpCommand $arguments 2>&1 | ForEach-Object {
        if ($_ -match "ERROR") {
            Write-Host $_ -ForegroundColor Red
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
    
    if (Test-Path $backupFile) {
        $fileSize = (Get-Item $backupFile).Length / 1KB
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ BACKUP COMPLETADO" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📁 Archivo: $backupFile" -ForegroundColor White
        Write-Host "📊 Tamaño: $([Math]::Round($fileSize, 2)) KB" -ForegroundColor White
        Write-Host ""
        Write-Host "💾 Para restaurar este backup en caso necesario:" -ForegroundColor Yellow
        Write-Host "   psql `$env:DATABASE_URL -f $backupFile" -ForegroundColor Cyan
        Write-Host ""
        
        # Retornar el nombre del archivo para el siguiente paso
        return $backupFile
    } else {
        throw "El archivo de backup no se creó"
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error durante el backup: $_" -ForegroundColor Red
    exit 1
}
