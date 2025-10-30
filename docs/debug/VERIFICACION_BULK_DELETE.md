# ✅ VERIFICACIÓN Y DIAGNÓSTICO: Bulk Delete Error 404

## 🎯 RESUMEN

He añadido **logs de depuración extensivos** en los siguientes archivos:

1. ✅ `backend/middleware/auth.js` - Middleware de autenticación
2. ✅ `backend/middleware/permissions.js` - Middleware de permisos
3. ✅ `backend/postgres-client.js` - Ya tenía logs en `hasPermission()`

## 🚀 PASOS PARA DIAGNOSTICAR

### 1. Reiniciar el Backend

```powershell
# En PowerShell, navegar al directorio del backend
cd "c:\Users\JhonyAlx\Desktop\Proyectos Desarrollo\GestionPedidosPigmea\backend"

# Detener el servidor si está corriendo (Ctrl+C)

# Reiniciar el servidor
npm start

# O si usas nodemon
npm run dev
```

### 2. Probar la Operación Bulk Delete desde el Frontend

1. Abre el navegador y accede a tu aplicación
2. Inicia sesión con un usuario que tenga permisos de administrador
3. Selecciona varios pedidos
4. Intenta eliminarlos usando la función bulk delete
5. **Observa los logs en la consola del backend**

### 3. Analizar los Logs

Deberías ver algo como esto en la consola del backend:

```
🔑 authenticateUser middleware
   - Ruta: DELETE /api/pedidos/bulk-delete
   - Headers recibidos: { userId: 'xxx-xxx-xxx', userRole: 'Administrador', hasPermissions: true }
   - Buscando usuario en BD...
   - ✅ Usuario encontrado en BD: admin
   - ✅ Usuario autenticado: xxx-xxx-xxx (ADMIN)

🔐 requirePermission middleware
   - Ruta: DELETE /api/pedidos/bulk-delete
   - Permiso requerido: pedidos.delete
   - Usuario: xxx-xxx-xxx (ADMIN)
   - Headers: { userId: 'xxx-xxx-xxx', userRole: 'Administrador' }
   - Verificando permiso en BD...

🔍 Verificando permiso 'pedidos.delete' para usuario ID: xxx-xxx-xxx
👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
   
   - Resultado: ✅ PERMITIDO
✅ Permiso concedido - continuando con la request

🗑️ Eliminando 3 pedidos en operación masiva...
✅ 3 de 3 pedidos eliminados exitosamente
```

### 4. Identificar el Problema

Los logs te dirán **exactamente dónde falla**:

#### ❌ Caso 1: Usuario No Autenticado
```
🔑 authenticateUser middleware
   - Headers recibidos: { userId: 'NO PRESENTE', userRole: 'NO PRESENTE', hasPermissions: false }
   - ⚠️ No hay userId en headers - ruta pública o error de autenticación

🔐 requirePermission middleware
   - Usuario: No autenticado
❌ Usuario no autenticado - rechazando con 401
```

**SOLUCIÓN**: El frontend no está enviando los headers correctamente. Verificar `localStorage.getItem('pigmea_user')`.

#### ❌ Caso 2: Usuario Sin Permisos
```
🔑 authenticateUser middleware
   - ✅ Usuario autenticado: xxx-xxx-xxx (OPERATOR)

🔐 requirePermission middleware
   - Permiso requerido: pedidos.delete
   - Usuario: xxx-xxx-xxx (OPERATOR)

🔍 Verificando permiso 'pedidos.delete' para usuario ID: xxx-xxx-xxx
👤 Usuario encontrado: operador, rol: OPERATOR
🔧 Usando permisos por defecto para rol: OPERATOR
✅ Permiso 'pedidos.delete' DENEGADO por defecto

   - Resultado: ❌ DENEGADO
❌ Permiso denegado - rechazando con 403
```

**SOLUCIÓN**: El usuario necesita el permiso `pedidos.delete`. Asignarlo desde la interfaz de administración o cambiar el rol a Administrador.

#### ❌ Caso 3: Base de Datos No Disponible
```
🔍 Verificando permiso 'pedidos.delete' para usuario ID: xxx-xxx-xxx
🔧 BD no disponible, usando permisos del frontend en modo desarrollo
✅ Permiso 'pedidos.delete' DENEGADO según permisos del frontend
```

**SOLUCIÓN**: La BD no está conectada o el usuario no tiene permisos en el frontend. Verificar conexión a PostgreSQL.

## 🔧 SOLUCIONES RÁPIDAS

### Solución 1: Usuario Sin Permisos (RECOMENDADO)

Si el usuario no tiene el permiso `pedidos.delete`:

1. **Opción A: Cambiar el rol del usuario a Administrador**
   ```sql
   -- En PostgreSQL
   UPDATE admin_users 
   SET role = 'ADMIN' 
   WHERE username = 'tu_usuario';
   ```

2. **Opción B: Asignar el permiso específico**
   ```sql
   -- En PostgreSQL
   INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
   VALUES ('tu_user_id', 'pedidos.delete', true, 'tu_user_id')
   ON CONFLICT (user_id, permission_id) 
   DO UPDATE SET enabled = true;
   ```

3. **Opción C: Desde el Frontend**
   - Ve a "Gestión de Usuarios"
   - Edita el usuario
   - Marca el permiso "Eliminar Pedidos"
   - Guarda los cambios

### Solución 2: Headers No Se Envían

Si los headers no llegan al backend, verificar en `hooks/useBulkOperations.ts`:

```typescript
// Asegúrate de que esta parte esté correcta
const userString = localStorage.getItem('pigmea_user');
const user = userString ? JSON.parse(userString) : null;

if (!user) {
  console.error('❌ No hay usuario en localStorage');
  throw new Error('No autenticado');
}

console.log('📤 Enviando headers:', {
  userId: user.id,
  userRole: user.role
});

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-user-id': user.id,
  'x-user-role': user.role,
};
```

### Solución 3: Bypass Temporal para Desarrollo (SOLO DESARROLLO)

Si necesitas que funcione YA temporalmente, edita `backend/index.js` línea 1434:

```javascript
// ANTES (con autenticación)
app.delete('/api/pedidos/bulk-delete', requirePermission('pedidos.delete'), async (req, res) => {

// DESPUÉS (sin autenticación - SOLO PARA DESARROLLO)
app.delete('/api/pedidos/bulk-delete', async (req, res) => {
  console.log('⚠️ MODO DESARROLLO: Autenticación deshabilitada para bulk-delete');
```

**⚠️ IMPORTANTE**: Esto debe revertirse antes de ir a producción.

## 🧪 TESTING MANUAL

### Probar con cURL (PowerShell)

```powershell
# Obtener tu user ID
$user = Get-Content "$env:APPDATA\Local\Google\Chrome\User Data\Default\Local Storage\..." # O revisar en DevTools

# Probar el endpoint
$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = "TU_USER_ID_AQUI"
    "x-user-role" = "Administrador"
}

$body = @{
    ids = @("id-pedido-1", "id-pedido-2")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/pedidos/bulk-delete" `
    -Method DELETE `
    -Headers $headers `
    -Body $body `
    -ContentType "application/json" | Format-List
```

### Verificar Respuesta Esperada

✅ **Éxito (200)**:
```json
{
  "success": true,
  "deletedCount": 2,
  "message": "2 pedidos eliminados exitosamente."
}
```

❌ **No Autenticado (401)**:
```json
{
  "error": "No autenticado",
  "message": "Debe iniciar sesión para acceder a este recurso"
}
```

❌ **Sin Permisos (403)**:
```json
{
  "error": "Acceso denegado",
  "message": "No tiene los permisos necesarios para esta acción",
  "requiredPermission": "pedidos.delete"
}
```

## 📊 CHECKLIST DE VERIFICACIÓN

Marca cada ítem mientras diagnosticas:

- [ ] Backend reiniciado con los nuevos logs
- [ ] Usuario autenticado en el frontend
- [ ] `localStorage.getItem('pigmea_user')` tiene datos válidos
- [ ] Headers `x-user-id` y `x-user-role` se envían (verificar en Network tab)
- [ ] Logs del backend muestran "authenticateUser middleware"
- [ ] Logs del backend muestran "requirePermission middleware"
- [ ] Usuario tiene rol de Administrador O permiso `pedidos.delete`
- [ ] Base de datos PostgreSQL está conectada
- [ ] No hay errores 500 en los logs del backend
- [ ] Endpoint responde con 200, 401, 403 o 500 (no 404)

## 📞 PRÓXIMOS PASOS

1. ✅ Reinicia el backend
2. ✅ Intenta la operación bulk delete
3. ✅ Copia los logs completos de la consola del backend
4. ✅ Reporta aquí qué logs viste

Con los logs podremos identificar **exactamente** dónde falla y dar una solución precisa.

---

**Archivos modificados**:
- ✅ `backend/middleware/auth.js`
- ✅ `backend/middleware/permissions.js`
- ✅ `backend/postgres-client.js` (ya tenía logs)

**Estado**: Listo para diagnóstico
**Fecha**: 19 de octubre de 2025
