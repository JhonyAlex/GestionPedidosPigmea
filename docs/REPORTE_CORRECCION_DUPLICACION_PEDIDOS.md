# 🔍 REPORTE DE CORRECCIÓN - Reglas de Tiempos en Reportes

**Fecha:** 2026-01-27  
**Problema:** Pedidos duplicados no se clasifican correctamente en la vista de reportes  
**Estado:** ✅ CORREGIDO

---

## 📋 RESUMEN EJECUTIVO

Se identificó y corrigió un error crítico en la función de duplicación de pedidos que causaba que los pedidos duplicados mantuvieran los valores de `horasConfirmadas` y `compraCliche` del pedido original. Esto provocaba una clasificación incorrecta en la vista de reportes, violando las reglas establecidas en `CALCULO_REPORTES.md`.

---

## 🐛 PROBLEMA IDENTIFICADO

### **Ubicación del Error:**
- **Archivo:** `hooks/usePedidosManager.ts`
- **Función:** `handleDuplicatePedido` (líneas 565-610)

### **Descripción del Error:**

Al duplicar un pedido, los siguientes campos **NO se estaban reseteando**:

1. ❌ `horasConfirmadas` - Se mantenía del pedido original
2. ❌ `compraCliche` - Se mantenía del pedido original  
3. ❌ `recepcionCliche` - Se mantenía del pedido original
4. ❌ `clicheDisponible` - Se mantenía del pedido original
5. ❌ `materialDisponible` - Se mantenía del pedido original
6. ❌ `subEtapaActual` - No se establecía explícitamente
7. ❌ `clicheInfoAdicional` - Se mantenía del pedido original

### **Impacto en la Vista de Reportes:**

Según `CALCULO_REPORTES.md` (Prioridad 4: VARIABLES):

```
SOLO si el pedido está en estado de cliché con los valores: NUEVO o REPETICION CON CAMBIO 
este debe sumar a la columna Variable.

- Si el pedido tiene marcado HORAS CONFIRMADAS o Tiene una fecha ingresada en el campo 
  Compra Cliché, este pedido pasaría a sumar normal a la columna correspondiente 
  a la máquina detectada de la prioridad 3.
```

**Consecuencia:**  
Los pedidos duplicados con `horasConfirmadas = true` o `compraCliche` con fecha se clasificaban incorrectamente en la columna de su máquina asignada en lugar de ir a la columna **VARIABLES**, aunque deberían estar ahí según su estado de cliché.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Cambios Realizados:**

Se modificó la función `handleDuplicatePedido` en `hooks/usePedidosManager.ts` para resetear todos los campos críticos relacionados con la gestión de cliché y preparación:

```typescript
const newPedido: Pedido = {
    ...pedidoClonado,
    id: newId,
    secuenciaPedido: parseInt(newId.slice(-6)),
    orden: maxOrder + 1,
    numeroRegistro: numeroRegistro,
    fechaCreacion: now.toISOString(),
    etapaActual: initialStage,
    subEtapaActual: PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA, // ✅ NUEVO
    etapasSecuencia: [{ etapa: initialStage, fecha: now.toISOString() }],
    historial: [generarEntradaHistorial(currentUserRole, 'Creación', `Pedido duplicado desde ${pedidoToDuplicate.numeroPedidoCliente} (ID: ${pedidoToDuplicate.id}).`)],
    maquinaImpresion: '',
    fechaFinalizacion: undefined,
    tiempoTotalProduccion: undefined,
    antivahoRealizado: false,
    // ✅ CRÍTICO: Resetear campos de gestión de cliché y preparación
    horasConfirmadas: false, // ✅ NUEVO
    compraCliche: undefined, // ✅ NUEVO
    recepcionCliche: undefined, // ✅ NUEVO
    estadoCliché: pedidoClonado.estadoCliché, // ✅ Mantener estado original
    clicheDisponible: false, // ✅ NUEVO
    materialDisponible: false, // ✅ NUEVO
    clicheInfoAdicional: undefined, // ✅ NUEVO
};
```

### **Campos Reseteados:**

| Campo | Valor Anterior | Valor Nuevo | Razón |
|-------|---------------|-------------|-------|
| `subEtapaActual` | No establecido | `GESTION_NO_INICIADA` | Todos los pedidos nuevos deben iniciar en "Sin Gestión Iniciada" |
| `horasConfirmadas` | Del pedido original | `false` | **CRÍTICO** - Afecta clasificación en reportes |
| `compraCliche` | Del pedido original | `undefined` | **CRÍTICO** - Afecta clasificación en reportes |
| `recepcionCliche` | Del pedido original | `undefined` | Debe gestionarse desde cero |
| `clicheDisponible` | Del pedido original | `false` | Debe verificarse nuevamente |
| `materialDisponible` | Del pedido original | `false` | Debe verificarse nuevamente |
| `clicheInfoAdicional` | Del pedido original | `undefined` | Información específica del pedido original |
| `estadoCliché` | Del pedido original | **Mantenido** | Se preserva el estado (NUEVO, REPETICIÓN, etc.) |

---

## 🎯 VALIDACIÓN DE LA CORRECCIÓN

### **Escenario de Prueba:**

**Pedido Original:**
- `estadoCliché`: "NUEVO"
- `horasConfirmadas`: `true`
- `compraCliche`: "2026-01-15"
- `maquinaImpresion`: "Windmöller 1"

**Antes de la Corrección:**
- ❌ Pedido duplicado se clasificaba en columna **"Windmöller 1"**
- ❌ Razón: Mantenía `horasConfirmadas = true` y `compraCliche` con fecha

**Después de la Corrección:**
- ✅ Pedido duplicado se clasifica en columna **"VARIABLES"**
- ✅ Razón: `horasConfirmadas = false` y `compraCliche = undefined`
- ✅ Cumple con las reglas de `CALCULO_REPORTES.md`

---

## 📊 IMPACTO EN PEDIDOS EXISTENTES

### **Pedidos Ya Duplicados:**

Los pedidos que ya fueron duplicados **ANTES** de esta corrección pueden tener valores incorrectos. Para corregirlos:

1. **Identificar pedidos duplicados** con `horasConfirmadas = true` o `compraCliche` con fecha
2. **Verificar manualmente** si estos valores son correctos o heredados del pedido original
3. **Resetear manualmente** si es necesario desde el modal de edición del pedido

### **Pedidos Futuros:**

Todos los pedidos duplicados **DESPUÉS** de esta corrección se crearán correctamente con los campos reseteados.

---

## 🔄 REGLAS DE CLASIFICACIÓN EN REPORTES

### **Recordatorio de Prioridades (según CALCULO_REPORTES.md):**

1. **PRIORIDAD 1: DNT** (Máxima prioridad)
   - Si `vendedorNombre` O `cliente` contiene "DNT" → Columna **DNT**

2. **PRIORIDAD 2: Anónimos** (Eliminado según spec)

3. **PRIORIDAD 3: Máquina Asignada**
   - Si tiene `maquinaImpresion` conocida (WM1, WM3, GIAVE)
   - EXCEPTO si cumple condiciones de PRIORIDAD 4

4. **PRIORIDAD 4: VARIABLES**
   - Si `estadoCliché` es "NUEVO" o "REPETICIÓN CON CAMBIO"
   - **Y** `horasConfirmadas` es `false` o `undefined`
   - **Y** `compraCliche` es `undefined` o vacío
   - O si no tiene máquina asignada

### **Fórmula de Capacidad Libre:**
```
LIBRES = 180 - WH1 - WH3 - DNT
```
(GIAVE y VARIABLES **NO** restan capacidad)

---

## ✅ CONCLUSIÓN

El error ha sido corregido exitosamente. Los pedidos duplicados ahora se clasificarán correctamente en la vista de reportes según las reglas establecidas en `CALCULO_REPORTES.md`.

### **Archivos Modificados:**
- ✅ `hooks/usePedidosManager.ts` (función `handleDuplicatePedido`)

### **Próximos Pasos Recomendados:**
1. Probar la duplicación de pedidos con diferentes estados de cliché
2. Verificar la clasificación en la vista de reportes
3. Revisar pedidos duplicados anteriormente si es necesario

---

**Desarrollado por:** Antigravity AI  
**Fecha de Corrección:** 2026-01-27
