#!/bin/sh

echo "--- DEBUGGING START ---"
echo "[DEBUG] Timestamp: $(date)"

echo ""
echo "[DEBUG] Current directory:"
pwd

echo ""
echo "[DEBUG] Contents of /app (WORKDIR):"
ls -la /app

echo ""
echo "[DEBUG] Contents of /app/backend:"
ls -la /app/backend

echo ""
echo "[DEBUG] PATH variable:"
echo "$PATH"

echo ""
echo "--- SCRIPT LOCATION DEBUG ---"
echo "[DEBUG] Script path (\$0): $0"
echo "[DEBUG] dirname of script path: $(dirname "$0")"

echo ""
echo "[DEBUG] Changing directory to script location..."
cd "$(dirname "$0")"

echo ""
echo "[DEBUG] New current directory:"
pwd

echo ""
echo "[DEBUG] Contents of new current directory (ls -la .):"
ls -la .

echo ""
echo "--- DEBUGGING END ---"

# Exit cleanly to allow reading the logs
exit 0
