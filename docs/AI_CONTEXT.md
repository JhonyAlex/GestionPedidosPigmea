# AI Context

## Decisiones recientes
- Creación de Pedidos Muestra: Se añadió un flujo especial para la vista de Producción (Kanban) que permite crear pedidos "Muestra". Estos pedidos omiten la etapa de "Preparación" y se inyectan directamente en la etapa de la Máquina de Impresión seleccionada.
- Exportación PDF de pedidos: se añadió la columna `Hecho` entre `Tipo` y `Capa`, dibujando el checkbox con `rect` para evitar problemas de render de símbolos.
- En el PDF de pedidos se redujo 15% la fuente de columnas `Cliente / # Pedido`, `Sig. Etapa` y `Observaciones`.
- Formato de `Metros` en PDF: normalización robusta y separación de miles en estilo `es-ES` desde `1.000`.
