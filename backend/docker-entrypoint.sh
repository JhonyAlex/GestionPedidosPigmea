#!/bin/sh

# Este script se ejecuta cada vez que el contenedor de Docker se inicia.

# 1. Ejecutar las migraciones de la base de datos
echo "

📜 Ejecutando migraciones de la base de datos..."
./run-migrations.sh

# Verificar si las migraciones fallaron
if [ $? -ne 0 ]; then
    echo "

❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.

"
    exit 1
fi

# 2. Iniciar la aplicación principal (el servidor de Node.js)
echo "

🚀 Migraciones completadas. Iniciando servidor Node.js..."
exec node /app/backend/index.js
