#!/bin/bash

# Script para subir el panel de administración a producción

echo "🚀 Subiendo Panel de Administración a Producción"
echo "================================================"

# Configuración (AJUSTAR SEGÚN TU SERVIDOR)
SERVER_USER="tu-usuario"  # Cambiar por tu usuario SSH
SERVER_HOST="planning.pigmea.click"  # Tu servidor
SERVER_PATH="/ruta/de/tu/aplicacion"  # Cambiar por la ruta real

echo "⚠️  CONFIGURAR ANTES DE EJECUTAR:"
echo "   1. Cambiar SERVER_USER por tu usuario SSH"
echo "   2. Cambiar SERVER_PATH por la ruta de tu aplicación"
echo "   3. Asegurarte de tener acceso SSH al servidor"
echo ""

read -p "¿Has configurado las variables? (y/N): " CONFIGURED
if [[ ! "$CONFIGURED" =~ ^[Yy]$ ]]; then
    echo "❌ Por favor configura las variables primero"
    exit 1
fi

echo ""
echo "📦 Preparando archivos..."

# Crear directorio temporal
TMP_DIR="/tmp/admin-deployment-$(date +%s)"
mkdir -p "$TMP_DIR"

# Copiar archivos necesarios
echo "📋 Copiando backend actualizado..."
cp /workspaces/GestionPedidosPigmea/backend/index.js "$TMP_DIR/"

echo "📋 Copiando panel de administración..."
cp -r /workspaces/GestionPedidosPigmea/admin/dist "$TMP_DIR/admin-dist"

echo "📋 Creando backup del servidor actual..."
echo "#!/bin/bash
# Backup del servidor actual
cp \$1/backend/index.js \$1/backend/index.js.backup-\$(date +%Y%m%d-%H%M%S)
if [ -d \"\$1/admin\" ]; then
    mv \$1/admin \$1/admin.backup-\$(date +%Y%m%d-%H%M%S)
fi
" > "$TMP_DIR/backup.sh"

echo "📋 Creando script de actualización..."
echo "#!/bin/bash
# Script de actualización en el servidor
echo '🔄 Actualizando aplicación...'

# Backup
bash /tmp/backup.sh \$1

# Actualizar backend
cp /tmp/admin-deployment-*/index.js \$1/backend/

# Crear directorio admin
mkdir -p \$1/admin

# Copiar panel de administración
cp -r /tmp/admin-deployment-*/admin-dist/* \$1/admin/

echo '✅ Archivos actualizados'
echo '🔄 Reinicia tu aplicación (pm2, systemctl, etc.)'
" > "$TMP_DIR/update.sh"

chmod +x "$TMP_DIR/backup.sh"
chmod +x "$TMP_DIR/update.sh"

echo ""
echo "📡 Subiendo archivos al servidor..."

# Subir archivos
scp -r "$TMP_DIR" "$SERVER_USER@$SERVER_HOST:/tmp/"

echo ""
echo "🔧 Ejecutando actualización en el servidor..."
ssh "$SERVER_USER@$SERVER_HOST" "bash /tmp/admin-deployment-*/update.sh $SERVER_PATH"

echo ""
echo "🔄 Recordatorio: REINICIA TU APLICACIÓN"
echo "   Ejemplos:"
echo "   - pm2 restart tu-app"
echo "   - sudo systemctl restart tu-servicio"
echo "   - docker restart tu-contenedor"

echo ""
echo "🧪 Verificación:"
echo "   curl -I https://planning.pigmea.click/admin"
echo "   (Debería devolver HTTP 200)"

echo ""
echo "🌐 URLs finales:"
echo "   App: https://planning.pigmea.click/"
echo "   Admin: https://planning.pigmea.click/admin"
echo "   Login: admin / admin123"

# Limpiar archivos temporales
rm -rf "$TMP_DIR"

echo ""
echo "✅ ¡Deployment completado!"
