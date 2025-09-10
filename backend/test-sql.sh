#!/bin/bash

# Script para probar la corrección del SQL
echo "🧪 Probando corrección del SQL..."

export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=
export POSTGRES_DB=postgres

echo "Variables configuradas:"
echo "POSTGRES_HOST=$POSTGRES_HOST"
echo "POSTGRES_USER=$POSTGRES_USER"
echo "POSTGRES_DB=$POSTGRES_DB"

echo "🚀 Iniciando servidor..."
node index.js
