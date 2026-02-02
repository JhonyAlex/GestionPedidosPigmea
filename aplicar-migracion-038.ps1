# Script para aplicar la migración 038: Crear tabla pdf_import_configs
# Ejecutar desde la raíz del proyecto

Write-Host "Aplicando migracion 038: Crear tabla pdf_import_configs..." -ForegroundColor Cyan

# Verificar que existe el archivo de migración
$migrationFile = "database\migrations\038-create-pdf-import-configs.sql"
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

# Si no están en el .env, usar valores por defecto de desarrollo
if (-not $DB_HOST) { $DB_HOST = "localhost" }
if (-not $DB_PORT) { $DB_PORT = "5432" }
if (-not $DB_NAME) { $DB_NAME = "gestion_pedidos" }
if (-not $DB_USER) { $DB_USER = "pigmea_user" }
if (-not $DB_PASSWORD) { $DB_PASSWORD = "Pigmea_2025_DbSecure42" }

Write-Host "Conectando a: $DB_HOST`:$DB_PORT / $DB_NAME" -ForegroundColor Gray

# Preguntar dónde aplicar la migración
$target = Read-Host "Aplicar en [L]ocal o [P]roduccion? (L/P)"

if ($target -eq "L" -or $target -eq "l") {
    # Aplicar localmente
    Write-Host "Ejecutando migracion en local..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $DB_PASSWORD
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migracion 038 aplicada exitosamente en local" -ForegroundColor Green
        
        # Verificar que la tabla existe
        Write-Host "`nVerificando que la tabla fue creada..." -ForegroundColor Cyan
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\dt limpio.pdf_import_configs'
    } else {
        Write-Host "Error al aplicar la migracion en local" -ForegroundColor Red
        exit 1
    }
    
} elseif ($target -eq "P" -or $target -eq "p") {
    # Aplicar en producción
    Write-Host "Ejecutando migracion en produccion..." -ForegroundColor Yellow
    
    # Leer el contenido del archivo de migración
    $sqlContent = Get-Content $migrationFile -Raw
    
    # Ejecutar el comando SSH con el SQL
    $sqlContent | ssh root@planning.pigmea.click "docker exec -i control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.p6ui7sm45433bz5wd2o7vwuae psql -U $DB_USER -d $DB_NAME"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migracion 038 aplicada exitosamente en produccion" -ForegroundColor Green
        
        # Verificar que la tabla existe
        Write-Host "`nVerificando que la tabla fue creada..." -ForegroundColor Cyan
        ssh root@planning.pigmea.click "docker exec -i control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.p6ui7sm45433bz5wd2o7vwuae psql -U $DB_USER -d $DB_NAME -c '\dt limpio.pdf_import_configs'"
    } else {
        Write-Host "Error al aplicar la migracion en produccion" -ForegroundColor Red
        exit 1
    }
    
} else {
    Write-Host "Opcion invalida. Cancelando..." -ForegroundColor Red
    exit 1
}

Write-Host "`nProceso completado" -ForegroundColor Green
