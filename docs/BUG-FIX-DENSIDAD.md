# 🐛 Bug Fix: Pérdida del Campo Densidad en Duplicación y Edición de Pedidos

**Fecha:** 2025-11-11  
**Estado:** ✅ RESUELTO  
**Archivos Modificados:** `components/SeccionDatosTecnicosDeMaterial.tsx`

---

## 📋 Descripción del Problema

El campo **Densidad (g/cm³)** en la sección "Material de Suministro y Compras" presentaba los siguientes problemas:

### Síntoma 1: Pérdida al Duplicar Pedido
Cuando se duplicaba un pedido que tenía valores de densidad, estos valores **desaparecían** al abrir el pedido duplicado.

### Síntoma 2: Pérdida al Editar Pedido Existente
Cuando se abría un pedido existente con valores de densidad guardados, estos valores **desaparecían** al guardar el pedido después de editarlo (incluso sin tocar el campo de densidad).

---

## 🔍 Análisis de la Causa Raíz

### El Problema NO estaba en:
- ❌ La lógica de duplicación en `hooks/usePedidosManager.ts` → Funciona correctamente con el operador spread
- ❌ El backend en `backend/postgres-client.js` → Guarda correctamente el objeto completo en la columna `data`
- ❌ El backend en `backend/index.js` → Los endpoints POST/PUT no modifican los datos

### El Problema SÍ estaba en:
✅ **`components/SeccionDatosTecnicosDeMaterial.tsx`** - Método `handleDensidadBlur()`

#### Comportamiento Incorrecto:

El componente usa un estado local `densidadTexts` para manejar la edición en tiempo real del campo de densidad. Este estado local permite al usuario escribir "0." o "0," sin que se convierta inmediatamente en un número.

```typescript
// Estado local (línea 18)
const [densidadTexts, setDensidadTexts] = useState<{ [key: number]: string }>({});
```

**El bug ocurría en `handleDensidadBlur()` (línea 153):**

```typescript
// ❌ CÓDIGO INCORRECTO (ANTES)
const handleDensidadBlur = (index: number) => {
    const textValue = densidadTexts[index];
    
    if (!textValue || textValue === '') {  // ⚠️ PROBLEMA AQUÍ
        // Si está vacío, actualizar como null
        handleNestedArrayChange('materialConsumo', index, 'densidad', '');
        return;
    }
    // ...resto del código
};
```

**¿Por qué fallaba?**

1. Cuando se abre un pedido (duplicado o existente), `densidadTexts` está **vacío** (`{}`).
2. Si el usuario hace clic en el campo de densidad y luego sale sin escribir nada (evento `onBlur`):
   - `densidadTexts[index]` es `undefined`
   - La condición `if (!textValue || textValue === '')` evalúa a `true`
   - Se ejecuta `handleNestedArrayChange('materialConsumo', index, 'densidad', '')` 
   - **Esto borra el valor existente en `formData.materialConsumo[index].densidad`**

3. El método `getDensidadDisplayValue()` mostraba correctamente el valor del `formData`, pero el evento `onBlur` lo borraba.

---

## 🛠️ Correcciones Aplicadas

### Fix #1: Modificación en `handleDensidadBlur()`

**Archivo:** `components/SeccionDatosTecnicosDeMaterial.tsx` (línea 153)

```typescript
// ✅ CÓDIGO CORRECTO (DESPUÉS)
const handleDensidadBlur = (index: number) => {
    const textValue = densidadTexts[index];
    
    // ✅ FIX: Solo actualizar si realmente se editó el campo
    // Si densidadTexts[index] es undefined, significa que el usuario no tocó el campo
    if (textValue === undefined) {
        // No hacer nada - mantener el valor existente en formData
        return;
    }
    
    if (!textValue || textValue === '') {
        // Si el usuario borró el contenido, actualizar como null
        handleNestedArrayChange('materialConsumo', index, 'densidad', '');
        return;
    }
    
    // ...resto del código sin cambios
};
```

**Cambio clave:** Ahora se verifica **explícitamente** si `textValue === undefined`, lo que indica que el usuario **no tocó** el campo. En ese caso, se retorna sin hacer nada, **preservando el valor existente** en `formData`.

---

### Fix #2: Limpiar Estado Local al Cambiar de Pedido

**Archivo:** `components/SeccionDatosTecnicosDeMaterial.tsx` (línea 21)

```typescript
// ✅ FIX: Limpiar el estado local cuando cambia el pedido (duplicación o carga)
// Esto evita que valores de ediciones anteriores interfieran con el nuevo pedido
useEffect(() => {
    setDensidadTexts({});
}, [formData.id]); // Se ejecuta cuando cambia el ID del pedido
```

**Razón:** Este efecto garantiza que cuando se abre un nuevo pedido (por ejemplo, al duplicar o cambiar de pedido), el estado local `densidadTexts` se limpia completamente. Esto previene que valores de ediciones anteriores interfieran con el nuevo pedido.

---

## ✅ Resultado Esperado

Después de aplicar estos fixes:

1. ✅ **Duplicación de Pedidos:** Los valores de densidad se copian correctamente y se mantienen visibles al abrir el pedido duplicado.

2. ✅ **Edición de Pedidos Existentes:** Los valores de densidad se mantienen intactos al editar un pedido, incluso si el usuario no toca el campo de densidad.

3. ✅ **Edición Activa de Densidad:** El usuario puede editar el campo de densidad normalmente, escribiendo valores como "0.92", "0,03", etc.

4. ✅ **Borrado Intencional:** Si el usuario borra intencionalmente el contenido del campo, este se guarda como `null` correctamente.

---

## 🧪 Casos de Prueba

Para verificar que el bug está resuelto:

### Caso 1: Duplicar Pedido con Densidad
1. Crear un pedido con `Material 1` → Densidad: `0.92`
2. Duplicar el pedido
3. Abrir el pedido duplicado
4. ✅ **Verificar:** El campo Densidad debe mostrar `0.92`

### Caso 2: Editar Pedido sin Tocar Densidad
1. Abrir un pedido existente con Densidad: `0.03`
2. Editar otro campo (ej. cliente, metros, etc.)
3. Guardar el pedido
4. Volver a abrir el pedido
5. ✅ **Verificar:** El campo Densidad debe seguir mostrando `0.03`

### Caso 3: Hacer Clic en Densidad y Salir sin Editar
1. Abrir un pedido existente con Densidad: `1.25`
2. Hacer clic en el campo de densidad (activar el input)
3. Salir del campo sin escribir nada (evento `onBlur`)
4. Guardar el pedido
5. Volver a abrir el pedido
6. ✅ **Verificar:** El campo Densidad debe seguir mostrando `1.25`

### Caso 4: Borrar Intencionalmente la Densidad
1. Abrir un pedido existente con Densidad: `0.92`
2. Seleccionar el valor del campo y borrarlo completamente
3. Salir del campo
4. Guardar el pedido
5. Volver a abrir el pedido
6. ✅ **Verificar:** El campo Densidad debe estar vacío (valor `null`)

---

## 📝 Notas Técnicas

### Flujo de Datos

```
1. Backend PostgreSQL (columna `data`)
   ↓
2. Hook `usePedidosManager.ts` (duplicación con spread operator)
   ↓
3. Componente `PedidoModal.tsx` (formData = JSON.parse(JSON.stringify(pedido)))
   ↓
4. Componente `SeccionDatosTecnicosDeMaterial.tsx` (renderizado y edición)
   ↓ (solo si el usuario edita)
5. Estado local `densidadTexts` (edición en tiempo real)
   ↓ (evento onBlur)
6. Actualización de `formData.materialConsumo[index].densidad`
   ↓ (al guardar)
7. Backend PostgreSQL (JSON.stringify(pedido) → columna `data`)
```

### Lecciones Aprendidas

1. **Estados locales duplicados:** Cuando se usa un estado local para gestionar la edición temporal de un valor, es crucial distinguir entre:
   - **Valor no inicializado** (`undefined`) → No hacer nada
   - **Valor vacío** (`""`) → Actualizar como `null`

2. **Efectos de limpieza:** Siempre limpiar estados locales cuando cambia el contexto (ej. cambio de ID de pedido).

3. **Eventos `onBlur`:** Tener cuidado con la lógica de `onBlur` que puede sobrescribir valores existentes si no se maneja correctamente.

---

## 🔗 Referencias

- **Archivo principal:** `components/SeccionDatosTecnicosDeMaterial.tsx`
- **Líneas modificadas:** 21-26 (useEffect), 153-185 (handleDensidadBlur)
- **Tipo de dato:** `materialConsumo` es un array de objetos con `{ necesario, recibido, micras, densidad }`
- **Almacenamiento:** El objeto completo del pedido se guarda en PostgreSQL en la columna `data` como JSONB

---

**Autor:** GitHub Copilot  
**Revisado por:** Sistema de desarrollo GestionPedidosPigmea
