# Lógica de Cálculo de Columnas - Reporte de Planificación

Este documento detalla cómo se calculan y clasifican los pedidos en las diferentes columnas (máquinas/categorías) dentro del gráfico y la tabla del "Centro de Planificación".

## 1. Filtrado Inicial de Pedidos

Antes de clasificar, los pedidos pasan por un filtro global basado en:
1.  **Etapa**: Se incluyen pedidos en todas las etapas, excepto de `archivados`.
2.  **Fecha**: Se filtran según el rango de fechas seleccionado (Semana actual, Próxima semana, Mes, etc.) aplicado sobre el campo de fecha elegido (por defecto `nuevaFechaEntrega`).

## 2. Clasificación en Columnas (ETAPAS - IMPRESIÓN)

Cada pedido filtrado se asigna a **una sola categoría** siguiendo un orden de prioridad estricto. La lógica se evalúa para cada pedido individualmente.

### Prioridad 1: DNT (Externa)
Esta es la regla más fuerte. Un pedido se asigna a la columna **DNT** si cumple **cualquiera** de estas condiciones:
*   El nombre del **Vendedor** contiene la cadena de texto `"DNT"`.
*   *(Nota: Anteriormente se verificaba también si la máquina asignada contenía "DNT", pero actualmente la prioridad absoluta es el Vendedor).*

> **Fórmula:** Si `pedido.vendedorNombre` incluye "DNT" → Columna **DNT**.

### Prioridad 2: Pedidos Anónimos (No se incluyen ya se eliminó)
Si no es DNT, se verifica si el pedido está marcado como anónimo.
*   **Condición:** `pedido.anonimo` es `true`.
*   **Destino:** Columna **ANON**.

### Prioridad 3: Máquina Asignada (Identificada)
Si no es DNT, se revisa el campo `maquinaImpresion`.
*   Se busca si el valor coincide con alguna de las máquinas conocidas:
    *   **Windmöller 1**
    *   **Windmöller 3**
    *   **GIAVE**
*   **Destino:** Columna correspondiente a la máquina detectada.

### Prioridad 4: Pedidos VARIABLES
SOLO si el pedido está en estado de cliché con los valores: `NUEVO` o `REPETICION CON CAMBIO` este debe sumar a la columna **Variable**.
*   si el pedido tiene marcado `HORAS CONFIRMADAS` o Tiene una fecha ingresada en el campo `Compra Cliché` este pedido pasaría a sumar normal a la columna correspondiente a la máquina detectada de la prioridad 3.

---

## 3. Cálculo de Carga (Horas)

Una vez asignado el pedido a una columna, se suma su tiempo de producción al total de esa semana y máquina.

**Fórmula de Tiempo:**
1.  Se intenta leer `tiempoProduccionPlanificado` (formato "HH:MM").
2.  Si no existe o es 0, se usa `tiempoProduccionDecimal` (horas en decimal).
3.  Si ambos faltan, se asume 0 horas.

---

## 4. Cálculo de Columna "LIBRES"

La capacidad libre se calcula semanalmente mediante una fórmula fija solicitada.

**Fórmula:**
```
LIBRES = 180 - (Carga WH1) - (Carga WH3) - (Carga DNT)
```

*   **180**: Capacidad base fija por semana (horas).
*   **Carga WH1**: Suma de horas de pedidos en Windmöller 1.
*   **Carga WH3**: Suma de horas de pedidos en Windmöller 3.
*   **Carga DNT**: Suma de horas de pedidos clasificados como DNT.

> **Nota:** Las cargas de "GIAVE", "ANON" o "Sin Asignar" **NO** restan capacidad en este cálculo de "Libres".