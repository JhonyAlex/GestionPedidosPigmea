# 🐛 Debug: Actualización Masiva de Fechas

## Problema Reportado

**Síntoma**: Al hacer cambio masivo de "Nueva Fecha Entrega", solo se actualiza 1 pedido en lugar de todos los seleccionados.

## Cambios Implementados para Debug

### 1. Backend - Logging Detallado

**Archivo**: `backend/index.js`
**Endpoint**: `PATCH /api/pedidos/bulk-update-date`

**Logs Agregados**:
```javascript
console.log(`📅 Actualizando nueva fecha de entrega para ${ids.length} pedidos: ${ids.join(', ')}`);
console.log(`📅 Nueva fecha: ${nuevaFechaEntrega}`);

// Por cada pedido:
console.log(`  🔄 Procesando pedido ${id}...`);
console.log(`  📦 Pedido encontrado: ${pedido.numero_pedido_cliente}`);
console.log(`  📅 Fecha anterior: ${pedido.nueva_fecha_entrega || 'N/A'}`);
console.log(`  ✅ Pedido ${id} actualizado exitosamente`);

// Al final:
console.log(`✅ ${updatedCount} de ${ids.length} pedidos actualizados exitosamente`);
```

**Mejoras**:
- ✅ Array `errors[]` para capturar errores sin detener el loop
- ✅ Logging detallado por cada pedido procesado
- ✅ Respuesta incluye `totalRequested` y `errors` (si hay)

### 2. Frontend Hook - Logging de Petición

**Archivo**: `hooks/useBulkOperations.ts`
**Función**: `bulkUpdateDate()`

**Logs Agregados**:
```javascript
console.log('🔵 bulkUpdateDate - IDs a actualizar:', ids);
console.log('🔵 bulkUpdateDate - Nueva fecha:', nuevaFechaEntrega);
console.log('🔵 bulkUpdateDate - Total de IDs:', ids.length);
console.log('🔵 bulkUpdateDate - Usuario:', user.id, user.role);
console.log('🔵 bulkUpdateDate - Respuesta del servidor:', data);
```

### 3. Frontend App - Logging de Actualización Local

**Archivo**: `App.tsx`
**Función**: `handleBulkUpdateDate()`

**Logs Agregados**:
```javascript
console.log('🟢 handleBulkUpdateDate - selectedIds:', selectedIds);
console.log('🟢 handleBulkUpdateDate - nuevaFecha:', nuevaFecha);
console.log('🟢 handleBulkUpdateDate - Total seleccionados:', selectedIds.length);
console.log('🟢 handleBulkUpdateDate - Resultado:', result);
console.log(`  ✅ Actualizando pedido ${p.id} (${p.numeroPedidoCliente})`);
```

## Cómo Usar los Logs para Debug

### Paso 1: Abrir DevTools
1. F12 en el navegador
2. Ir a la pestaña "Console"

### Paso 2: Seleccionar Múltiples Pedidos
1. Selecciona 3-5 pedidos en el Kanban o Preparación
2. Observa en consola: `selectedIds` debe tener los IDs correctos

### Paso 3: Cambiar Fecha
1. Click en "Cambiar Nueva Fecha de Entrega"
2. Selecciona una fecha
3. Click en "Actualizar Fechas"

### Paso 4: Revisar Logs

#### Frontend (Console del navegador):
```
🔵 bulkUpdateDate - IDs a actualizar: ["id1", "id2", "id3"]
🔵 bulkUpdateDate - Nueva fecha: 2025-11-20
🔵 bulkUpdateDate - Total de IDs: 3
🔵 bulkUpdateDate - Usuario: 123 Administrador
🔵 bulkUpdateDate - Respuesta del servidor: {success: true, updatedCount: 3, ...}

🟢 handleBulkUpdateDate - selectedIds: ["id1", "id2", "id3"]
🟢 handleBulkUpdateDate - nuevaFecha: 2025-11-20
🟢 handleBulkUpdateDate - Total seleccionados: 3
  ✅ Actualizando pedido id1 (PED-001)
  ✅ Actualizando pedido id2 (PED-002)
  ✅ Actualizando pedido id3 (PED-003)
```

#### Backend (Terminal del servidor):
```
📅 Actualizando nueva fecha de entrega para 3 pedidos: id1, id2, id3
📅 Nueva fecha: 2025-11-20

  🔄 Procesando pedido id1...
  📦 Pedido encontrado: PED-001
  📅 Fecha anterior: N/A
  ✅ Pedido id1 actualizado exitosamente

  🔄 Procesando pedido id2...
  📦 Pedido encontrado: PED-002
  📅 Fecha anterior: 2025-11-15
  ✅ Pedido id2 actualizado exitosamente

  🔄 Procesando pedido id3...
  📦 Pedido encontrado: PED-003
  📅 Fecha anterior: N/A
  ✅ Pedido id3 actualizado exitosamente

✅ 3 de 3 pedidos actualizados exitosamente
```

## Posibles Causas del Problema

### 1. IDs No Se Envían Correctamente
**Síntoma en logs**:
```
🔵 bulkUpdateDate - Total de IDs: 1  // ❌ Debería ser 3+
```

**Causa**: Problema en la selección de tarjetas
**Solución**: Verificar que `selectedIds` en App.tsx se actualice correctamente

### 2. Backend Solo Recibe 1 ID
**Síntoma en logs**:
```
📅 Actualizando nueva fecha de entrega para 1 pedidos: id1  // ❌
```

**Causa**: Problema en serialización JSON o en el hook
**Solución**: Verificar `body: JSON.stringify({ ids, nuevaFechaEntrega })`

### 3. Error en updatePedido()
**Síntoma en logs**:
```
  🔄 Procesando pedido id2...
  ❌ Error: updatePedido devolvió null para id2
```

**Causa**: Problema en la base de datos o en `updatePedido()`
**Solución**: Verificar método `dbClient.updatePedido()`

### 4. Frontend No Actualiza Todos
**Síntoma en logs**:
```
🟢 handleBulkUpdateDate - Total seleccionados: 3
  ✅ Actualizando pedido id1 (PED-001)
  // ❌ Faltan id2 e id3
```

**Causa**: Problema en el `map()` de setPedidos
**Solución**: Verificar lógica de `selectedIds.includes(p.id)`

## Checklist de Verificación

- [ ] Los logs del frontend muestran todos los IDs seleccionados
- [ ] Los logs del backend muestran que recibe todos los IDs
- [ ] Los logs del backend muestran que procesa todos los pedidos
- [ ] Los logs del backend muestran que actualiza exitosamente cada uno
- [ ] Los logs del frontend muestran que actualiza el estado local para todos
- [ ] La UI muestra la nueva fecha en todas las tarjetas seleccionadas

## Próximos Pasos

1. **Recompilar y Desplegar**:
   ```bash
   npm run build
   # Desplegar en Dokploy
   ```

2. **Probar con Logs Activos**:
   - Seleccionar 3-5 pedidos
   - Cambiar fecha
   - Revisar logs en consola y terminal

3. **Reportar Hallazgos**:
   - Copiar los logs completos
   - Identificar dónde falla el flujo
   - Compartir para análisis adicional

## Limpieza de Logs (Después de Resolver)

Una vez identificado y resuelto el problema, eliminar los `console.log` agregados para producción.

**Archivos a limpiar**:
- `hooks/useBulkOperations.ts`
- `App.tsx`
- `backend/index.js` (opcional, los logs del backend pueden ser útiles)

---

**Fecha de Implementación**: 19 de Octubre, 2025
**Estado**: Debugging en Progreso 🔍
