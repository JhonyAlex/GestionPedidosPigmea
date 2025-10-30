# 🎯 Instrucciones para Probar la Funcionalidad de Vendedor

## ✅ **Estado Actual**
Todos los cambios han sido implementados correctamente:
- ✅ Tipos TypeScript creados
- ✅ Hook `useVendedoresManager` implementado
- ✅ Componentes `AddPedidoModal` y `PedidoModal` actualizados
- ✅ 5 endpoints del backend implementados
- ✅ Tabla `vendedores` y métodos en `postgres-client.js`
- ✅ Verificaciones de base de datos para modo desarrollo

## 🚀 **Pasos para Probar**

### 1. **Reiniciar el Backend**

Abre una terminal en la carpeta `backend` y ejecuta:

```powershell
cd backend
node index.js
```

Deberías ver:
```
🚀 Servidor iniciado en puerto 3001
⚠️ Modo desarrollo - Base de datos no disponible
```

**IMPORTANTE:** Deja esta terminal abierta y NO la cierres.

---

### 2. **Verificar Endpoints en el Navegador**

Abre tu navegador y visita:

```
http://localhost:3001/api/vendedores
```

**Resultado esperado en modo desarrollo (sin BD):**
```json
[]
```

Esto confirma que el endpoint responde correctamente (devuelve array vacío en modo desarrollo).

---

### 3. **Reconstruir el Frontend**

Si el frontend no muestra el campo de vendedor, necesitas reconstruirlo:

```powershell
npm run build
```

---

### 4. **Probar la Interfaz**

1. **Abre la aplicación** en `http://localhost:3001`
2. **Inicia sesión** con tus credenciales
3. **Crea un nuevo pedido** - haz clic en el botón "Agregar Pedido"
4. **Verifica el campo "Vendedor"**:
   - Debe aparecer al lado del campo "Fecha de Entrega"
   - Debe mostrar un `<select>` con la opción "Seleccionar vendedor..."
   - Debe tener un botón "+" para agregar nuevo vendedor

5. **Prueba crear un vendedor**:
   - Haz clic en el botón "+" junto al select de vendedor
   - Debe aparecer un input y botones de confirmar/cancelar
   - Escribe un nombre (ej: "Juan Pérez")
   - Haz clic en el botón ✓ (confirmar)

---

## 📝 **Comportamiento Esperado**

### En Modo Desarrollo (Sin Base de Datos)
- ❌ **GET `/api/vendedores`** → Devuelve `[]` (array vacío)
- ❌ **POST `/api/vendedores`** → Devuelve error 503: "Base de datos no disponible en modo desarrollo."
- La UI se mostrará pero no se podrán crear vendedores

### Con Base de Datos Conectada
- ✅ **GET `/api/vendedores`** → Devuelve lista de vendedores
- ✅ **POST `/api/vendedores`** → Crea nuevo vendedor y lo devuelve
- ✅ **PUT `/api/vendedores/:id`** → Actualiza vendedor existente
- ✅ **DELETE `/api/vendedores/:id`** → Elimina vendedor
- ✅ **WebSocket Events** → Sincronización en tiempo real con todos los clientes conectados

---

## 🔧 **Solución de Problemas**

### El campo vendedor no aparece
```powershell
# Reconstruir el frontend
npm run build

# Limpiar caché del navegador
# Presiona Ctrl + Shift + R en Chrome/Edge
# O Ctrl + F5 en Firefox
```

### Error "ERR_CONNECTION_REFUSED"
```powershell
# Verificar que el backend esté corriendo
Get-Process -Name node

# Si no hay ningún proceso, iniciar el backend
cd backend
node index.js
```

### El backend se cierra solo
- NO ejecutes comandos en la misma terminal donde está corriendo `node index.js`
- Abre una terminal nueva para otros comandos
- El backend tiene manejadores de SIGINT/SIGTERM que lo apagan al recibir señales

---

## 🗄️ **Para Conectar a PostgreSQL**

Si quieres probar con base de datos real:

1. Verifica las variables de entorno en `backend/.env`:
```env
DB_HOST=tu-servidor-postgres
DB_PORT=5432
DB_NAME=gestion_pedidos
DB_USER=tu-usuario
DB_PASSWORD=tu-password
```

2. La migración se ejecutará automáticamente al iniciar el backend
3. Verás en los logs:
```
✅ Migración #3 aplicada: Agregar columna vendedor a pedidos
```

---

## 📊 **Estructura de la Tabla Vendedores**

```sql
CREATE TABLE vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎉 **Próximos Pasos**

Una vez que confirmes que todo funciona:

1. ✅ El campo aparece en los modales de pedidos
2. ✅ Los endpoints responden correctamente
3. ✅ El backend inicia sin errores

Entonces estarás listo para:
- Conectar a tu base de datos PostgreSQL en la nube
- Probar la creación/edición de vendedores
- Verificar la sincronización en tiempo real via WebSockets

---

## 📧 **Soporte**

Si encuentras algún problema:
1. Revisa los logs del backend en la terminal donde ejecutaste `node index.js`
2. Revisa la consola del navegador (F12) para errores del frontend
3. Verifica que todas las dependencias estén instaladas: `npm install`

