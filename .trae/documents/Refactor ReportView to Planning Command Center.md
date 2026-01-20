I will transform the `ReportView.tsx` into a "Planning Command Center" with the following technical specifications:

### 1. File Cleanup & Preparation
*   Clear existing logic in `ReportView.tsx`, keeping imports and structure.
*   Import `DateFilterCombined` and necessary constants (`PREPARACION_SUB_ETAPAS_IDS`, `MAQUINAS_IMPRESION`).

### 2. State Management & Filters
*   **Stage Filter (Multi-select)**:
    *   **Options**: 'PREPARACION', 'LISTO_PARA_PRODUCCION', plus all other `Etapa` enums.
    *   **Logic**:
        *   `LISTO_PARA_PRODUCCION`: Matches `etapaActual === Etapa.PREPARACION` AND `subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION`.
        *   `PREPARACION`: Matches `etapaActual === Etapa.PREPARACION` AND `subEtapaActual !== PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION`.
        *   Others: Direct match on `etapaActual`.
    *   **Default**: Both 'PREPARACION' and 'LISTO_PARA_PRODUCCION' selected.
*   **Machine Filter (Multi-select)**:
    *   **Options**: Machines from `MAQUINAS_IMPRESION`, "DNT", and "Sin Asignar".
    *   **Logic**:
        *   "DNT": `vendedorNombre === 'DNT'`.
        *   "Sin Asignar": Empty `maquinaImpresion` (and not DNT).
        *   Specific Machine: Matches `maquinaImpresion` (and not DNT).
*   **Date Filter**:
    *   Uses `DateFilterCombined`.

### 3. Data Processing Engine
*   **Normalization**: Prioritize "DNT" based on vendor.
*   **Calculations**: Convert times to decimal hours.
*   **Classification**:
    *   **Firm Load**: `clicheDisponible === true`.
    *   **Variable Load**: `clicheDisponible === false`.

### 4. Visualization (Stacked Bar Chart)
*   Implement a stacked bar chart showing Firm vs. Variable hours per machine.
*   Axes: Machines (X) vs Hours (Y).

### 5. Detail View (Table)
*   **Columns**: Priority, Client/Order #, Machine, Cliche, Stage, Planned Hours, Delivery Date.
*   **Sorting**: Priority desc, then Delivery Date asc.
*   **Footer**: Add a summary row showing the total sum of planned hours for the filtered selection.
