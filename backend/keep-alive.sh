#!/bin/bash

# Script para mantener el servidor ejecutándose
# Monitorea cada 30 segundos y reinicia si es necesario

LOG_FILE="/workspaces/GestionPedidosPigmea/backend/server.log"
PID_FILE="/workspaces/GestionPedidosPigmea/backend/server.pid"
PORT=3001
MAX_RESTARTS=0

check_and_restart() {
    # Verificar si el servidor está respondiendo
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health 2>/dev/null)
    
    if [ "$response" != "200" ]; then
        echo "[$(date)] ⚠️ Servidor no responde (Status: $response). Reiniciando..." >> "$LOG_FILE"
        
        # Matar procesos anteriores
        pkill -f "npm start" 2>/dev/null || true
        pkill -f "node index.js" 2>/dev/null || true
        
        # Limpiar puerto
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        
        sleep 2
        
        # Reiniciar servidor
        cd /workspaces/GestionPedidosPigmea/backend
        nohup npm start >> "$LOG_FILE" 2>&1 &
        echo $! > "$PID_FILE"
        echo "[$(date)] ✅ Servidor reiniciado. PID: $!" >> "$LOG_FILE"
        
        sleep 3
    else
        echo "[$(date)] ✅ Servidor activo" >> "$LOG_FILE"
    fi
}

# Iniciar servidor si no está corriendo
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health 2>/dev/null | grep -q "200"; then
    echo "[$(date)] Iniciando servidor..." >> "$LOG_FILE"
    cd /workspaces/GestionPedidosPigmea/backend
    nohup npm start >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 3
fi

# Monitoreo continuo
while true; do
    check_and_restart
    sleep 30
done
