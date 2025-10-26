# 🔧 Guía de Troubleshooting: Vendedores

## Problema: `net::ERR_CONNECTION_REFUSED` en `/api/vendedores`

### Síntomas
```
POST http://localhost:3001/api/vendedores net::ERR_CONNECTION_REFUSED
TypeError: Failed to fetch
```

### Causas Posibles
1. Servidor backend no está corriendo
2. Puerto 3001 está bloqueado por otro proceso
3. Servidor se colgó sin memoria

### Solución

#### Paso 1: Verificar que el servidor está corriendo
```bash
ps aux | grep "node index" | grep -v grep
```

Si no aparece nada, ir al Paso 3.

#### Paso 2: Verificar que responde en puerto 3001
```bash
curl http://localhost:3001/api/health
```

Si responde:
```json
{"status":"ok","timestamp":"2025-10-26T23:27:25.313Z"}
```
El servidor está bien, chequea los headers del frontend.

Si no responde, ir al Paso 3.

#### Paso 3: Reiniciar el servidor

##### Opción A: Automática (recomendado)
```bash
cd /workspaces/GestionPedidosPigmea/backend
./keep-alive.sh &
```

##### Opción B: Manual
```bash
# 1. Detener servidor anterior
pkill -9 -f "npm start" || true
pkill -9 -f "node index.js" || true

# 2. Limpiar puerto bloqueado
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# 3. Esperar 2 segundos
sleep 2

# 4. Reiniciar
cd /workspaces/GestionPedidosPigmea/backend
npm start &
```

#### Paso 4: Verificar headers de autenticación

El frontend debe enviar estos headers:
```javascript
{
  'x-user-id': 'user-id-del-usuario',
  'x-user-role': 'Administrador'
}
```

Verificar que el hook `useVendedoresManager.ts` incluye:
```typescript
const { user } = useAuth();
const getAuthHeaders = useCallback(() => {
    return {
        'x-user-id': String(user.id),
        'x-user-role': user.role || 'OPERATOR'
    };
}, [user]);
```

## Problema: Vendedor no se persiste después de reiniciar

### Síntomas
- Los vendedores creados desaparecen después de reiniciar el servidor

### Causa
Por defecto, en modo desarrollo, los vendedores se guardan en memoria.

### Soluciones

#### Opción 1: Conectar PostgreSQL (recomendado)
Ver `backend/.env` y configurar:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/gestion_pedidos
```

O variables individuales:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gestion_pedidos
POSTGRES_USER=pigmea_user
POSTGRES_PASSWORD=tu_password
```

Luego ejecutar migraciones:
```bash
cd /workspaces/GestionPedidosPigmea/backend
npm run migrate
```

#### Opción 2: Usar MongoDB para desarrollo
(Implementar si se requiere persistencia sin PostgreSQL)

## Problema: 409 Conflict - Ya existe un vendedor con ese nombre

### Síntomas
```json
{
  "message": "Ya existe un vendedor con ese nombre."
}
```

### Solución
Usar un nombre diferente. Los nombres de vendedores deben ser únicos.

Para obtener lista de vendedores existentes:
```bash
curl http://localhost:3001/api/vendedores \
  -H "x-user-id: user-test" \
  -H "x-user-role: Administrador"
```

## Problema: 401 Unauthorized

### Síntomas
```json
{
  "error": "No autenticado",
  "message": "Debe iniciar sesión para acceder a este recurso"
}
```

### Causas
- Falta header `x-user-id`
- Falta header `x-user-role`
- El header `x-user-id` está vacío

### Solución

Verificar que los headers están presentes:
```bash
curl -v http://localhost:3001/api/vendedores \
  -H "x-user-id: user-test-123" \
  -H "x-user-role: Administrador"
```

Debe mostrar:
```
> GET /api/vendedores HTTP/1.1
> x-user-id: user-test-123
> x-user-role: Administrador
```

## Problema: 403 Forbidden - Permiso denegado

### Síntomas
```json
{
  "error": "Acceso denegado"
}
```

### Causas
El usuario no tiene los permisos necesarios

### Permisos Requeridos
- **POST `/api/vendedores`** → `pedidos.create`
- **PUT `/api/vendedores/:id`** → `pedidos.edit`
- **DELETE `/api/vendedores/:id`** → `pedidos.delete`
- **GET `/api/vendedores`** → Sin permisos especiales

### Solución
- Usar usuario `Administrador` (tiene todos los permisos)
- O asignar permisos específicos al usuario

## Problema: Vendedores no se sincronizan en tiempo real

### Síntomas
- Usuario A crea un vendedor
- Usuario B no lo ve automáticamente

### Causas
- WebSocket no está conectado
- Frontend no está escuchando eventos WebSocket

### Solución

1. Verificar que el hook está usando WebSocket:
```typescript
useEffect(() => {
    fetchVendedores(); // Cargar inicial
}, [fetchVendedores]);
```

2. Verificar que WebSocket está conectado en la consola del navegador:
```javascript
// En DevTools Console
console.log(io.connected) // Debe ser true
```

3. Si no está conectado, verificar `services/websocket.ts`

## Problema: Error al actualizar vendedor

### Síntomas
```json
{
  "message": "Error interno del servidor al actualizar el vendedor."
}
```

### Causas
- Vendedor no existe
- BD no disponible (pero esto debería cached en memoria)

### Solución

1. Verificar que el ID de vendedor es correcto:
```bash
curl http://localhost:3001/api/vendedores/VENDOR_ID \
  -H "x-user-id: test" \
  -H "x-user-role: Administrador"
```

2. Debe devolver 200 con los datos del vendedor

3. Si devuelve 404, el vendedor no existe

## Checklist de Verificación

Cuando tengas problemas con vendedores, verifica en orden:

- [ ] ¿Servidor backend está corriendo? `ps aux | grep node`
- [ ] ¿Puerto 3001 está abierto? `curl http://localhost:3001/api/health`
- [ ] ¿Headers de autenticación presentes? `x-user-id` y `x-user-role`
- [ ] ¿Usuario tiene permisos? (Usa Administrador para pruebas)
- [ ] ¿Nombre de vendedor es único? 
- [ ] ¿WebSocket está conectado? (Consola del navegador)
- [ ] ¿BD está disponible? (Opcional, funciona sin ella)

## Comandos Útiles

### Ver logs del servidor
```bash
tail -f /workspaces/GestionPedidosPigmea/backend/server.log
```

### Listar todos los vendedores
```bash
curl http://localhost:3001/api/vendedores \
  -H "x-user-id: admin" \
  -H "x-user-role: Administrador" | jq .
```

### Crear vendedor vía terminal
```bash
curl -X POST http://localhost:3001/api/vendedores \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin" \
  -H "x-user-role: Administrador" \
  -d '{
    "nombre": "Nuevo Vendedor",
    "email": "vendedor@example.com",
    "telefono": "+123456789"
  }' | jq .
```

### Actualizar vendedor
```bash
curl -X PUT http://localhost:3001/api/vendedores/VENDOR_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin" \
  -H "x-user-role: Administrador" \
  -d '{
    "nombre": "Nombre Actualizado"
  }' | jq .
```

### Eliminar vendedor
```bash
curl -X DELETE http://localhost:3001/api/vendedores/VENDOR_ID \
  -H "x-user-id: admin" \
  -H "x-user-role: Administrador" \
  -v
```
(Debe devolver 204 No Content)

## Contacto

Si el problema persiste después de seguir estos pasos, captura:
1. Output de `curl -v` (con headers)
2. Logs del servidor: `tail -100 /workspaces/GestionPedidosPigmea/backend/server.log`
3. Consola del navegador (F12 → Console)
4. Network tab mostrando el request que falla
