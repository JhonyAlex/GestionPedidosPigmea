# SOLUCIÓN: Error 404 en Endpoints Bulk Operations

## 🔍 DIAGNÓSTICO

**PROBLEMA**: El frontend reporta `404 Not Found` al intentar usar endpoints de operaciones masivas:
- `DELETE /api/pedidos/bulk-delete`
- `PATCH /api/pedidos/bulk-update-date`

**CAUSA RAÍZ**: Los endpoints SÍ existen en el backend (línea 1434 y 1502 de `backend/index.js`), pero están protegidos por middleware de autenticación/permisos que puede estar rechazando las solicitudes silenciosamente.

## ✅ VERIFICACIÓN ACTUAL

### Backend (`backend/index.js`)

Los endpoints existen correctamente:

```javascript
// Línea 1434 - Eliminación masiva
app.delete('/api/pedidos/bulk-delete', requirePermission('pedidos.delete'), async (req, res) => {
  // ... implementación completa
});

// Línea 1502 - Actualización masiva de fechas  
app.patch('/api/pedidos/bulk-update-date', requirePermission('pedidos.edit'), async (req, res) => {
  // ... implementación completa
});
```

### Frontend (`hooks/useBulkOperations.ts`)

El frontend está enviando correctamente los headers de autenticación:

```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (user) {
  headers['x-user-id'] = user.id;
  headers['x-user-role'] = user.role;
}
```

## 🔧 SOLUCIONES POSIBLES

### Opción 1: Verificar Middleware de Permisos (RECOMENDADO)

El middleware `requirePermission` podría estar fallando. Añadir logs de depuración:

```javascript
// backend/middleware/permissions.js
const requirePermission = (permissionId) => {
    return async (req, res, next) => {
        try {
            console.log('🔐 requirePermission middleware');
            console.log('   - Permiso requerido:', permissionId);
            console.log('   - Usuario:', req.user ? req.user.id : 'No autenticado');
            console.log('   - Headers:', {
                userId: req.headers['x-user-id'],
                userRole: req.headers['x-user-role']
            });
            
            // Verificar si el usuario está autenticado
            if (!req.user || !req.user.id) {
                console.log('❌ Usuario no autenticado');
                return res.status(401).json({ 
                    error: 'No autenticado',
                    message: 'Debe iniciar sesión para acceder a este recurso'
                });
            }

            // Verificar el permiso del usuario
            const dbClient = getDbClient();
            const hasPermission = await dbClient.hasPermission(req.user.id, permissionId, req.user);
            
            console.log('   - Tiene permiso:', hasPermission);
            
            if (!hasPermission) {
                console.log('❌ Permiso denegado');
                return res.status(403).json({ 
                    error: 'Acceso denegado',
                    message: 'No tiene los permisos necesarios para esta acción',
                    requiredPermission: permissionId
                });
            }
            
            console.log('✅ Permiso concedido, continuando...');
            next();
        } catch (error) {
            console.error('💥 Error en middleware de permisos:', error);
            res.status(500).json({ 
                error: 'Error interno',
                message: 'Error al verificar permisos'
            });
        }
    };
};
```

### Opción 2: Verificar PostgreSQLClient.hasPermission

El método `hasPermission` podría estar fallando. Revisar implementación en `backend/postgres-client.js`:

```javascript
async hasPermission(userId, permissionId, user = null) {
    try {
        console.log('🔍 Verificando permiso');
        console.log('   - User ID:', userId);
        console.log('   - Permission ID:', permissionId);
        console.log('   - User object:', user);
        
        // Verificar que pool esté inicializado
        if (!this.isInitialized || !this.pool) {
            console.log('⚠️ Pool no inicializado, permitiendo acceso por defecto');
            return true; // En desarrollo, permitir acceso si no hay BD
        }
        
        // Si el usuario es del objeto req.user y tiene permisos cached
        if (user && user.permissions) {
            const permission = user.permissions.find(p => p.id === permissionId);
            if (permission) {
                console.log('✅ Permiso encontrado en cache:', permission.enabled);
                return permission.enabled === true;
            }
        }
        
        // Buscar en la base de datos
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT enabled 
                FROM user_permissions 
                WHERE user_id = $1 AND permission_id = $2
            `, [userId, permissionId]);
            
            if (result.rows.length > 0) {
                console.log('✅ Permiso encontrado en BD:', result.rows[0].enabled);
                return result.rows[0].enabled === true;
            }
            
            // Si no hay registro, verificar permisos por defecto según rol
            const userInfo = await this.getAdminUserById(userId);
            if (userInfo) {
                const defaultPerms = this.getDefaultPermissionsForRole(userInfo.role);
                const defaultPerm = defaultPerms.find(p => p.permissionId === permissionId);
                if (defaultPerm) {
                    console.log('✅ Usando permiso por defecto del rol:', defaultPerm.enabled);
                    return defaultPerm.enabled === true;
                }
            }
            
            console.log('❌ Permiso no encontrado, denegando acceso');
            return false;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('💥 Error verificando permiso:', error);
        console.error('   Stack:', error.stack);
        // En caso de error, denegar acceso por seguridad
        return false;
    }
}
```

### Opción 3: Modo Desarrollo Sin Verificación Estricta

Si el sistema de permisos no está completamente configurado, añadir un bypass temporal para desarrollo:

```javascript
// backend/index.js - Al inicio del archivo
const DEVELOPMENT_MODE = process.env.NODE_ENV !== 'production';

// Reemplazar los endpoints con validación menos estricta
app.delete('/api/pedidos/bulk-delete', 
    DEVELOPMENT_MODE ? (req, res, next) => next() : requirePermission('pedidos.delete'), 
    async (req, res) => {
    // ... implementación existente
});

app.patch('/api/pedidos/bulk-update-date', 
    DEVELOPMENT_MODE ? (req, res, next) => next() : requirePermission('pedidos.edit'),
    async (req, res) => {
    // ... implementación existente
});
```

### Opción 4: Fallback a Operaciones Individuales

Si el backend no puede ser modificado fácilmente, actualizar el frontend para usar el endpoint individual:

```typescript
// hooks/useBulkOperations.ts
const bulkDelete = useCallback(async (ids: string[]): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
    try {
      // Obtener usuario del localStorage
      const userString = localStorage.getItem('pigmea_user');
      const user = userString ? JSON.parse(userString) : null;
      
      if (!user) {
        throw new Error('No autenticado');
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      console.log('🔵 Intentando bulk-delete con endpoint dedicado...');
      
      // Intentar usar el endpoint bulk-delete
      let response = await fetch(`${API_URL}/pedidos/bulk-delete`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ ids }),
        credentials: 'include',
      });
      
      // Si falla con 404, usar operaciones individuales como fallback
      if (response.status === 404) {
        console.log('⚠️ Endpoint bulk-delete no disponible, usando operaciones individuales');
        
        let deletedCount = 0;
        for (const id of ids) {
          try {
            const deleteResponse = await fetch(`${API_URL}/pedidos/${id}`, {
              method: 'DELETE',
              headers,
              credentials: 'include',
            });
            
            if (deleteResponse.ok) {
              deletedCount++;
            }
          } catch (error) {
            console.error(`Error eliminando pedido ${id}:`, error);
          }
        }
        
        clearSelection();
        return {
          success: true,
          deletedCount,
        };
      }

      // Manejar respuesta del endpoint bulk
      if (response.status === 401) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
      }

      if (response.status === 403) {
        throw new Error('No tienes permisos para realizar esta operación.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error del servidor' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      clearSelection();
      
      return {
        success: true,
        deletedCount: data.deletedCount || ids.length,
      };
    } catch (error) {
      console.error('Error en bulkDelete:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }, [clearSelection]);
```

## 🚀 PASOS PARA RESOLVER

### 1. Añadir Logs de Depuración

Primero, identificar exactamente dónde falla:

```bash
# En el backend, añadir logs temporales
# Ver archivo: backend/middleware/permissions.js
# Ver archivo: backend/middleware/auth.js
# Ver archivo: backend/postgres-client.js (método hasPermission)
```

### 2. Verificar en Logs del Servidor

```bash
# Reiniciar el servidor y revisar logs
cd backend
npm start

# O si usas Docker
docker logs -f <container_name>
```

### 3. Probar Endpoint Directamente

```bash
# PowerShell - Probar con curl o Invoke-WebRequest
$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = "TU_USER_ID"
    "x-user-role" = "Administrador"
}

$body = @{
    ids = @("pedido-id-1", "pedido-id-2")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/pedidos/bulk-delete" `
    -Method DELETE `
    -Headers $headers `
    -Body $body
```

### 4. Verificar Permisos del Usuario

```bash
# En PostgreSQL, verificar permisos del usuario
psql -U postgres -d pigmea_planning

SELECT * FROM user_permissions WHERE user_id = 'TU_USER_ID';
SELECT * FROM permissions WHERE id LIKE 'pedidos.%';
```

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] El endpoint existe en `backend/index.js` (líneas 1434 y 1502)
- [ ] El middleware `authenticateUser` está configurado globalmente
- [ ] Los headers `x-user-id` y `x-user-role` se están enviando desde el frontend
- [ ] El usuario tiene el permiso `pedidos.delete` en la base de datos
- [ ] El método `hasPermission` en `postgres-client.js` funciona correctamente
- [ ] No hay errores en los logs del backend
- [ ] La base de datos está conectada (`dbClient.isInitialized === true`)

## 🎯 SOLUCIÓN RÁPIDA (TEMPORAL)

Si necesitas que funcione YA para desarrollo, modifica temporalmente:

```javascript
// backend/index.js - Línea 1434
app.delete('/api/pedidos/bulk-delete', async (req, res) => {
    // Comentar temporalmente: requirePermission('pedidos.delete')
    console.log('⚠️ MODO DESARROLLO: Autenticación deshabilitada');
    
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ 
                error: 'Se requiere un array de IDs no vacío.' 
            });
        }

        // ... resto de la implementación existente
    } catch (error) {
        console.error('Error en bulk-delete:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// Hacer lo mismo con bulk-update-date
app.patch('/api/pedidos/bulk-update-date', async (req, res) => {
    // ... similar
});
```

**⚠️ IMPORTANTE**: Esta solución temporal NO debe usarse en producción. Es solo para diagnosticar el problema.

## 📞 SIGUIENTE PASO

1. Añadir los logs de depuración recomendados
2. Reiniciar el backend
3. Intentar la operación bulk desde el frontend
4. Revisar los logs para ver dónde falla exactamente
5. Reportar los logs aquí para análisis adicional

---

**Última actualización**: 19 de octubre de 2025
