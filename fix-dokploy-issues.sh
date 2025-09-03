#!/bin/bash

echo "🔧 SCRIPT DE CORRECCIÓN PARA DOKPLOY"
echo "====================================="

# 1. Actualizar contraseña de admin en PostgreSQL
echo "📝 1. Actualizando contraseña de admin..."
echo "Ejecuta esto en la terminal de PostgreSQL:"
echo ""
echo "psql -U pigmea_user -d gestion_pedidos"
echo ""
echo "UPDATE public.admin_users SET password_hash = '\$2a\$12\$6q8VqrIAoJK5.dj8vOo7P.0pozuaZN15NPS11HqC/d5pMAWVJTyfi' WHERE username = 'admin';"
echo ""
echo "SELECT id, username, role, is_active FROM public.admin_users WHERE username = 'admin';"
echo ""

# 2. Variables de entorno para WebSockets
echo "🌐 2. Variables de entorno adicionales para WebSockets:"
echo "Agrega estas variables en Dokploy Environment:"
echo ""
echo "WEBSOCKET_ENABLED=true"
echo "FORCE_NEW_CONNECTION=true"
echo "SOCKET_TRANSPORTS=polling,websocket"
echo ""

# 3. Credenciales para testing
echo "🧪 3. Credenciales para probar:"
echo "Usuario: admin"
echo "Contraseña: Admin#2025!"
echo ""

# 4. URLs de verificación
echo "🔗 4. URLs para verificar:"
echo "Health: https://planning.pigmea.click/health"
echo "Login: https://planning.pigmea.click/api/auth/login"
echo "App: https://planning.pigmea.click"
echo ""

echo "✅ Una vez ejecutados estos pasos, reinicia la aplicación en Dokploy"
