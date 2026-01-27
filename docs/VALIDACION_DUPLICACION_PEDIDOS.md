# 🧪 SCRIPT DE VALIDACIÓN - Clasificación de Pedidos en Reportes

## Objetivo
Validar que los pedidos duplicados se clasifican correctamente en la vista de reportes según las reglas de `CALCULO_REPORTES.md`.

---

## ✅ CASOS DE PRUEBA

### **Caso 1: Pedido con Estado NUEVO sin Horas Confirmadas**

**Pedido Original:**
```json
{
  "estadoCliché": "NUEVO",
  "horasConfirmadas": false,
  "compraCliche": undefined,
  "maquinaImpresion": "Windmöller 1"
}
```

**Resultado Esperado:**
- ✅ Debe clasificarse en columna **VARIABLES**
- ✅ NO debe clasificarse en "Windmöller 1"

---

### **Caso 2: Pedido con Estado NUEVO con Horas Confirmadas**

**Pedido Original:**
```json
{
  "estadoCliché": "NUEVO",
  "horasConfirmadas": true,
  "compraCliche": "2026-01-15",
  "maquinaImpresion": "Windmöller 1"
}
```

**Pedido Duplicado (ANTES de la corrección):**
```json
{
  "estadoCliché": "NUEVO",
  "horasConfirmadas": true,  // ❌ ERROR: Se mantenía del original
  "compraCliche": "2026-01-15",  // ❌ ERROR: Se mantenía del original
  "maquinaImpresion": ""
}
```
- ❌ Se clasificaba en "Windmöller 1" (INCORRECTO)

**Pedido Duplicado (DESPUÉS de la corrección):**
```json
{
  "estadoCliché": "NUEVO",
  "horasConfirmadas": false,  // ✅ CORRECTO: Reseteado
  "compraCliche": undefined,  // ✅ CORRECTO: Reseteado
  "maquinaImpresion": ""
}
```
- ✅ Se clasifica en "VARIABLES" (CORRECTO)

---

### **Caso 3: Pedido con Estado REPETICIÓN CON CAMBIO**

**Pedido Original:**
```json
{
  "estadoCliché": "REPETICIÓN CON CAMBIO",
  "horasConfirmadas": true,
  "compraCliche": "2026-01-20",
  "maquinaImpresion": "Windmöller 3"
}
```

**Pedido Duplicado (DESPUÉS de la corrección):**
```json
{
  "estadoCliché": "REPETICIÓN CON CAMBIO",
  "horasConfirmadas": false,  // ✅ Reseteado
  "compraCliche": undefined,  // ✅ Reseteado
  "maquinaImpresion": ""
}
```

**Resultado Esperado:**
- ✅ Debe clasificarse en columna **VARIABLES**

---

### **Caso 4: Pedido con Estado REPETICIÓN (sin cambios)**

**Pedido Original:**
```json
{
  "estadoCliché": "REPETICIÓN",
  "horasConfirmadas": true,
  "compraCliche": "2026-01-18",
  "maquinaImpresion": "GIAVE"
}
```

**Pedido Duplicado (DESPUÉS de la corrección):**
```json
{
  "estadoCliché": "REPETICIÓN",
  "horasConfirmadas": false,  // ✅ Reseteado
  "compraCliche": undefined,  // ✅ Reseteado
  "maquinaImpresion": ""
}
```

**Resultado Esperado:**
- ✅ Debe clasificarse en columna **VARIABLES** (porque no tiene máquina asignada)

---

### **Caso 5: Pedido DNT (Prioridad Máxima)**

**Pedido Original:**
```json
{
  "vendedorNombre": "DNT Proveedor",
  "estadoCliché": "NUEVO",
  "horasConfirmadas": true,
  "compraCliche": "2026-01-15",
  "maquinaImpresion": "Windmöller 1"
}
```

**Pedido Duplicado:**
```json
{
  "vendedorNombre": "DNT Proveedor",
  "estadoCliché": "NUEVO",
  "horasConfirmadas": false,  // ✅ Reseteado
  "compraCliche": undefined,  // ✅ Reseteado
  "maquinaImpresion": ""
}
```

**Resultado Esperado:**
- ✅ Debe clasificarse en columna **DNT** (prioridad máxima)
- ✅ Ignora el estado de `horasConfirmadas` y `compraCliche`

---

## 📋 CHECKLIST DE VALIDACIÓN

### **Antes de Duplicar:**
- [ ] Verificar que el pedido original tiene `horasConfirmadas = true`
- [ ] Verificar que el pedido original tiene `compraCliche` con fecha
- [ ] Verificar que el pedido original tiene `maquinaImpresion` asignada

### **Después de Duplicar:**
- [ ] Verificar que el pedido duplicado tiene `horasConfirmadas = false`
- [ ] Verificar que el pedido duplicado tiene `compraCliche = undefined`
- [ ] Verificar que el pedido duplicado tiene `recepcionCliche = undefined`
- [ ] Verificar que el pedido duplicado tiene `clicheDisponible = false`
- [ ] Verificar que el pedido duplicado tiene `materialDisponible = false`
- [ ] Verificar que el pedido duplicado tiene `subEtapaActual = "GESTION_NO_INICIADA"`
- [ ] Verificar que el pedido duplicado tiene `maquinaImpresion = ""`

### **En la Vista de Reportes:**
- [ ] Verificar que el pedido duplicado aparece en la columna **VARIABLES**
- [ ] Verificar que el pedido duplicado NO aparece en la columna de su máquina original
- [ ] Verificar que los tiempos se calculan correctamente
- [ ] Verificar que la capacidad libre se calcula correctamente

---

## 🔍 INSPECCIÓN MANUAL

### **Pasos para Validar:**

1. **Abrir la aplicación** en el navegador
2. **Ir a la vista de Kanban** o Lista de Pedidos
3. **Seleccionar un pedido** con las siguientes características:
   - `estadoCliché`: "NUEVO" o "REPETICIÓN CON CAMBIO"
   - `horasConfirmadas`: `true`
   - `compraCliche`: Con fecha
   - `maquinaImpresion`: Asignada (ej: "Windmöller 1")

4. **Duplicar el pedido** usando el botón de duplicar
5. **Abrir el pedido duplicado** y verificar los campos:
   - `horasConfirmadas` debe ser `false`
   - `compraCliche` debe estar vacío
   - `recepcionCliche` debe estar vacío
   - `clicheDisponible` debe ser `false`
   - `materialDisponible` debe ser `false`
   - `subEtapaActual` debe ser "Sin Gestión Iniciada"

6. **Ir a la Vista de Reportes** (Centro de Planificación)
7. **Verificar la clasificación:**
   - El pedido duplicado debe aparecer en la columna **VARIABLES**
   - El pedido duplicado NO debe aparecer en la columna de su máquina original

---

## 🐛 PROBLEMAS CONOCIDOS

### **Pedidos Duplicados Antes de la Corrección:**

Si tienes pedidos que fueron duplicados **ANTES** de esta corrección (27/01/2026), pueden tener valores incorrectos.

**Solución:**
1. Identificar pedidos duplicados con `horasConfirmadas = true` o `compraCliche` con fecha
2. Editar manualmente cada pedido
3. Desmarcar "Horas Confirmadas"
4. Limpiar la fecha de "Compra Cliché"
5. Guardar los cambios

---

## 📊 RESULTADOS ESPERADOS

### **Clasificación Correcta:**

| Estado Cliché | Horas Confirmadas | Compra Cliché | Máquina Asignada | Columna Esperada |
|--------------|-------------------|---------------|------------------|------------------|
| NUEVO | false | undefined | - | **VARIABLES** |
| NUEVO | true | 2026-01-15 | Windmöller 1 | **Windmöller 1** |
| REPETICIÓN CON CAMBIO | false | undefined | - | **VARIABLES** |
| REPETICIÓN CON CAMBIO | true | 2026-01-20 | Windmöller 3 | **Windmöller 3** |
| REPETICIÓN | false | undefined | - | **VARIABLES** |
| DNT (cualquier estado) | (cualquier valor) | (cualquier valor) | (cualquier valor) | **DNT** |

---

## ✅ CONFIRMACIÓN FINAL

Una vez completadas todas las pruebas, confirmar que:

- ✅ Los pedidos duplicados se crean con los campos reseteados correctamente
- ✅ La clasificación en reportes sigue las reglas de `CALCULO_REPORTES.md`
- ✅ Los tiempos se calculan correctamente
- ✅ La capacidad libre se calcula correctamente
- ✅ No hay regresiones en otras funcionalidades

---

**Fecha de Validación:** _____________  
**Validado por:** _____________  
**Estado:** [ ] Aprobado [ ] Rechazado [ ] Requiere ajustes
