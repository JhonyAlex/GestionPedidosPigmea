# Script para aplicar la migración 036: Agregar columna antivaho_realizado
# Ejecutar desde la raíz del proyecto

Write-Host "Aplicando migracion 036: Agregar columna antivaho_realizado..." -ForegroundColor Cyan

# Verificar que existe el archivo de migración
$migrationFile = "database\migrations\036-add-antivaho-realizado.sql"
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

if (-not $DB_HOST -or -not $DB_PORT -or -not $DB_NAME -or -not $DB_USER) {
    Write-Host "Error: Variables de entorno de base de datos no configuradas" -ForegroundColor Red
    Write-Host "Asegurate de tener un archivo .env con DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD" -ForegroundColor Yellow
    exit 1
}

Write-Host "Conectando a: $DB_HOST:$DB_PORT/$DB_NAME" -ForegroundColor Yellow

# Construir el comando psql
$env:PGPASSWORD = $DB_PASSWORD
$psqlCommand = "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f `"$migrationFile`""

try {
    Write-Host "Ejecutando migracion..." -ForegroundColor Yellow
    Invoke-Expression $psqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Migracion 036 aplicada exitosamente!" -ForegroundColor Green
        Write-Host "  - Se agrego la columna 'antivaho_realizado' a la tabla pedidos" -ForegroundColor Green
        Write-Host "  - Se creo un indice para consultas optimizadas" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Error al aplicar la migracion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n✗ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar la contraseña del entorno
    $env:PGPASSWORD = $null
}
