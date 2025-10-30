# Funcionalidad: Pre-selección Automática de Impresión Anónima

## 📋 Descripción

Se ha implementado una funcionalidad que **pre-selecciona automáticamente** la máquina de impresión anónima (`IMPRESION_ANON`) cuando un pedido está marcado con el checkbox "Anónimo" y es enviado a producción.

## ✅ Implementación

### Archivos Modificados

**1. `components/EnviarAImpresionModal.tsx`**

#### Cambio 1: Lógica de Pre-selección
```typescript
// Si el pedido es anónimo, pre-seleccionar IMPRESION_ANON, de lo contrario usar la primera etapa
const etapaInicialDefault = pedido.anonimo ? 'IMPRESION_ANON' as Etapa : KANBAN_FUNNELS.IMPRESION.stages[0];
const [impresionEtapa, setImpresionEtapa] = useState<Etapa>(etapaInicialDefault);
```

**Antes:** Siempre se pre-seleccionaba la primera etapa de impresión (`IMPRESION_WM1`).

**Ahora:** 
- Si `pedido.anonimo === true` → Se pre-selecciona `IMPRESION_ANON`
- Si `pedido.anonimo === false` o `undefined` → Se usa el comportamiento por defecto

#### Cambio 2: Mensaje Informativo
```typescript
pedido.anonimo
  ? `Este pedido está marcado como anónimo. Se ha pre-seleccionado la máquina de impresión anónima (ANON) para el pedido ${pedido.numeroPedidoCliente}.`
  : `Configura la etapa inicial de impresión y la secuencia de post-impresión para el pedido ${pedido.numeroPedidoCliente}.`
```

Se agregó un mensaje específico que informa al usuario que la máquina anónima ha sido pre-seleccionada automáticamente.

## 🔄 Flujo de Trabajo

1. **Usuario crea/edita un pedido** y marca el checkbox "Anónimo" (`anonimo: true`)
2. **Usuario marca el pedido como "Listo para Producción"** en la vista de Preparación
3. **Usuario hace clic en "Enviar a Impresión"**
4. **El modal `EnviarAImpresionModal` se abre con:**
   - Máquina de impresión pre-seleccionada: **ANON** (en lugar de Windmöller 1)
   - Mensaje informativo: "Este pedido está marcado como anónimo..."
5. **Usuario configura la secuencia de post-impresión** (opcional)
6. **Usuario confirma** y el pedido se envía a la etapa `IMPRESION_ANON`

## 🧪 Cómo Probar

### Caso 1: Pedido Anónimo
1. Crear un pedido en Preparación
2. Marcar el checkbox "Anónimo" ✅
3. Marcar "Material Disponible" y "Cliché Disponible"
4. Establecer estado del cliché
5. Click en "Enviar a Impresión"
6. **Verificar:** El select debe mostrar "ANON" pre-seleccionado
7. **Verificar:** El mensaje debe indicar que es un pedido anónimo

### Caso 2: Pedido Normal (No Anónimo)
1. Crear un pedido en Preparación
2. **NO** marcar el checkbox "Anónimo" ❌
3. Completar el resto del proceso
4. Click en "Enviar a Impresión"
5. **Verificar:** El select debe mostrar "Windmöller 1" pre-seleccionado (comportamiento normal)

## 🎯 Beneficios

- ✅ **Automatización:** Reduce errores manuales al pre-seleccionar la máquina correcta
- ✅ **Claridad:** Mensaje explícito informa al usuario del estado del pedido
- ✅ **Flexibilidad:** El usuario aún puede cambiar la etapa si lo necesita
- ✅ **Consistencia:** Mantiene el flujo de trabajo estándar (secuencia de post-impresión, confirmación, etc.)

## 🔗 Relación con Otros Campos

El campo `anonimo` funciona de manera independiente a:
- `antivaho` (tiene su propia lógica de envío a post-impresión)
- `materialDisponible`, `clicheDisponible` (requisitos de preparación)
- `prioridad`, `tipoImpresion` (atributos del pedido)

## 📝 Notas Técnicas

- La etapa `IMPRESION_ANON` ya existía en el enum `Etapa` y en `KANBAN_FUNNELS.IMPRESION.stages`
- El campo `anonimo` ya estaba implementado en la base de datos (migración `011-add-anonimo.sql`)
- No se requirieron cambios en el backend o en otros componentes
- La funcionalidad es **retrocompatible** (pedidos sin el campo `anonimo` se comportan normalmente)
