# Script PowerShell para actualizar TODOS los scripts de migración
# Reemplaza referencias a 'pedidos' por 'limpio.pedidos'
# 
# EJECUTAR COMO: .\database\update-all-migrations.ps1

$migrationsPath = "database\migrations"
$backupPath = "database\migrations_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "🔧 Iniciando actualización masiva de scripts de migración..." -ForegroundColor Cyan
Write-Host ""

# Crear backup
Write-Host "📦 Creando backup en: $backupPath" -ForegroundColor Yellow
Copy-Item -Path $migrationsPath -Destination $backupPath -Recurse
Write-Host "✅ Backup creado exitosamente" -ForegroundColor Green
Write-Host ""

# Archivos a actualizar (excluimos los que ya están actualizados)
$filesToUpdate = @(
    "000-create-pedidos-table.sql",
    "001-add-clientes-system.sql",
    "006-add-nueva-fecha-entrega.sql",
    "007-add-numero-compra.sql",
    "008-convert-numero-compra-to-array.sql",
    "009-add-cliche-info.sql",
    "010-auto-update-cliente-estado.sql",
    "011-add-anonimo.sql",
    "013-add-cliche-dates.sql",
    "015-add-vendedor-fk-to-pedidos.sql",
    "016-add-observaciones-material.sql",
    "017-rename-dto-compra.sql",
    "018-add-perforado-fields.sql",
    "019-add-anonimo-post-impresion.sql",
    "022-add-estado-pedido.sql",
    "023-add-performance-indexes.sql",
    "024-add-tiempo-produccion-decimal.sql",
    "026-create-produccion-tracking.sql",
    "029-add-observaciones-rapidas.sql",
    "030-add-velocidad-posible.sql"
)

$totalFiles = $filesToUpdate.Count
$currentFile = 0
$updatedFiles = 0
$skippedFiles = 0

foreach ($file in $filesToUpdate) {
    $currentFile++
    $filePath = Join-Path $migrationsPath $file
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  [$currentFile/$totalFiles] Archivo no encontrado: $file" -ForegroundColor Yellow
        $skippedFiles++
        continue
    }
    
    Write-Host "🔄 [$currentFile/$totalFiles] Procesando: $file" -ForegroundColor Cyan
    
    # Leer contenido
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Patrones de reemplazo (en orden de especificidad)
    $replacements = @{
        # ALTER TABLE pedidos -> ALTER TABLE limpio.pedidos
        'ALTER TABLE pedidos\s' = 'ALTER TABLE limpio.pedidos '
        
        # CREATE TABLE IF NOT EXISTS pedidos -> CREATE TABLE IF NOT EXISTS limpio.pedidos
        'CREATE TABLE IF NOT EXISTS pedidos\s*\(' = 'CREATE TABLE IF NOT EXISTS limpio.pedidos ('
        
        # ON pedidos( -> ON limpio.pedidos(
        'ON pedidos\(' = 'ON limpio.pedidos('
        
        # FROM pedidos -> FROM limpio.pedidos (en triggers y funciones)
        'FROM pedidos\s' = 'FROM limpio.pedidos '
        'FROM pedidos;' = 'FROM limpio.pedidos;'
        
        # COMMENT ON COLUMN pedidos. -> COMMENT ON COLUMN limpio.pedidos.
        'COMMENT ON COLUMN pedidos\.' = 'COMMENT ON COLUMN limpio.pedidos.'
        
        # TRIGGER ... ON pedidos -> TRIGGER ... ON limpio.pedidos
        'ON pedidos\s*$' = 'ON limpio.pedidos'
        
        # table_name = 'pedidos' -> table_schema = 'limpio' AND table_name = 'pedidos'
        "WHERE table_name = 'pedidos'" = "WHERE table_schema = 'limpio' AND table_name = 'pedidos'"
    }
    
    # Aplicar reemplazos
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Agregar nota de modificación si hubo cambios
    if ($content -ne $originalContent) {
        # Buscar la línea de fecha
        if ($content -match '-- Date: (\d{4}-\d{2}-\d{2})') {
            $dateMatch = $matches[0]
            $modificationNote = "$dateMatch`r`n-- Modified: $(Get-Date -Format 'yyyy-MM-dd') - Updated to use limpio.pedidos schema"
            $content = $content -replace [regex]::Escape($dateMatch), $modificationNote
        }
        
        # Guardar archivo actualizado
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "   ✅ Actualizado exitosamente" -ForegroundColor Green
        $updatedFiles++
    } else {
        Write-Host "   ⏭️  Sin cambios necesarios" -ForegroundColor Gray
        $skippedFiles++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE ACTUALIZACIÓN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Total de archivos procesados: $totalFiles" -ForegroundColor White
Write-Host "✅ Archivos actualizados:     $updatedFiles" -ForegroundColor Green
Write-Host "⏭️  Archivos sin cambios:      $skippedFiles" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Backup guardado en: $backupPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 SIGUIENTE PASO:" -ForegroundColor Cyan
Write-Host "   Ejecutar: Get-Content database\fix-migration-036.sql | docker exec -i 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos" -ForegroundColor White
Write-Host ""
