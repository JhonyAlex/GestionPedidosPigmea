# ✅ Solución: Pedidos no aparecen en el listado de clientes

## 🔍 Problema Identificado
Cuando se creaba un pedido con un cliente seleccionado, el pedido **no aparecía** en el listado de pedidos del cliente. Esto se debía a que el `clienteId` no se estaba guardando correctamente en la base de datos.

## 🐛 Causa Raíz
El componente `AddPedidoModal` solo guardaba el **nombre** del cliente, pero no su **ID**. Cuando el pedido se creaba, el campo `cliente_id` quedaba vacío en la base de datos, por lo que las consultas que buscaban pedidos por `cliente_id` no encontraban ningún resultado.

## ✨ Cambios Realizados

### 1. **Actualización del Tipo `Pedido`** (`types.ts`)
Se agregó la propiedad `clienteId` al tipo `Pedido`:

```typescript
export interface Pedido {
    // ... otros campos
    cliente: string;
    clienteId?: string; // ✅ ID del cliente en la tabla de clientes
    // ... otros campos
}
```

### 2. **Actualización de `AddPedidoModal`** (`components/AddPedidoModal.tsx`)

#### a) Estado inicial del formulario
```typescript
const initialFormData = {
    cliente: '',
    clienteId: '',  // ✅ Agregar clienteId
    // ... otros campos
};
```

#### b) Capturar el ID al seleccionar un cliente
```typescript
const handleChange = (e: React.ChangeEvent<...>) => {
    // ...
    if (name === "cliente" && value !== "add_new_cliente") {
        // ✅ Guardar tanto el nombre como el ID
        const clienteSeleccionado = clientes.find(c => c.nombre === value);
        setFormData(prev => ({ 
            ...prev, 
            cliente: value,
            clienteId: clienteSeleccionado?.id || '' 
        }));
    }
    // ...
};
```

#### c) Guardar el ID al crear un nuevo cliente
```typescript
const handleSaveCliente = async (clienteData: ClienteCreateRequest) => {
    const nuevoCliente = await addCliente(clienteData);
    // ✅ Guardar tanto el nombre como el ID del nuevo cliente
    setFormData(prev => ({ 
        ...prev, 
        cliente: nuevoCliente.nombre,
        clienteId: nuevoCliente.id 
    }));
    // ...
};
```

### 3. **Logs de Depuración Agregados**

#### Frontend (`hooks/usePedidosManager.ts`)
```typescript
console.log('📦 Preparando nuevo pedido en frontend:');
console.log('  - Cliente:', pedidoData.cliente);
console.log('  - ClienteId:', pedidoData.clienteId);
```

#### Backend (`backend/index.js`)
```javascript
console.log('📦 Creando nuevo pedido:');
console.log('  - Cliente:', newPedido.cliente);
console.log('  - ClienteId:', newPedido.clienteId);
console.log('  - ID Pedido:', newPedido.id);
```

## 🧪 Cómo Probar la Solución

### Paso 1: Reiniciar el Backend
```bash
cd /workspaces/GestionPedidosPigmea/backend
npm restart
```

### Paso 2: Iniciar el Frontend
```bash
cd /workspaces/GestionPedidosPigmea
npm run dev
```

### Paso 3: Crear un Pedido con Cliente
1. Ir a la vista principal
2. Hacer clic en "Crear Nuevo Pedido"
3. Seleccionar un cliente del dropdown (por ejemplo: "Cliente A")
4. Llenar los demás campos obligatorios
5. Guardar el pedido
6. **Verificar en los logs de la consola del navegador** que aparezca:
   ```
   📦 Preparando nuevo pedido en frontend:
     - Cliente: Cliente A
     - ClienteId: <algún-id>
   ```
7. **Verificar en los logs del servidor** que aparezca:
   ```
   📦 Creando nuevo pedido:
     - Cliente: Cliente A
     - ClienteId: <algún-id>
     - ID Pedido: <pedido-id>
   ```

### Paso 4: Verificar en el Listado de Clientes
1. Ir a la sección de "Clientes"
2. Buscar el cliente seleccionado (por ejemplo: "Cliente A")
3. Hacer clic en "Ver Detalles" o abrir el detalle del cliente
4. **Verificar que el pedido recién creado aparezca** en el listado de pedidos del cliente

### Paso 5: Verificar en la Base de Datos (Opcional)
Si tienes acceso a PostgreSQL:
```sql
SELECT id, numero_pedido_cliente, cliente, cliente_id 
FROM pedidos 
WHERE cliente_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

## ✅ Resultado Esperado

Después de aplicar estos cambios:
- ✅ Al crear un pedido, el `clienteId` se guarda correctamente en la base de datos
- ✅ El pedido aparece en el listado de pedidos del cliente
- ✅ Las estadísticas del cliente se actualizan correctamente
- ✅ El historial de pedidos del cliente incluye el nuevo pedido

## 📝 Notas Importantes

1. **Compatibilidad con pedidos antiguos**: Las consultas en el backend usan `cliente_id = $1 OR data->>'clienteId' = $1`, por lo que seguirán funcionando con pedidos creados antes de este cambio.

2. **Logs de depuración**: Los logs agregados pueden ser eliminados después de verificar que todo funciona correctamente, o dejarse para futuras depuraciones.

3. **Validación**: El campo `clienteId` es opcional (`clienteId?: string`), por lo que no rompe la compatibilidad con código existente.

## 🔧 Mantenimiento Futuro

Para evitar este tipo de problemas en el futuro:
- Siempre que se agregue un campo de selección relacionado a otra tabla, asegurarse de capturar tanto el **nombre** (para display) como el **ID** (para referencias).
- Agregar tests que verifiquen la integridad referencial entre pedidos y clientes.
- Considerar agregar una migración de datos para actualizar pedidos antiguos que no tengan `cliente_id`.
