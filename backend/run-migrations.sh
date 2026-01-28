#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../database/migrations"

echo "=== INICIANDO SCRIPT DE MIGRACIÓN DE BASE DE DATOS ==="

# Construir conexión
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Usando DATABASE_URL para la conexión."
    PSQL_CONN="-d $DATABASE_URL"
else
    echo "❌ DATABASE_URL no definida."
    exit 1
fi

# Función para aplicar migraciones
apply_migration() {
    NAME=$1
    FILE=$2

    if [ ! -f "$FILE" ]; then
        echo "❌ Archivo no encontrado: $FILE"
        exit 1
    fi

    echo "🔄 Aplicando migración: $NAME..."
    psql $PSQL_CONN -v ON_ERROR_STOP=1 -f "$FILE"
    echo "✅ Migración '$NAME' aplicada."
}

# ---- ORDEN CORRECTO ----

# 1️⃣ Funciones (SIEMPRE PRIMERO)
apply_migration "Función update_modified_column" \
  "$MIGRATIONS_DIR/000-create-update-modified-function.sql"

# 2️⃣ Tablas base
apply_migration "Crear Tabla de Pedidos" \
  "$MIGRATIONS_DIR/000-create-pedidos-table.sql"

apply_migration "Crear Tabla de Clientes" \
  "$MIGRATIONS_DIR/001-add-clientes-system.sql"

# 3️⃣ Migraciones de Clientes
apply_migration "Fix Clientes Structure" \
  "$MIGRATIONS_DIR/002-fix-clientes-structure.sql"

apply_migration "Agregar Razón Social" \
  "$MIGRATIONS_DIR/003-add-razon-social.sql"

# 4️⃣ Campos de Pedidos
apply_migration "Agregar Nueva Fecha de Entrega" \
  "$MIGRATIONS_DIR/006-add-nueva-fecha-entrega.sql"

apply_migration "Agregar Número de Compra" \
  "$MIGRATIONS_DIR/007-add-numero-compra.sql"

apply_migration "Convertir Números de Compra a Array" \
  "$MIGRATIONS_DIR/008-convert-numero-compra-to-array.sql"

apply_migration "Agregar Información de Cliché" \
  "$MIGRATIONS_DIR/009-add-cliche-info.sql"

apply_migration "Auto-actualizar Estado de Cliente" \
  "$MIGRATIONS_DIR/010-auto-update-cliente-estado.sql"

apply_migration "Agregar Campo Anónimo" \
  "$MIGRATIONS_DIR/011-add-anonimo.sql"

apply_migration "Agregar Fechas de Cliché" \
  "$MIGRATIONS_DIR/013-add-cliche-dates.sql"

# 5️⃣ Gestión de Vendedores
apply_migration "Crear Tabla de Vendedores" \
  "$MIGRATIONS_DIR/014-create-vendedores-table.sql"

apply_migration "Agregar Vendedor FK a Pedidos" \
  "$MIGRATIONS_DIR/015-add-vendedor-fk-to-pedidos.sql"

# 6️⃣ Campos adicionales de Pedidos
apply_migration "Agregar Observaciones de Material" \
  "$MIGRATIONS_DIR/016-add-observaciones-material.sql"

apply_migration "Renombrar DTO de Compra" \
  "$MIGRATIONS_DIR/017-rename-dto-compra.sql"

apply_migration "Agregar Campos de Perforado" \
  "$MIGRATIONS_DIR/018-add-perforado-fields.sql"

apply_migration "Agregar Post-Impresión para Anónimos" \
  "$MIGRATIONS_DIR/019-add-anonimo-post-impresion.sql"

# 7️⃣ Tablas de Auditoría e Historia
apply_migration "Crear Historial de Clientes" \
  "$MIGRATIONS_DIR/020-create-clientes-history.sql"

apply_migration "Crear Historial de Vendedores" \
  "$MIGRATIONS_DIR/021-create-vendedores-history.sql"

# 8️⃣ Estado y Optimización
apply_migration "Agregar Estado de Pedido" \
  "$MIGRATIONS_DIR/022-add-estado-pedido.sql"

apply_migration "Agregar Índices de Rendimiento" \
  "$MIGRATIONS_DIR/023-add-performance-indexes.sql"

apply_migration "Agregar Tiempo de Producción Decimal" \
  "$MIGRATIONS_DIR/024-add-tiempo-produccion-decimal.sql"

# 9️⃣ Tablas de Sistema
apply_migration "Crear Tabla de Notificaciones" \
  "$MIGRATIONS_DIR/025-create-notifications-table.sql"

apply_migration "Crear Tabla de Seguimiento de Producción" \
  "$MIGRATIONS_DIR/026-create-produccion-tracking.sql"

apply_migration "Crear Tabla de Materiales" \
  "$MIGRATIONS_DIR/027-create-materiales-table.sql"

apply_migration "Crear Plantillas de Observaciones" \
  "$MIGRATIONS_DIR/028-create-observaciones-templates.sql"

# 🔟 Campos Adicionales
apply_migration "Agregar Observaciones Rápidas" \
  "$MIGRATIONS_DIR/029-add-observaciones-rapidas.sql"

apply_migration "Agregar Velocidad Posible" \
  "$MIGRATIONS_DIR/030-add-velocidad-posible.sql"

apply_migration "Corregir Vista Pedidos Disponibles" \
  "$MIGRATIONS_DIR/031-fix-pedidos-disponibles-view.sql"

apply_migration "Agregar Menciones a Comentarios" \
  "$MIGRATIONS_DIR/032-add-mentions-to-comments.sql"

# 1️⃣1️⃣ Historiales y Acciones
apply_migration "Crear Tabla de Historial de Acciones" \
  "$MIGRATIONS_DIR/033-create-action-history-table.sql"

apply_migration "Crear Tabla de Instrucciones de Análisis" \
  "$MIGRATIONS_DIR/034-create-analysis-instructions-table.sql"

apply_migration "Agregar Checkbox de Atención a Observaciones" \
  "$MIGRATIONS_DIR/035-add-atencion-observaciones.sql"

apply_migration "Agregar Campo Antivaho Realizado" \
  "$MIGRATIONS_DIR/036-add-antivaho-realizado.sql"

echo ""
echo "✅ ¡TODAS LAS MIGRACIONES COMPLETADAS EXITOSAMENTE!"
echo "=== FIN DEL SCRIPT DE MIGRACIÓN ==="
