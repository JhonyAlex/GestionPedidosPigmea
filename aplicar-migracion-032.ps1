# Script para aplicar la migración 032 - Sistema de Menciones en Comentarios
# Autor: Sistema
# Fecha: 2026-01-12

# ==========================================
# 📋 VARIABLES DE CONFIGURACIÓN
# ==========================================
$DB_HOST = "localhost"
$DB_NAME = "pigmea_gestion"
$DB_USER = "pigmea_admin"
$DB_PASSWORD = "Diego2013"
$MIGRATION_FILE = "database\migrations\032-add-mentions-to-comments.sql"
$PSQL_PATH = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

# ==========================================
# 🔍 VERIFICAR POSTGRESQL
# ==========================================
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " 🚀 APLICAR MIGRACIÓN 032" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if (-Not (Test-Path $PSQL_PATH)) {
    Write-Host "❌ ERROR: No se encontró PostgreSQL en: $PSQL_PATH" -ForegroundColor Red
    Write-Host "Verifica la ruta de instalación de PostgreSQL" -ForegroundColor Yellow
    exit 1
}

if (-Not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ ERROR: No se encontró el archivo de migración: $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL encontrado: $PSQL_PATH" -ForegroundColor Green
Write-Host "✅ Archivo de migración encontrado: $MIGRATION_FILE" -ForegroundColor Green
Write-Host ""

# ==========================================
# 📊 APLICAR MIGRACIÓN
# ==========================================
Write-Host "Aplicando migración..." -ForegroundColor Yellow
Write-Host ""

$env:PGPASSWORD = $DB_PASSWORD
& $PSQL_PATH -h $DB_HOST -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE
$exitCode = $LASTEXITCODE
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host " ✅ MIGRACIÓN APLICADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cambios realizados:" -ForegroundColor Cyan
    Write-Host "  • Columna 'mentioned_users' agregada a tabla 'pedido_comments'" -ForegroundColor White
    Write-Host "  • Índices GIN creados para búsqueda eficiente" -ForegroundColor White
    Write-Host "  • Tipo 'mention' agregado a notificaciones" -ForegroundColor White
    Write-Host "  • Función get_comments_mentioning_user() creada" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 El sistema de menciones está listo para usar" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "❌ ERROR al aplicar la migración" -ForegroundColor Red
    Write-Host "Código de salida: $exitCode" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
