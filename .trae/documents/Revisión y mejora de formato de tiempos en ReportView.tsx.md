## 📋 REVISIÓN COMPLETA DE FORMATO DE TIEMPOS EN REPORTVIEW.TSX

### ✅ **COMPONENTES QUE YA USAN FORMATO HH:MM CORRECTAMENTE:**

1. **ReportView.tsx** - Vista Centro de Planificación:
   - ✅ Tabla de planificación semanal (líneas 874, 881-883)
   - ✅ Detalle de pedidos (línea 1340)
   - ✅ Exportación PDF (líneas 874, 881-883)

2. **PlanningTable.tsx** - Planificación Semanal:
   - ✅ Todas las columnas de máquinas (línea 125)
   - ✅ Columna de capacidad libre (línea 130)
   - ✅ Totales por máquina (línea 142)
   - ✅ Total de capacidad libre (línea 146)

3. **PlanningChart.tsx** - Carga Semanal:
   - ✅ Etiquetas de valores en barras (línea 134)
   - ✅ Tooltips de barras (línea 151)
   - ✅ Etiquetas del eje Y (línea 87)

### ❌ **COMPONENTES QUE NECESITAN CORRECCIÓN (FORMATO DECIMAL → HH:MM):**

#### 📊 Vista 2: Informes y Analítica

**4. KPICards.tsx** - Tarjetas de métricas:
   - ❌ Línea 78: `Horas Totales` - muestra `.toFixed(1)` decimal
   - ❌ Línea 90: `Tiempo Promedio` - muestra `.toFixed(2)` decimal

**5. ProductionTrendsChart.tsx** - Gráfico de tendencias:
   - ❌ Línea 162: Total de tiempo - muestra `.toFixed(1) + ' h'`
   - ❌ Línea 177: Promedio de tiempo - muestra `.toFixed(1) + ' h'`

**6. MachinePerformanceChart.tsx** - Rendimiento por máquina:
   - ❌ Línea 224: Horas por máquina - muestra `.toFixed(1) + ' h'`
   - ❌ Línea 243: Total de horas - muestra `.toFixed(1) + ' h'`

**7. RankingsTable.tsx** - Tabla de rankings:
   - ❌ Línea 220: Horas por ítem - muestra `.toFixed(1) + ' h'`

### 📋 **PLAN DE ACCIÓN:**

1. **Importar la función `formatDecimalHoursToHHMM`** en los componentes que la necesitan
2. **Reemplazar los formatos decimales** por `formatDecimalHoursToHHMM()` en:
   - `KPICards.tsx` (2 cambios)
   - `ProductionTrendsChart.tsx` (2 cambios)
   - `MachinePerformanceChart.tsx` (2 cambios)
   - `RankingsTable.tsx` (1 cambio)

3. **Verificar que los cálculos internos** sigan usando decimales (solo cambiar la presentación)

### 🎯 **RESUMEN:**
- **7 archivos analizados** completamente
- **4 componentes ya funcionan correctamente** con formato hh:mm
- **4 componentes necesitan corrección** (8 ubicaciones específicas)
- **0 cálculos internos afectados** (solo cambios visuales)

¿Deseas que proceda con las correcciones en los componentes identificados?