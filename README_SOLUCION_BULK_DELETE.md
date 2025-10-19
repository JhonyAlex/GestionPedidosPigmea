# 📚 ÍNDICE: Recursos para Solucionar Error 404 Bulk Delete

## 🎯 Descripción del Problema

**Error**: `404 Not Found` al intentar usar endpoints de operaciones masivas (bulk-delete, bulk-update-date)

**Causa**: Los endpoints existen pero están protegidos por middleware de autenticación/permisos que pueden estar rechazando las solicitudes.

---

## 📁 Archivos Creados/Modificados

### 📋 Documentación

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `SOLUCION_ERROR_404_BULK_DELETE.md` | Análisis detallado del problema con 4 opciones de solución | Lectura completa del diagnóstico |
| `VERIFICACION_BULK_DELETE.md` | Guía paso a paso para diagnosticar el error | Seguir instrucciones para identificar el problema |
| `RESUMEN_SOLUCION_BULK_DELETE.md` | Resumen ejecutivo con todos los cambios | Vista rápida de todo lo realizado |
| `README_SOLUCION_BULK_DELETE.md` | Este archivo - índice de recursos | Navegación entre recursos |

### 🔧 Scripts

| Archivo | Descripción | Cómo Ejecutar |
|---------|-------------|---------------|
| `test-bulk-delete.ps1` | Script PowerShell para probar endpoint bulk-delete directamente | `.\test-bulk-delete.ps1` |

### 💾 SQL

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `database/sql-verificar-permisos.sql` | Consultas SQL para verificar/modificar permisos de usuarios | Ejecutar en PostgreSQL |

### 🔨 Código Modificado

| Archivo | Cambios | Propósito |
|---------|---------|-----------|
| `backend/middleware/auth.js` | ✅ Logs añadidos | Diagnosticar problemas de autenticación |
| `backend/middleware/permissions.js` | ✅ Logs añadidos | Diagnosticar problemas de permisos |

---

## 🚀 INICIO RÁPIDO

### 1️⃣ Diagnosticar el Problema

```powershell
# Reiniciar el backend con los nuevos logs
cd backend
npm start

# En otra terminal, probar el endpoint
cd ..
.\test-bulk-delete.ps1
```

### 2️⃣ Ver los Logs

Buscar en la consola del backend:
- 🔑 `authenticateUser middleware`
- 🔐 `requirePermission middleware`
- ✅ `Permiso concedido` / ❌ `Permiso denegado`

### 3️⃣ Solucionar Según el Error

#### Error: Usuario no autenticado (401)
```
❌ Usuario no autenticado - rechazando con 401
```
**Archivo**: `VERIFICACION_BULK_DELETE.md` → Sección "Solución 2: Headers No Se Envían"

#### Error: Sin permisos (403)
```
❌ Permiso denegado - rechazando con 403
```
**Archivo**: `database/sql-verificar-permisos.sql` → Query #5 o #6

#### Error: BD no disponible
```
⚠️ BD no disponible, usando permisos del frontend
```
**Solución**: Verificar conexión a PostgreSQL

---

## 📖 GUÍAS DETALLADAS

### Para Entender el Problema
📄 **Leer**: `SOLUCION_ERROR_404_BULK_DELETE.md`
- Diagnóstico completo
- Explicación técnica del flujo
- 4 opciones de solución
- Ejemplos de código

### Para Diagnosticar
📄 **Seguir**: `VERIFICACION_BULK_DELETE.md`
- Pasos numerados
- Interpretación de logs
- Checklist de verificación
- Ejemplos de logs esperados

### Para Ver un Resumen
📄 **Revisar**: `RESUMEN_SOLUCION_BULK_DELETE.md`
- Todos los cambios realizados
- Archivos modificados
- Próximos pasos
- Soluciones rápidas

---

## 🧪 HERRAMIENTAS DE TESTING

### Script PowerShell: test-bulk-delete.ps1

Prueba el endpoint bulk-delete sin usar el frontend.

**Ventajas**:
- ✅ Aísla el problema (backend vs frontend)
- ✅ Muestra análisis automático de errores
- ✅ Da recomendaciones específicas
- ✅ No requiere modificar código

**Cómo usar**:
```powershell
# Ejecutar en PowerShell
.\test-bulk-delete.ps1

# Seguir las instrucciones:
# 1. Ingresar User ID
# 2. Ingresar User Role
# 3. Ingresar IDs de pedidos
# 4. Confirmar ejecución
```

**Qué hace**:
1. Construye la request HTTP
2. Envía DELETE a `/api/pedidos/bulk-delete`
3. Muestra respuesta detallada
4. Analiza el error (si hay)
5. Da recomendaciones

---

## 🗃️ CONSULTAS SQL ÚTILES

### Verificar Usuario

```sql
-- Ver mi usuario
SELECT * FROM admin_users WHERE username = 'MI_USUARIO';
```

### Verificar Permisos

```sql
-- Ver si tengo pedidos.delete
SELECT 
    au.username,
    COALESCE(up.enabled, false) as tiene_permiso,
    au.role
FROM admin_users au
LEFT JOIN user_permissions up 
    ON au.id = up.user_id 
    AND up.permission_id = 'pedidos.delete'
WHERE au.username = 'MI_USUARIO';
```

### Asignar Permiso

```sql
-- Darme el permiso pedidos.delete
INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
SELECT id, 'pedidos.delete', true, id
FROM admin_users
WHERE username = 'MI_USUARIO'
ON CONFLICT (user_id, permission_id) 
DO UPDATE SET enabled = true;
```

### Hacerse Administrador

```sql
-- Cambiar mi rol a ADMIN
UPDATE admin_users 
SET role = 'ADMIN'
WHERE username = 'MI_USUARIO';
```

**Archivo completo**: `database/sql-verificar-permisos.sql`

---

## 🎨 INTERPRETACIÓN DE LOGS

### ✅ Flujo Exitoso

```
🔑 authenticateUser middleware
   - ✅ Usuario autenticado: xxx-xxx (ADMIN)

🔐 requirePermission middleware
   - Permiso requerido: pedidos.delete
   - ✅ Usuario: xxx-xxx (ADMIN)

🔍 Verificando permiso 'pedidos.delete'
👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS
   - Resultado: ✅ PERMITIDO

✅ Permiso concedido - continuando
🗑️ Eliminando 3 pedidos...
✅ 3 de 3 pedidos eliminados exitosamente
```

### ❌ Error: No Autenticado

```
🔑 authenticateUser middleware
   - Headers recibidos: { userId: 'NO PRESENTE' }
   - ⚠️ No hay userId en headers

🔐 requirePermission middleware
   - Usuario: No autenticado
❌ Usuario no autenticado - rechazando con 401
```

**Solución**: Verificar localStorage y headers del frontend

### ❌ Error: Sin Permisos

```
🔑 authenticateUser middleware
   - ✅ Usuario autenticado: xxx-xxx (OPERATOR)

🔐 requirePermission middleware
   - Permiso requerido: pedidos.delete
   - Usuario: xxx-xxx (OPERATOR)

🔍 Verificando permiso 'pedidos.delete'
👤 Usuario: operador, rol: OPERATOR
✅ Permiso 'pedidos.delete' DENEGADO por defecto
   - Resultado: ❌ DENEGADO

❌ Permiso denegado - rechazando con 403
```

**Solución**: Asignar permiso o cambiar rol a ADMIN

---

## 🔑 PERMISOS Y ROLES

### Tabla de Permisos

| Operación | Permiso Necesario | Administrador | Supervisor | Operador | Visualizador |
|-----------|------------------|---------------|------------|----------|--------------|
| Bulk Delete | `pedidos.delete` | ✅ | ❌ | ❌ | ❌ |
| Bulk Update Date | `pedidos.edit` | ✅ | ✅ | ✅ | ❌ |
| Ver Pedidos | `pedidos.view` | ✅ | ✅ | ✅ | ✅ |
| Crear Pedidos | `pedidos.create` | ✅ | ✅ | ✅ | ❌ |

### Cómo Asignar Permisos

#### Opción 1: Desde la Interfaz de Admin
1. Ir a "Gestión de Usuarios"
2. Editar el usuario
3. Marcar "Eliminar Pedidos"
4. Guardar cambios

#### Opción 2: SQL Directo
```sql
-- Ver query #5 en sql-verificar-permisos.sql
INSERT INTO user_permissions (user_id, permission_id, enabled, granted_by)
VALUES ('TU_USER_ID', 'pedidos.delete', true, 'TU_USER_ID')
ON CONFLICT (user_id, permission_id) 
DO UPDATE SET enabled = true;
```

#### Opción 3: Cambiar Rol
```sql
-- Ver query #6 en sql-verificar-permisos.sql
UPDATE admin_users 
SET role = 'ADMIN'
WHERE username = 'TU_USERNAME';
```

---

## 🛠️ SOLUCIONES TEMPORALES (SOLO DESARROLLO)

### Bypass de Autenticación

⚠️ **ADVERTENCIA**: Solo para desarrollo local, nunca en producción.

```javascript
// backend/index.js - Línea 1434
// Comentar el middleware requirePermission

// ANTES
app.delete('/api/pedidos/bulk-delete', 
    requirePermission('pedidos.delete'), 
    async (req, res) => {

// DESPUÉS (SOLO DESARROLLO)
app.delete('/api/pedidos/bulk-delete', 
    async (req, res) => {
    console.log('⚠️ MODO DESARROLLO: Autenticación deshabilitada');
```

**Revertir antes de producción**.

---

## 📞 SOPORTE Y SIGUIENTES PASOS

### Si el Problema Persiste

1. ✅ Ejecutar `test-bulk-delete.ps1`
2. ✅ Copiar logs completos del backend
3. ✅ Copiar output del script de prueba
4. ✅ Verificar permisos en BD con `sql-verificar-permisos.sql`
5. ✅ Reportar aquí con toda la información

### Información Necesaria para Soporte

- [ ] Output de `test-bulk-delete.ps1`
- [ ] Logs del backend (desde 🔑 authenticateUser hasta el error)
- [ ] Resultado de query SQL #4 (verificar permisos del usuario)
- [ ] Rol del usuario (ADMIN, SUPERVISOR, OPERATOR, VIEWER)
- [ ] Método de autenticación (localStorage, BD, headers)

---

## 📊 CHECKLIST COMPLETO

### Antes de Empezar
- [ ] Backend corriendo
- [ ] PostgreSQL conectado
- [ ] Usuario creado y activo
- [ ] Datos de prueba disponibles (pedidos)

### Diagnóstico
- [ ] Logs visibles en consola del backend
- [ ] Script `test-bulk-delete.ps1` ejecutado
- [ ] Identificado el tipo de error (401, 403, 500)
- [ ] Consultado el SQL para verificar permisos

### Solución
- [ ] Permiso `pedidos.delete` asignado o rol cambiado a ADMIN
- [ ] Backend reiniciado después de cambios
- [ ] Prueba exitosa con el script de PowerShell
- [ ] Prueba exitosa desde el frontend

### Verificación Final
- [ ] Bulk delete funciona desde el frontend
- [ ] Bulk update date funciona desde el frontend
- [ ] No hay errores 404 en Network tab
- [ ] Logs muestran "✅ Permiso concedido"

---

## 🎓 RECURSOS ADICIONALES

### Archivos de Referencia

- `backend/index.js` (línea 1434) - Endpoint bulk-delete
- `backend/index.js` (línea 1502) - Endpoint bulk-update-date
- `backend/middleware/auth.js` - Autenticación
- `backend/middleware/permissions.js` - Verificación de permisos
- `backend/postgres-client.js` (línea 1451) - Método hasPermission
- `hooks/useBulkOperations.ts` - Frontend bulk operations

### Documentos Relacionados

- `BULK_OPERATIONS_GUIDE.md` - Guía de uso de operaciones masivas
- `DEBUG_BULK_UPDATE.md` - Debug específico de bulk update
- `backend/CONFIGURACION_ENTORNOS.md` - Configuración de entornos

---

## ✨ RESUMEN EJECUTIVO

### ¿Qué es este error?

El endpoint bulk-delete **existe** pero está protegido por autenticación. El error 404 es engañoso; en realidad es un 401/403 que se muestra como 404.

### ¿Cómo lo soluciono?

**Opción rápida**: Cambiar tu rol a Administrador
```sql
UPDATE admin_users SET role = 'ADMIN' WHERE username = 'TU_USUARIO';
```

**Opción precisa**: Asignar solo el permiso necesario
```sql
-- Ver archivo sql-verificar-permisos.sql, query #5
```

### ¿Cómo verifico que funcionó?

```powershell
.\test-bulk-delete.ps1
```

Si ves `✅ RESPUESTA EXITOSA`, está solucionado.

---

**Última actualización**: 19 de octubre de 2025
**Estado**: ✅ Documentación completa
**Próximo paso**: Ejecutar diagnóstico siguiendo VERIFICACION_BULK_DELETE.md
