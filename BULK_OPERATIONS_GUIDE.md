# 📦 Guía de Operaciones Masivas - Sistema de Selección Múltiple

## 🎯 Descripción General

Sistema completo de selección múltiple para tarjetas Kanban con dos operaciones masivas: **Eliminar** y **Cambiar Nueva Fecha de Entrega**.

---

## ✨ Características Implementadas

### 1. **Selección Múltiple de Tarjetas**

#### Desktop:
- ✅ Checkbox aparece al hacer **hover** sobre la tarjeta
- ✅ Click en checkbox → selecciona la tarjeta (sin abrir modal)
- ✅ Click en tarjeta **SIN selección activa** → abre modal de detalle
- ✅ Click en tarjeta **CON selección activa** → togglea selección

#### Móvil:
- ✅ Checkbox **siempre visible**
- ✅ Click en checkbox → selecciona la tarjeta
- ✅ Click en tarjeta → abre modal de detalle

### 2. **Toolbar de Acciones Masivas**
- ✅ Aparece flotante en la parte inferior cuando hay **2 o más** tarjetas seleccionadas
- ✅ Muestra contador de seleccionados
- ✅ Botones: **Cambiar Fecha**, **Eliminar**, **Cancelar**
- ✅ Animación de entrada suave

### 3. **Operación: Eliminar Masivamente**
- ✅ Modal destructivo con lista de pedidos a eliminar
- ✅ Requiere escribir **"ELIMINAR"** para habilitar botón
- ✅ Advertencia de acción irreversible
- ✅ API: `DELETE /api/pedidos/bulk-delete`
- ✅ Toast de confirmación con cantidad eliminada
- ✅ Notificación WebSocket a usuarios conectados

### 4. **Operación: Cambiar Nueva Fecha de Entrega**
- ✅ Modal con date picker para seleccionar fecha
- ✅ Tabla de preview con pedidos afectados
- ✅ Muestra fecha actual vs nueva fecha
- ✅ API: `PATCH /api/pedidos/bulk-update-date`
- ✅ Actualiza campo `nuevaFechaEntrega`
- ✅ Registro en historial de cada pedido
- ✅ Toast de confirmación con cantidad actualizada
- ✅ Notificación WebSocket a usuarios conectados

---

## 📁 Archivos Creados/Modificados

### Nuevos Componentes
1. **`hooks/useBulkOperations.ts`** - Hook personalizado para operaciones masivas
2. **`components/BulkActionsToolbar.tsx`** - Toolbar flotante inferior
3. **`components/DeleteConfirmationModal.tsx`** - Modal de confirmación destructiva
4. **`components/BulkDateUpdateModal.tsx`** - Modal de actualización de fechas

### Archivos Modificados
1. **`components/PedidoCard.tsx`** - Agregado checkbox y lógica de selección
2. **`components/KanbanColumn.tsx`** - Propagación de props de selección
3. **`App.tsx`** - Integración de bulk operations
4. **`src/index.css`** - Animación de slide-up
5. **`backend/index.js`** - Endpoints de operaciones masivas

---

## 🔌 API Endpoints

### 1. Eliminar Masivamente
```http
DELETE /api/pedidos/bulk-delete
Content-Type: application/json
Authorization: Required (Permiso: pedidos.delete)

Body:
{
  "ids": ["pedido-id-1", "pedido-id-2", "pedido-id-3"]
}

Response (200):
{
  "success": true,
  "deletedCount": 3,
  "message": "3 pedidos eliminados exitosamente."
}
```

### 2. Actualizar Nueva Fecha de Entrega
```http
PATCH /api/pedidos/bulk-update-date
Content-Type: application/json
Authorization: Required (Permiso: pedidos.edit)

Body:
{
  "ids": ["pedido-id-1", "pedido-id-2"],
  "nuevaFechaEntrega": "2025-11-15"
}

Response (200):
{
  "success": true,
  "updatedCount": 2,
  "message": "2 pedidos actualizados exitosamente."
}
```

---

## 🚀 Cómo Usar

### Seleccionar Tarjetas
1. Ve a la vista **Kanban**
2. **Desktop**: Pasa el mouse sobre una tarjeta y haz click en el checkbox
3. **Móvil**: Haz click directamente en el checkbox visible
4. Selecciona 2 o más tarjetas para ver el toolbar

### Eliminar Pedidos
1. Selecciona 2+ tarjetas
2. Click en **"Eliminar"** en el toolbar
3. Verifica la lista de pedidos en el modal
4. Escribe **"ELIMINAR"** en el campo de texto
5. Click en **"Eliminar Pedidos"**
6. ✅ Confirmación automática

### Cambiar Fecha de Entrega
1. Selecciona 2+ tarjetas
2. Click en **"Cambiar Fecha"** en el toolbar
3. Selecciona la nueva fecha en el date picker
4. Revisa la tabla de preview
5. Click en **"Actualizar Fechas"**
6. ✅ Confirmación automática

### Cancelar Selección
- Click en **"Cancelar"** en el toolbar
- O cambia de vista (se limpia automáticamente)

---

## 🔐 Permisos Requeridos

| Operación | Permiso Requerido |
|-----------|------------------|
| Seleccionar tarjetas | Ninguno (visual) |
| Eliminar masivamente | `pedidos.delete` |
| Actualizar fechas | `pedidos.edit` |

---

## 🎨 Comportamiento Visual

### Estados de Tarjetas
- **Normal**: Sin borde especial
- **Hover (Desktop)**: Checkbox aparece
- **Seleccionada**: Ring azul (`ring-2 ring-blue-500`)
- **Selección Activa**: Cambio de comportamiento en click

### Toolbar
- **Posición**: Fija en bottom-center
- **z-index**: 50 (sobre todo excepto modales)
- **Animación**: Slide-up desde abajo
- **Responsive**: Botones adaptan texto en móvil

---

## 🔄 WebSocket Events

### Eventos Emitidos
```javascript
// Eliminación masiva
broadcastToClients('pedidos-bulk-deleted', {
  pedidoIds: [...],
  count: 3,
  pedidos: [...]
});

// Actualización masiva
broadcastToClients('pedidos-bulk-updated', {
  pedidoIds: [...],
  count: 2,
  field: 'nueva_fecha_entrega',
  value: '2025-11-15',
  pedidos: [...]
});
```

---

## 🛠️ Extensibilidad

### Agregar Nuevas Operaciones Masivas

1. **Agregar botón en BulkActionsToolbar.tsx**:
```tsx
<button onClick={onNuevaOperacion}>
  <IconoNuevo />
  Nueva Operación
</button>
```

2. **Crear modal correspondiente**:
```tsx
// components/NuevaOperacionModal.tsx
const NuevaOperacionModal: React.FC<Props> = ({ ... }) => {
  // Lógica del modal
};
```

3. **Agregar función en useBulkOperations.ts**:
```typescript
const bulkNuevaOperacion = useCallback(async (ids, datos) => {
  const response = await fetch(`${API_URL}/pedidos/bulk-operacion`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, datos }),
  });
  // ...
}, []);
```

4. **Crear endpoint en backend**:
```javascript
app.patch('/api/pedidos/bulk-operacion', requirePermission('pedidos.edit'), async (req, res) => {
  // Lógica del endpoint
});
```

---

## 📝 Registro en Historial

Cada operación masiva registra en el historial de cada pedido:

```javascript
{
  timestamp: "2025-10-19T14:30:00.000Z",
  usuario: "Juan Pérez",
  accion: "Actualización masiva de Nueva Fecha Entrega",
  detalles: "Nueva fecha establecida: 2025-11-15"
}
```

---

## ⚠️ Notas Importantes

1. **Limpieza Automática**: La selección se limpia al cambiar de vista
2. **Validación**: Mínimo 2 tarjetas para mostrar toolbar
3. **Permisos**: Los botones respetan permisos del usuario
4. **WebSocket**: Notifica cambios en tiempo real a otros usuarios
5. **Responsive**: Funciona correctamente en desktop y móvil
6. **Drag & Drop**: Compatible con el sistema de arrastrar y soltar existente

---

## 🐛 Testing

### Casos de Prueba Recomendados

1. ✅ Seleccionar 1 tarjeta → No debe mostrar toolbar
2. ✅ Seleccionar 2+ tarjetas → Debe mostrar toolbar
3. ✅ Cambiar de vista → Debe limpiar selección
4. ✅ Eliminar sin escribir "ELIMINAR" → Botón deshabilitado
5. ✅ Actualizar fecha sin seleccionar → Botón deshabilitado
6. ✅ Operaciones masivas con permisos insuficientes → Error 403
7. ✅ WebSocket notifica a otros usuarios conectados
8. ✅ Toast muestra cantidad correcta de pedidos afectados

---

## 📞 Soporte

Para dudas o problemas, revisar:
- Logs del navegador (F12 → Console)
- Logs del backend (terminal servidor)
- Estado de WebSocket (indicador en UI)

---

**Fecha de Implementación**: 19 de Octubre, 2025
**Versión**: 1.0.0
