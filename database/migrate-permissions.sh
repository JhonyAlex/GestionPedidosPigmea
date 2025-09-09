#!/bin/bash

# Script para migrar permisos de usuarios hardcodeados a la base de datos
# Este script debe ejecutarse después de crear la tabla user_permissions

echo "🔄 Iniciando migración de permisos de usuarios..."

# Variables de conexión a la base de datos
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-gestion_pedidos}
DB_USER=${POSTGRES_USER:-pigmea_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-}

# Función para ejecutar consultas SQL
function run_query() {
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$1"
}

# Verificar la conexión a la base de datos
echo "🔍 Verificando conexión a la base de datos..."
if ! run_query "SELECT 1;" > /dev/null 2>&1; then
  echo "❌ Error: No se pudo conectar a la base de datos."
  exit 1
fi

echo "✅ Conexión exitosa a la base de datos"

# Verificar si existen las tablas necesarias
echo "🔍 Verificando tablas necesarias..."
TABLE_CHECK=$(run_query "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_permissions');")

if ! echo $TABLE_CHECK | grep -q "t"; then
  echo "❌ Error: La tabla user_permissions no existe."
  echo "   Ejecute primero la migración para crear la tabla."
  exit 1
fi

echo "✅ Tabla user_permissions encontrada"

# Ejecutar la migración desde los permisos JSONB a la tabla de permisos
echo "🔄 Migrando permisos de campo JSONB a tabla de permisos..."

# Consulta para migrar permisos
MIGRATION_QUERY="
DO \$\$
DECLARE
  user_record RECORD;
  perm_item JSONB;
  perm_array JSONB;
BEGIN
  -- Iterar sobre todos los usuarios con permisos
  FOR user_record IN 
    SELECT id, username, permissions 
    FROM admin_users 
    WHERE permissions IS NOT NULL AND permissions != '[]'::jsonb
  LOOP
    RAISE NOTICE 'Procesando usuario: %', user_record.username;
    
    -- Verificar si permissions es un array
    IF jsonb_typeof(user_record.permissions) = 'array' THEN
      perm_array := user_record.permissions;
      
      -- Eliminar permisos existentes para este usuario
      DELETE FROM user_permissions WHERE user_id = user_record.id;
      
      -- Iterar sobre cada permiso en el array
      FOR i IN 0..jsonb_array_length(perm_array) - 1 LOOP
        perm_item := perm_array->i;
        
        -- Insertar el permiso en la tabla user_permissions
        INSERT INTO user_permissions 
          (user_id, permission_id, enabled, granted_by, created_at, updated_at)
        VALUES 
          (
            user_record.id, 
            COALESCE(perm_item->>'id', perm_item->>'permissionId')::VARCHAR, 
            COALESCE((perm_item->>'enabled')::BOOLEAN, true), 
            user_record.id,
            NOW(),
            NOW()
          )
        ON CONFLICT (user_id, permission_id) DO UPDATE
          SET enabled = EXCLUDED.enabled, 
              updated_at = NOW();
        
        RAISE NOTICE 'Permiso migrado: % para usuario %', 
          COALESCE(perm_item->>'id', perm_item->>'permissionId'), 
          user_record.username;
      END LOOP;
    ELSE
      RAISE WARNING 'El usuario % tiene un formato de permisos no válido', user_record.username;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migración completada';
END \$\$;
"

# Ejecutar la migración
if run_query "$MIGRATION_QUERY"; then
  echo "✅ Migración de permisos completada exitosamente"
else
  echo "❌ Error durante la migración de permisos"
  exit 1
fi

# Verificar la cantidad de permisos migrados
PERM_COUNT=$(run_query "SELECT COUNT(*) FROM user_permissions;")
echo "📊 Total de permisos migrados: $PERM_COUNT"

# Inicializar permisos por defecto para usuarios sin permisos
echo "🔄 Inicializando permisos por defecto para usuarios sin permisos..."

INIT_DEFAULT_PERMS="
DO \$\$
DECLARE
  user_record RECORD;
  default_perms JSONB;
BEGIN
  -- Iterar sobre todos los usuarios sin permisos
  FOR user_record IN 
    SELECT a.id, a.username, a.role
    FROM admin_users a
    LEFT JOIN (
      SELECT user_id, COUNT(*) as perm_count
      FROM user_permissions
      GROUP BY user_id
    ) p ON a.id = p.user_id
    WHERE p.perm_count IS NULL OR p.perm_count = 0
  LOOP
    RAISE NOTICE 'Inicializando permisos por defecto para: %', user_record.username;
    
    -- Asignar permisos por defecto según el rol
    CASE user_record.role
      WHEN 'ADMIN' THEN
        INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
        VALUES 
          (user_record.id, 'dashboard.view', true, user_record.id),
          (user_record.id, 'pedidos.view', true, user_record.id),
          (user_record.id, 'pedidos.edit', true, user_record.id),
          (user_record.id, 'pedidos.delete', true, user_record.id),
          (user_record.id, 'usuarios.admin', true, user_record.id),
          (user_record.id, 'permisos.admin', true, user_record.id);
          
      WHEN 'SUPERVISOR' THEN
        INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
        VALUES 
          (user_record.id, 'dashboard.view', true, user_record.id),
          (user_record.id, 'pedidos.view', true, user_record.id),
          (user_record.id, 'pedidos.edit', true, user_record.id),
          (user_record.id, 'reportes.view', true, user_record.id);
          
      WHEN 'OPERATOR' THEN
        INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
        VALUES 
          (user_record.id, 'dashboard.view', true, user_record.id),
          (user_record.id, 'pedidos.view', true, user_record.id),
          (user_record.id, 'pedidos.edit', true, user_record.id);
          
      WHEN 'VIEWER' THEN
        INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
        VALUES 
          (user_record.id, 'dashboard.view', true, user_record.id),
          (user_record.id, 'pedidos.view', true, user_record.id);
          
      ELSE
        -- Rol desconocido, asignar solo permisos básicos
        INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
        VALUES 
          (user_record.id, 'view:dashboard', true, user_record.id),
          (user_record.id, 'view:pedidos', true, user_record.id);
    END CASE;
    
    RAISE NOTICE 'Permisos inicializados para usuario %', user_record.username;
  END LOOP;
  
  RAISE NOTICE 'Inicialización de permisos por defecto completada';
END \$\$;
"

# Ejecutar la inicialización de permisos por defecto
if run_query "$INIT_DEFAULT_PERMS"; then
  echo "✅ Inicialización de permisos por defecto completada exitosamente"
else
  echo "❌ Error durante la inicialización de permisos por defecto"
  exit 1
fi

echo "🎉 Migración de permisos completada con éxito"
