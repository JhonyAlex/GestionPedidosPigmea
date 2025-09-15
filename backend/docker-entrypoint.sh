#!/bin/sh

# Este script se ejecuta cada vez que el contenedor de Docker se inicia.

# 1. Ejecutar las migraciones de la base de datos
# Nos movemos al directorio del backend para que pueda encontrar el script
cd /app/backend
./run-migrations.sh

# Verificar si las migraciones fallaron
if [ $? -ne 0 ]; then
    echo "

❌ LAS MIGRACIONES DE LA BASE DE DATOS FALLARON. EL SERVIDOR NO SE INICIARÁ.

"
    exit 1
fi

# 2. Iniciar la aplicación principal (el servidor de Node.js)
# Volvemos al directorio principal de la aplicación
cd /app
echo "

🚀 Migraciones completadas. Iniciando servidor Node.js..."
exec node backend/index.js
