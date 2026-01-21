# Script para aplicar la migración 033: Crear tabla action_history
# Ejecutar desde la raíz del proyecto

Write-Host "Aplicando migracion 033: Crear tabla action_history..." -ForegroundColor Cyan

# Verificar que existe el archivo de migración
$migrationFile = "database\migrations\033-create-action-history-table.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: No se encuentra el archivo de migracion $migrationFile" -ForegroundColor Red
    exit 1
}

# Leer las variables de entorno del archivo .env si existe
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Variables de conexión
$DB_HOST = $env:DB_HOST
$DB_PORT = $env:DB_PORT
$DB_NAME = $env:DB_NAME
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD

if (-not $DB_HOST -or -not $DB_NAME -or -not $DB_USER -or -not $DB_PASSWORD) {
    Write-Host "Error: Faltan variables de entorno de base de datos" -ForegroundColor Red
    Write-Host "Asegurate de tener configurado el archivo .env con DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD" -ForegroundColor Yellow
    exit 1
}

Write-Host "Configuracion:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Puerto: $DB_PORT" -ForegroundColor Gray
Write-Host "  Base de datos: $DB_NAME" -ForegroundColor Gray
Write-Host "  Usuario: $DB_USER" -ForegroundColor Gray

# Construir la cadena de conexión
$connectionString = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Leer el contenido del archivo SQL
$sqlContent = Get-Content $migrationFile -Raw

# Ejecutar la migración usando psql
Write-Host ""
Write-Host "Ejecutando migracion..." -ForegroundColor Yellow

$env:PGPASSWORD = $DB_PASSWORD
$psqlOutput = $sqlContent | & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migracion 033 aplicada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tabla 'action_history' creada correctamente" -ForegroundColor Cyan
    Write-Host "   - Indices creados para optimizar consultas" -ForegroundColor Gray
    Write-Host "   - Soporte para historial de pedidos, clientes, vendedores y materiales" -ForegroundColor Gray
} else {
    Write-Host "Error al aplicar la migracion:" -ForegroundColor Red
    Write-Host $psqlOutput -ForegroundColor Red
    exit 1
}

# Limpiar variable de entorno
Remove-Item Env:PGPASSWORD

Write-Host ""
Write-Host "Proceso completado" -ForegroundColor Green
