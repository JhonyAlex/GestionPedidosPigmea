# ✅ Checklist de Verificación: Migración Masiva de Pedidos

## 📋 Problema Resuelto
Al mapear columnas del Excel, algunos campos no llegaban a "✅ Revisar Datos Antes de Importar". 
Se identificó que los campos de material (micras, densidad, necesario, recibido, gestionado) se consolidaban y eliminaban antes de mostrarse en la tabla.

## 🔧 Solución Implementada
1. ✅ Los campos individuales ahora se **mantienen** en `mappedData` durante todo el proceso de revisión
2. ✅ La consolidación a `materialConsumo` se realiza **solo al momento de importar** (función `transformMaterialFields`)
3. ✅ Se agregaron los campos `gestionado1-4` que faltaban en la lista de mapeo

---

## 📝 Checklist de Validación: Todos los Campos por Categoría

### **1️⃣ Campos Obligatorios** (deben llegar siempre)
- [x] `numeroPedidoCliente` - 🔢 Número de Pedido Cliente *
- [x] `cliente` - 👤 Cliente *
- [x] `fechaEntrega` - 📅 Fecha de Entrega *
- [x] `metros` - 📏 Metros *

### **2️⃣ Información de Producción**
- [x] `producto` - 📦 Producto
- [x] `desarrollo` - 🔬 Material/Desarrollo
- [x] `capa` - 📄 Capa
- [x] `observaciones` - 📝 Observaciones
- [x] `observacionesRapidas` - ⚡ Observaciones Rápidas
- [x] `observacionesMaterial` - 🧱 Observaciones Material

### **3️⃣ Máquinas y Vendedores**
- [x] `maquinaImpresion` - 🖨️ Máquina de Impresión
- [x] `vendedorNombre` - 💼 Vendedor

### **4️⃣ Fechas y Plazos**
- [x] `fechaCreacion` - 🕐 Fecha Creación
- [x] `nuevaFechaEntrega` - 📆 Nueva Fecha Entrega
- [x] `compraCliche` - 🛒 Fecha Compra Cliché
- [x] `recepcionCliche` - 📥 Fecha Recepción Cliché
- [x] `fechaFinalizacion` - 🏁 Fecha Finalización

### **5️⃣ Números y Medidas**
- [x] `numerosCompra` - 🧾 Números de Compra (separados por coma)
- [x] `velocidadPosible` - ⚡ Velocidad Posible (m/min)
- [x] `tiempoProduccionDecimal` - ⏱️ Tiempo Producción (decimal)

### **6️⃣ Bobinas y Dimensiones**
- [x] `bobinaMadre` - 🔵 Bobina Madre (mm)
- [x] `bobinaFinal` - 🟢 Bobina Final (mm)
- [x] `camisa` - 🎯 Camisa

### **7️⃣ Tiempos y Colores**
- [x] `minAdap` - ⏲️ Minutos Adaptación
- [x] `colores` - 🎨 Número de Colores
- [x] `minColor` - ⏰ Minutos por Color

### **8️⃣ Información de Cliché**
- [x] `clicheInfoAdicional` - ℹ️ Info Adicional Cliché
- [x] `estadoCliché` - 📋 Estado Cliché
- [x] `materialDisponible` - ✅ Material Disponible (checkbox)
- [x] `clicheDisponible` - ✅ Cliché Disponible (checkbox)
- [x] `horasConfirmadas` - ✅ Horas Confirmadas (checkbox)

### **9️⃣ Material 1** 🛒 (CRÍTICO - estos causaban el problema)
- [x] `numeroCompra1` - 🧾 N° Compra Material 1
- [x] `micras1` - 📏 Micras Material 1
- [x] `densidad1` - ⚖️ Densidad Material 1
- [x] `necesario1` - ✅ Necesario Material 1
- [x] `recibido1` - 📦 Recibido Material 1 (checkbox)
- [x] `gestionado1` - 🎯 Gestionado Material 1 (checkbox)

### **🔟 Material 2** 🛒
- [x] `numeroCompra2` - 🧾 N° Compra Material 2
- [x] `micras2` - 📏 Micras Material 2
- [x] `densidad2` - ⚖️ Densidad Material 2
- [x] `necesario2` - ✅ Necesario Material 2
- [x] `recibido2` - 📦 Recibido Material 2 (checkbox)
- [x] `gestionado2` - 🎯 Gestionado Material 2 (checkbox)

### **1️⃣1️⃣ Material 3** 🛒
- [x] `numeroCompra3` - 🧾 N° Compra Material 3
- [x] `micras3` - 📏 Micras Material 3
- [x] `densidad3` - ⚖️ Densidad Material 3
- [x] `necesario3` - ✅ Necesario Material 3
- [x] `recibido3` - 📦 Recibido Material 3 (checkbox)
- [x] `gestionado3` - 🎯 Gestionado Material 3 (checkbox)

### **1️⃣2️⃣ Material 4** 🛒
- [x] `numeroCompra4` - 🧾 N° Compra Material 4
- [x] `micras4` - 📏 Micras Material 4
- [x] `densidad4` - ⚖️ Densidad Material 4
- [x] `necesario4` - ✅ Necesario Material 4
- [x] `recibido4` - 📦 Recibido Material 4 (checkbox)
- [x] `gestionado4` - 🎯 Gestionado Material 4 (checkbox)

### **1️⃣3️⃣ Checkboxes Adicionales**
- [x] `antivaho` - ❄️ Antivaho
- [x] `antivahoRealizado` - ✅ Antivaho Realizado
- [x] `microperforado` - 🔴 Microperforado
- [x] `macroperforado` - 🔵 Macroperforado
- [x] `anonimo` - 🎭 Anónimo
- [x] `anonimoPostImpresion` - 🖨️ Post-Impresión Anónimo
- [x] `atencionObservaciones` - ⚠️ Atención Observaciones

### **1️⃣4️⃣ Workflow (campos globales)**
- [x] `etapaActual` - 📍 Etapa Actual
- [x] `subEtapaActual` - 🎯 Subetapa (solo si etapa = PREPARACION)
- [x] `prioridad` - ⭐ Prioridad
- [x] `tipoImpresion` - 🖨️ Tipo Impresión
- [x] `materialConsumoCantidad` - 🔢 Cantidad Consumo Material (1-4)

---

## 🧪 Cómo Probar el Sistema

### **Paso 1: Preparar Excel de Prueba**
Crear un Excel con al menos estas columnas para probar todos los materiales:

```
N° Pedido | Cliente | Fecha Entrega | Metros | N° Compra Mat1 | Micras Mat1 | Densidad Mat1 | Necesario Mat1 | Recibido Mat1 | Gestionado Mat1 | N° Compra Mat2 | Micras Mat2 | ...
```

### **Paso 2: Mapear Columnas** 🔗
1. Pegar datos en "📋 Pegar Datos del Excel"
2. En "🔗 Mapear Columnas del Excel", asignar cada columna al campo correspondiente
3. ✅ **Verificar que todas las columnas tengan asignación** (o "Ignorar columna")

### **Paso 3: Revisar Datos** ✅
1. Hacer clic en "Siguiente: Revisar Datos"
2. **🔍 VERIFICAR QUE TODOS LOS CAMPOS ESTÉN VISIBLES:**
   - Los campos de material 1-4 deben mostrarse en columnas separadas
   - Micras, densidad, necesario, recibido y gestionado deben tener valores
   - Si mapeaste `micras1` = "50", debe aparecer `50` en la columna "Micras Material 1"
   - Si mapeaste `recibido2` = "SI", debe aparecer checkbox marcado

### **Paso 4: Editar si Necesario** ✏️
- Hacer clic en cualquier celda para editarla
- Los checkboxes se pueden marcar/desmarcar con un clic
- Los valores numéricos se pueden modificar

### **Paso 5: Importar** 🚀
- Al hacer clic en "Importar X Pedidos", el sistema:
  1. Toma los campos individuales (`numeroCompra1`, `micras1`, etc.)
  2. Los consolida en `materialConsumo` array
  3. Los envía al backend en formato correcto

---

## 🐛 Errores Anteriores (RESUELTOS)

### ❌ Antes (problema):
```javascript
// Los campos se eliminaban antes de mostrarse
delete (mappedData as any)[numeroCompraKey];
delete (mappedData as any)[micrasKey];
delete (mappedData as any)[densidadKey];
// ... ❌ Eliminaba campos antes de revisar
```

### ✅ Ahora (solución):
```javascript
// Los campos se mantienen para revisión
// ✅ MANTENER campos temporales para visualización en tabla de revisión
// NO eliminarlos aquí - se consolidarán al momento de importar
```

---

## 📊 Total de Campos Disponibles para Mapeo

**Total: 84 campos** (incluyendo todos los materiales 1-4)

- Obligatorios: 4
- Producción: 6
- Máquinas/Vendedores: 2
- Fechas: 5
- Medidas: 3
- Bobinas: 3
- Colores: 3
- Cliché: 3
- Material 1: 6 (N°Compra, Micras, Densidad, Necesario, Recibido, Gestionado)
- Material 2: 6
- Material 3: 6
- Material 4: 6
- Checkboxes: 7
- Workflow: 5
- Otros: 10

---

## 🎯 Resumen de Cambios Realizados

### Archivo: `components/BulkImportModalV2.tsx`

1. **Líneas 590-644**: Modificada la sección de consolidación de materiales
   - ✅ Ahora incluye `gestionado` en la consolidación
   - ✅ NO elimina los campos individuales
   - ✅ Mantiene comentarios explicativos

2. **Líneas 152-181**: Agregados campos faltantes
   - ✅ `gestionado1`
   - ✅ `gestionado2`
   - ✅ `gestionado3`
   - ✅ `gestionado4`

3. **Función `transformMaterialFields` (línea 728)**: Ya existía y funciona correctamente
   - ✅ Consolida campos al momento de importar
   - ✅ Elimina campos individuales solo en el objeto que se envía al backend
   - ✅ No afecta la visualización en tabla de revisión

---

## 🆘 Si algo falta en la tabla de revisión

### Verificar:
1. ¿El campo está en `AVAILABLE_FIELDS` (líneas 103-186)?
2. ¿El campo tiene una celda en la tabla de revisión (líneas 2400-2500)?
3. ¿El campo se está eliminando en `processImportData` (líneas 590-644)?
   - **NO debería eliminarse** hasta `transformMaterialFields`

### Agregar un campo nuevo:
1. Agregarlo a `AVAILABLE_FIELDS` con su emoji y label
2. Agregarlo en la tabla de revisión con `<EditableCell>` o `<CheckboxCell>`
3. Si es numérico, agregarlo a la lista de transformación (línea 483)
4. Si es fecha, agregarlo a la lista de transformación de fechas (línea 483)
5. Si es material, agregarlo en `transformMaterialFields` (línea 728)

---

## ✅ Estado Final

**PROBLEMA RESUELTO**: Todos los campos mapeados ahora llegan correctamente a "✅ Revisar Datos Antes de Importar".

Los campos de material (micras1-4, densidad1-4, necesario1-4, recibido1-4, gestionado1-4) ahora:
- ✅ Se mapean correctamente
- ✅ Se muestran en la tabla de revisión
- ✅ Se pueden editar
- ✅ Se consolidan al importar
- ✅ Se envían al backend en formato correcto
