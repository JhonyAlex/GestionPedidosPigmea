# Sistema de Almacenamiento Persistente

Este documento explica las opciones de almacenamiento persistente para la aplicación de Gestión de Pedidos.

## Problema Actual

La aplicación usa almacenamiento en memoria cuando no está en Google Cloud, lo que significa que todos los datos se pierden al reiniciar el contenedor en Dokploy.

## Soluciones Disponibles

### 1. SQLite con Volumen Persistente (Recomendado para Dokploy)

SQLite es una base de datos de archivo que se puede persistir fácilmente con volúmenes Docker.

#### Configuración necesaria:
- Instalar sqlite3 en el backend
- Crear esquemas de base de datos
- Mapear volumen en Dokploy: `/app/data` → volumen persistente

### 2. PostgreSQL/MySQL Externa

Usar una base de datos externa como PostgreSQL o MySQL.

#### Configuración necesaria:
- Variables de entorno para conexión
- Cliente de base de datos (pg o mysql2)
- Migraciones de esquema

### 3. MongoDB

Base de datos NoSQL que mantiene la estructura similar a Firestore.

#### Configuración necesaria:
- MongoDB como servicio separado
- Variables de entorno para conexión
- Adaptador MongoDB

### 4. Archivo JSON Persistente (Más Simple)

Para casos de uso pequeños, un archivo JSON con volumen persistente.

#### Configuración necesaria:
- Directorio `/app/data` con volumen persistente
- Sistema de bloqueo para escrituras concurrentes

## Implementación Recomendada: SQLite

SQLite es la solución más simple y robusta para este caso de uso.
