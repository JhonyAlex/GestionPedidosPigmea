#!/bin/bash

# Script de Diagnóstico para Error TLS Timeout en Dokploy
# Ejecutar en el servidor Dokploy con: bash diagnostico-docker.sh

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Diagnóstico de Conectividad Docker - Dokploy                 ║"
echo "║  Proyecto: GestionPedidosPigmea                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar resultados
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ FALLO${NC}"
    fi
}

# 1. Verificar conectividad a Docker Hub
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Probando conectividad a Docker Hub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -I -m 10 https://registry-1.docker.io/v2/ > /dev/null 2>&1
check_result $?
echo ""

# 2. Verificar resolución DNS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Verificando resolución DNS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
nslookup registry-1.docker.io > /dev/null 2>&1
check_result $?
if [ $? -eq 0 ]; then
    nslookup registry-1.docker.io | grep -A1 "Name:" | tail -1
fi
echo ""

# 3. Verificar estado de Docker
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Verificando estado de Docker..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker info > /dev/null 2>&1
check_result $?
if [ $? -eq 0 ]; then
    echo "   Versión Docker: $(docker --version)"
fi
echo ""

# 4. Verificar conectividad a auth.docker.io (el que falla)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Probando conectividad a auth.docker.io (Autenticación)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -I -m 10 https://auth.docker.io/token > /dev/null 2>&1
check_result $?
echo ""

# 5. Probar pull de imagen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Intentando pull de imagen node:18-alpine..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   (esto puede tomar 30-60 segundos)"
timeout 60 docker pull node:18-alpine > /dev/null 2>&1
check_result $?
echo ""

# 6. Verificar espacio en disco
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Verificando espacio en disco..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h / | tail -1 | awk '{print "   Espacio usado: "$5" - Disponible: "$4}'
echo ""

# 7. Verificar configuración de Docker
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Verificando configuración de Docker..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f /etc/docker/daemon.json ]; then
    echo -e "${GREEN}✅ daemon.json existe${NC}"
    echo "   Contenido:"
    cat /etc/docker/daemon.json
else
    echo -e "${YELLOW}⚠️  daemon.json no existe (usando configuración por defecto)${NC}"
fi
echo ""

# 8. Verificar firewall/iptables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Verificando reglas de firewall..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v iptables &> /dev/null; then
    sudo iptables -L | grep -i docker > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Reglas de Docker en iptables encontradas${NC}"
    else
        echo -e "${YELLOW}⚠️  No se encontraron reglas de Docker en iptables${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  iptables no disponible${NC}"
fi
echo ""

# 9. Verificar conectividad general a internet
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  Verificando conectividad general a internet..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ping -c 2 8.8.8.8 > /dev/null 2>&1
check_result $?
echo ""

# 10. Verificar servidores DNS configurados
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔟 Servidores DNS configurados:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat /etc/resolv.conf | grep nameserver
echo ""

# Resumen y recomendaciones
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    RESUMEN Y RECOMENDACIONES                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Determinar el problema principal
CONECTIVIDAD_OK=0
DNS_OK=0
DOCKER_OK=0
PULL_OK=0

curl -I -m 10 https://auth.docker.io/token > /dev/null 2>&1 && CONECTIVIDAD_OK=1
nslookup registry-1.docker.io > /dev/null 2>&1 && DNS_OK=1
docker info > /dev/null 2>&1 && DOCKER_OK=1
docker images | grep "node.*18-alpine" > /dev/null 2>&1 && PULL_OK=1

if [ $PULL_OK -eq 1 ]; then
    echo -e "${GREEN}✅ RESULTADO: La imagen node:18-alpine ya está disponible${NC}"
    echo "   Acción: Reintentar el deploy en Dokploy"
elif [ $CONECTIVIDAD_OK -eq 0 ]; then
    echo -e "${RED}❌ PROBLEMA: No hay conectividad a Docker Hub${NC}"
    echo "   Posibles causas:"
    echo "   - Firewall bloqueando Docker Hub"
    echo "   - Problemas de red del servidor"
    echo "   - Docker Hub temporalmente inaccesible"
    echo ""
    echo "   Soluciones:"
    echo "   1. Verificar firewall del servidor"
    echo "   2. Configurar DNS alternativo (8.8.8.8, 8.8.4.4)"
    echo "   3. Usar un registry mirror alternativo"
    echo "   4. Esperar unos minutos y reintentar"
elif [ $DNS_OK -eq 0 ]; then
    echo -e "${RED}❌ PROBLEMA: Problemas de resolución DNS${NC}"
    echo "   Solución: Configurar DNS de Google"
    echo ""
    echo "   Ejecutar:"
    echo "   sudo nano /etc/docker/daemon.json"
    echo "   Agregar: {\"dns\": [\"8.8.8.8\", \"8.8.4.4\"]}"
    echo "   sudo systemctl restart docker"
elif [ $DOCKER_OK -eq 0 ]; then
    echo -e "${RED}❌ PROBLEMA: Docker no está funcionando correctamente${NC}"
    echo "   Solución:"
    echo "   sudo systemctl restart docker"
else
    echo -e "${YELLOW}⚠️  PROBLEMA: Error temporal de red/timeout${NC}"
    echo "   Solución: Reintentar el pull manual"
    echo ""
    echo "   Ejecutar:"
    echo "   docker pull node:18-alpine"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Para más información, consulta: SOLUCION_ERROR_TLS_TIMEOUT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
