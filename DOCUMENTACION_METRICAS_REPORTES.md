# 📊 Documentación Completa: Métricas y Cálculos de Reportes

> **Última Actualización**: 6 de Febrero de 2026  
> **Propósito**: Documentar cómo se calculan todas las métricas, gráficos y tablas del sistema de reportes

---

## 📑 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Centro de Planificación](#centro-de-planificación)
3. [Informes y Analítica](#informes-y-analítica)
4. [Filtros y Configuración](#filtros-y-configuración)
5. [Glosario de Términos](#glosario-de-términos)

---

## 🏗️ Arquitectura General

```mermaid
flowchart TD
    Start[Usuario accede a Reportes] --> TabChoice{Selecciona pestaña}
    
    TabChoice -->|Centro de Planificación| Planning[Centro de Planificación]
    TabChoice -->|Informes y Analítica| Analytics[Informes y Analítica]
    
    Planning --> PlanningFilters[Aplicar Filtros<br/>- Fechas<br/>- Etapas<br/>- Máquinas]
    PlanningFilters --> PlanningData[Procesar Datos Localmente]
    PlanningData --> PlanningOutputs[Generar Outputs:<br/>- Tabla Semanal<br/>- Gráfico de Barras<br/>- Tabla Detalle<br/>- Análisis IA]
    
    Analytics --> AnalyticsFilters[Aplicar Filtros<br/>- Fechas<br/>- Etapas<br/>- Máquinas<br/>- Prioridad]
    AnalyticsFilters --> AnalyticsAPI[Llamada API Backend<br/>/api/analytics/summary]
    AnalyticsAPI --> AnalyticsData[Recibir Datos Agregados]
    AnalyticsData --> AnalyticsOutputs[Generar Outputs:<br/>- 8 KPI Cards<br/>- Gráficos<br/>- Rankings]
    
    style Planning fill:#e3f2fd
    style Analytics fill:#f3e5f5
    style PlanningOutputs fill:#c8e6c9
    style AnalyticsOutputs fill:#fff9c4
```

---

## 🗓️ Centro de Planificación

### Flujo de Procesamiento de Datos

```mermaid
flowchart TB
    subgraph Input["📥 ENTRADA DE DATOS"]
        Pedidos[Lista de Pedidos<br/>Todos los pedidos del sistema]
        Clientes[Tabla Clientes<br/>En tiempo real via WebSocket]
        Vendedores[Tabla Vendedores<br/>En tiempo real via WebSocket]
    end
    
    subgraph Enrich["🔄 ENRIQUECIMIENTO"]
        EnrichLogic[Actualizar nombres de<br/>clientes y vendedores por ID]
        Pedidos --> EnrichLogic
        Clientes --> EnrichLogic
        Vendedores --> EnrichLogic
        EnrichLogic --> EnrichedPedidos[Pedidos Enriquecidos]
    end
    
    subgraph Filters["🔍 FILTRADO INICIAL"]
        EnrichedPedidos --> F1{¿Archivado?}
        F1 -->|Sí| Exclude[Excluir]
        F1 -->|No| F2{¿Cumple etapa<br/>seleccionada?}
        F2 -->|No| Exclude
        F2 -->|Sí| F3{¿Cumple rango<br/>de fechas?}
        F3 -->|No| Exclude
        F3 -->|Sí| FilteredPedidos[Pedidos Filtrados]
    end
    
    subgraph Grouping["📊 AGRUPAMIENTO SEMANAL"]
        FilteredPedidos --> GetWeek[Extraer semana del año<br/>según campo de fecha seleccionado]
        GetWeek --> CreateWeek{¿Existe grupo<br/>para esta semana?}
        CreateWeek -->|No| InitWeek["Crear grupo semanal<br/>label, dateRange, machines vacío"]
        CreateWeek -->|Sí| ExistingWeek[Usar grupo existente]
        InitWeek --> ProcessOrder
        ExistingWeek --> ProcessOrder
    end
    
    subgraph Classification["🏷️ CLASIFICACIÓN POR CATEGORÍA"]
        ProcessOrder[Por cada pedido...] --> Priority1{PRIORIDAD 1:<br/>¿Vendedor o Cliente<br/>contiene 'DNT'?}
        Priority1 -->|Sí| CategoryDNT[Categoría: DNT]
        Priority1 -->|No| Priority3{PRIORIDAD 3:<br/>¿Tiene máquina<br/>asignada?}
        Priority3 -->|Sí| CheckVariables{PRIORIDAD 4:<br/>¿Cumple condiciones<br/>VARIABLES?}
        CheckVariables -->|Sí| CategoryVARIABLES[Categoría: VARIABLES]
        CheckVariables -->|No| CategoryMachine[Categoría: Máquina Asignada]
        Priority3 -->|No| CategoryVARIABLES
    end
    
    subgraph TimeCalc["⏱️ CÁLCULO DE TIEMPO"]
        CategoryDNT --> CalcTime
        CategoryVARIABLES --> CalcTime
        CategoryMachine --> CalcTime
        CalcTime[Calcular horas] --> T1{¿Existe<br/>tiempoProduccionPlanificado?}
        T1 -->|Sí y > 0| UsePlanned[Convertir HH:MM a horas]
        T1 -->|No o = 0| T2{¿Existe<br/>tiempoProduccionDecimal?}
        T2 -->|Sí| UseDecimal[Usar valor decimal]
        T2 -->|No| UseZero[Usar 0 horas]
        UsePlanned --> AddToCategory
        UseDecimal --> AddToCategory
        UseZero --> AddToCategory
        AddToCategory[Sumar horas a categoría<br/>y agregar pedido a lista]
    end
    
    subgraph CapacityCalc["📐 CÁLCULO DE CAPACIDAD"]
        AddToCategory --> SortWeeks[Ordenar semanas<br/>cronológicamente]
        SortWeeks --> CalcFree[Por cada semana:<br/>LIBRES = 190 - WH1 - WH3 - DNT]
        CalcFree --> Note1[Nota: GIAVE y VARIABLES<br/>NO restan capacidad]
    end
    
    subgraph Outputs["📤 SALIDAS"]
        CalcFree --> Output1[Tabla Planificación Semanal]
        CalcFree --> Output2[Gráfico de Barras Apiladas]
        CalcFree --> Output3[Tabla de Detalle por Categoría]
        CalcFree --> Output4[Análisis IA Opcional]
    end
    
    style Input fill:#e1f5fe
    style Enrich fill:#f3e5f5
    style Filters fill:#fff3e0
    style Grouping fill:#e8f5e9
    style Classification fill:#fce4ec
    style TimeCalc fill:#f1f8e9
    style CapacityCalc fill:#e0f2f1
    style Outputs fill:#fffde7
```

---

### 🏷️ Lógica de Clasificación de Pedidos

#### Orden de Prioridad (Estricto)

```mermaid
flowchart TD
    Start[Pedido a clasificar] --> P1{PRIORIDAD 1<br/>¿Vendedor O Cliente<br/>contiene 'DNT'?}
    
    P1 -->|SÍ| DNT[✅ CATEGORÍA: DNT<br/>Sin importar máquina asignada]
    
    P1 -->|NO| P3{PRIORIDAD 3<br/>¿Tiene máquina<br/>asignada conocida?}
    
    P3 -->|SÍ| CheckMachine[Máquina: WM1, WM3 o GIAVE]
    
    CheckMachine --> P4{PRIORIDAD 4<br/>¿Cumple TODAS las condiciones?<br/>1. estadoCliché = NUEVO o<br/>   REPETICIÓN CON CAMBIO<br/>2. NO horasConfirmadas<br/>3. NO compraCliche<br/>4. NO clicheDisponible}
    
    P4 -->|SÍ| VAR1[✅ CATEGORÍA: VARIABLES<br/>Aunque tenga máquina asignada]
    
    P4 -->|NO| Machine[✅ CATEGORÍA: Nombre de Máquina<br/>WM1, WM3 o GIAVE]
    
    P3 -->|NO| VAR2[✅ CATEGORÍA: VARIABLES<br/>Sin máquina asignada]
    
    style DNT fill:#a5d6a7
    style VAR1 fill:#ce93d8
    style VAR2 fill:#ce93d8
    style Machine fill:#90caf9
```

**Ejemplos Prácticos:**

| Caso | Vendedor | Cliente | Máquina | Estado Cliché | Horas Conf. | Compra Cl. | Cl. Disp. | ➡️ Categoría | Razonamiento |
|------|----------|---------|---------|---------------|-------------|------------|-----------|--------------|--------------|
| 1 | Juan DNT | Coca Cola | WM1 | REPETICIÓN | ❌ | ❌ | ❌ | **DNT** | Vendedor contiene "DNT" - Prioridad 1 |
| 2 | Pedro | Cliente DNT | WM3 | NUEVO | ❌ | ❌ | ❌ | **DNT** | Cliente contiene "DNT" - Prioridad 1 |
| 3 | María | Pepsi | WM1 | NUEVO | ❌ | ❌ | ❌ | **VARIABLES** | Tiene máquina pero cumple condiciones P4 |
| 4 | Carlos | Bimbo | WM3 | REPETICIÓN | ✅ | ✅ | ✅ | **Windmöller 3** | Tiene máquina y NO cumple P4 |
| 5 | Ana | Nestlé | - | NUEVO | ❌ | ❌ | ❌ | **VARIABLES** | Sin máquina asignada |
| 6 | Luis | Danone | GIAVE | REPETICIÓN | ✅ | ✅ | ✅ | **GIAVE** | Tiene máquina GIAVE y NO cumple P4 |

---

### 📊 Cálculo Detallado por Categoría

```mermaid
flowchart TB
    Start["🎯 PEDIDO A CLASIFICAR"] --> CheckDNT
    
    subgraph DNT_Flow["🟢 CATEGORÍA: DNT"]
        CheckDNT{"¿Vendedor contiene 'DNT'<br/>O<br/>Cliente contiene 'DNT'?"}
        CheckDNT -->|SÍ| DNT_Yes["✅ ASIGNAR A DNT<br/><br/>Características:<br/>- Máxima prioridad<br/>- RESTA capacidad<br/>- Color: Verde oscuro #14532d"]
        
        DNT_Examples["Ejemplos DNT:<br/>• Vendedor: 'Juan DNT'<br/>• Cliente: 'Empresa DNT SA'<br/>• Cliente: 'DNT Industries'"]
        DNT_Yes -.-> DNT_Examples
    end
    
    CheckDNT -->|NO| CheckMachine
    
    subgraph Machine_Check["🔍 VERIFICAR MÁQUINA"]
        CheckMachine{"¿Tiene máquina<br/>asignada?"}
        CheckMachine -->|NO| Goto_Variables1["→ IR A VARIABLES"]
        CheckMachine -->|SÍ| IdentifyMachine{"¿Qué máquina?"}
        
        IdentifyMachine -->|WM1| CheckWM1_Variables
        IdentifyMachine -->|WM3| CheckWM3_Variables
        IdentifyMachine -->|GIAVE| CheckGIAVE_Variables
        IdentifyMachine -->|Otra| Goto_Variables2["→ IR A VARIABLES"]
    end
    
    subgraph WM1_Flow["🔵 CATEGORÍA: WINDMÖLLER 1"]
        CheckWM1_Variables{"¿Cumple condiciones<br/>VARIABLES?<br/>(ver detalle abajo)"}
        CheckWM1_Variables -->|SÍ| Goto_Variables3["→ IR A VARIABLES"]
        CheckWM1_Variables -->|NO| WM1_Assign["✅ ASIGNAR A WM1<br/><br/>Características:<br/>- Máquina principal<br/>- RESTA capacidad<br/>- Color: Azul oscuro #1e3a8a"]
        
        WM1_Examples["Ejemplo WM1:<br/>• Máquina: Windmöller 1<br/>• Estado cliché: REPETICIÓN<br/>• horasConfirmadas: true"]
        WM1_Assign -.-> WM1_Examples
    end
    
    subgraph WM3_Flow["🔴 CATEGORÍA: WINDMÖLLER 3"]
        CheckWM3_Variables{"¿Cumple condiciones<br/>VARIABLES?<br/>(ver detalle abajo)"}
        CheckWM3_Variables -->|SÍ| Goto_Variables4["→ IR A VARIABLES"]
        CheckWM3_Variables -->|NO| WM3_Assign["✅ ASIGNAR A WM3<br/><br/>Características:<br/>- Máquina principal<br/>- RESTA capacidad<br/>- Color: Rojo oscuro #7f1d1d"]
        
        WM3_Examples["Ejemplo WM3:<br/>• Máquina: Windmöller 3<br/>• Estado cliché: REPETICIÓN<br/>• clicheDisponible: true"]
        WM3_Assign -.-> WM3_Examples
    end
    
    subgraph GIAVE_Flow["🟠 CATEGORÍA: GIAVE"]
        CheckGIAVE_Variables{"¿Cumple condiciones<br/>VARIABLES?<br/>(ver detalle abajo)"}
        CheckGIAVE_Variables -->|SÍ| Goto_Variables5["→ IR A VARIABLES"]
        CheckGIAVE_Variables -->|NO| GIAVE_Assign["✅ ASIGNAR A GIAVE<br/><br/>Características:<br/>- Máquina suplementaria<br/>- NO resta capacidad<br/>- Color: Naranja oscuro #9a3412"]
        
        GIAVE_Examples["Ejemplo GIAVE:<br/>• Máquina: GIAVE<br/>• Estado cliché: REPETICIÓN<br/>• compraCliche: fecha válida"]
        GIAVE_Assign -.-> GIAVE_Examples
    end
    
    subgraph Variables_Flow["🟣 CATEGORÍA: VARIABLES"]
        Goto_Variables1 --> Variables_Assign
        Goto_Variables2 --> Variables_Assign
        Goto_Variables3 --> Variables_Assign
        Goto_Variables4 --> Variables_Assign
        Goto_Variables5 --> Variables_Assign
        
        Variables_Assign["✅ ASIGNAR A VARIABLES<br/><br/>Características:<br/>- Tiempo no confirmado<br/>- NO resta capacidad<br/>- Color: Morado oscuro #581c87"]
        
        Variables_Conditions["Condiciones VARIABLES:<br/>(TODAS deben cumplirse)<br/>1. estadoCliché = 'NUEVO' O<br/>   'REPETICIÓN CON CAMBIO'<br/>2. NO horasConfirmadas<br/>3. NO compraCliche<br/>4. NO clicheDisponible"]
        
        Variables_Examples["Ejemplos VARIABLES:<br/>• Sin máquina asignada<br/>• Cliché NUEVO sin confirmar<br/>• Cambio sin horas validadas"]
        
        Variables_Assign -.-> Variables_Conditions
        Variables_Assign -.-> Variables_Examples
    end
    
    subgraph Legend["📋 LEYENDA DE IMPACTO"]
        L1["RESTAN CAPACIDAD:<br/>190h - WM1 - WM3 - DNT = LIBRES"]
        L2["NO RESTAN CAPACIDAD:<br/>GIAVE, VARIABLES"]
    end
    
    style DNT_Flow fill:#c8e6c9
    style Machine_Check fill:#e3f2fd
    style WM1_Flow fill:#bbdefb
    style WM3_Flow fill:#ffcdd2
    style GIAVE_Flow fill:#ffe0b2
    style Variables_Flow fill:#e1bee7
    style Legend fill:#fff9c4
    
    style DNT_Yes fill:#a5d6a7,stroke:#2e7d32,stroke-width:3px
    style WM1_Assign fill:#90caf9,stroke:#1565c0,stroke-width:3px
    style WM3_Assign fill:#ef9a9a,stroke:#c62828,stroke-width:3px
    style GIAVE_Assign fill:#ffcc80,stroke:#e65100,stroke-width:3px
    style Variables_Assign fill:#ce93d8,stroke:#6a1b9a,stroke-width:3px
```

---

### 🔍 Condiciones Detalladas para VARIABLES

```mermaid
flowchart LR
    subgraph Check["VERIFICACIÓN DE CONDICIONES VARIABLES"]
        Start[Pedido con máquina asignada] --> C1
        
        C1{"Condición 1:<br/>¿Estado cliché es<br/>NUEVO o<br/>REPETICIÓN CON CAMBIO?"}
        C1 -->|NO| NotVariables["❌ NO es VARIABLES<br/>→ Va a su máquina"]
        C1 -->|SÍ| C2
        
        C2{"Condición 2:<br/>¿horasConfirmadas<br/>= false?"}
        C2 -->|NO| NotVariables
        C2 -->|SÍ| C3
        
        C3{"Condición 3:<br/>¿compraCliche<br/>= null o vacío?"}
        C3 -->|NO| NotVariables
        C3 -->|SÍ| C4
        
        C4{"Condición 4:<br/>¿clicheDisponible<br/>= false?"}
        C4 -->|NO| NotVariables
        C4 -->|SÍ| IsVariables["✅ SÍ es VARIABLES<br/>→ Ignora máquina asignada"]
    end
    
    style NotVariables fill:#ffccbc
    style IsVariables fill:#ce93d8,stroke:#6a1b9a,stroke-width:3px
```

**Tabla de Decisión:**

| Estado Cliché | horasConfirmadas | compraCliche | clicheDisponible | Resultado |
|---------------|------------------|--------------|------------------|-----------|
| NUEVO | ❌ false | ❌ null | ❌ false | ✅ **VARIABLES** |
| REPETICIÓN CON CAMBIO | ❌ false | ❌ null | ❌ false | ✅ **VARIABLES** |
| NUEVO | ✅ true | ❌ null | ❌ false | ❌ **Máquina Asignada** |
| NUEVO | ❌ false | ✅ fecha | ❌ false | ❌ **Máquina Asignada** |
| NUEVO | ❌ false | ❌ null | ✅ true | ❌ **Máquina Asignada** |
| REPETICIÓN | ❌ false | ❌ null | ❌ false | ❌ **Máquina Asignada** |

---

### 📊 Resumen Visual de Categorías

```mermaid
graph TB
    subgraph Categories["🎯 5 CATEGORÍAS DE CLASIFICACIÓN"]
        
        subgraph Cat1["🟢 DNT"]
            D1[Prioridad: MÁXIMA]
            D2[Identificación: Texto 'DNT' en<br/>vendedor O cliente]
            D3[Impacto Capacidad: ✅ RESTA]
            D4[Fórmula: Incluido en<br/>190 - WM1 - WM3 - DNT]
        end
        
        subgraph Cat2["🔵 WINDMÖLLER 1"]
            W1_1[Prioridad: Normal]
            W1_2[Identificación: maquinaImpresion = WM1<br/>Y NO cumple condiciones VARIABLES]
            W1_3[Impacto Capacidad: ✅ RESTA]
            W1_4[Fórmula: Incluido en<br/>190 - WM1 - WM3 - DNT]
        end
        
        subgraph Cat3["🔴 WINDMÖLLER 3"]
            W3_1[Prioridad: Normal]
            W3_2[Identificación: maquinaImpresion = WM3<br/>Y NO cumple condiciones VARIABLES]
            W3_3[Impacto Capacidad: ✅ RESTA]
            W3_4[Fórmula: Incluido en<br/>190 - WM1 - WM3 - DNT]
        end
        
        subgraph Cat4["🟠 GIAVE"]
            G1[Prioridad: Normal]
            G2[Identificación: maquinaImpresion = GIAVE<br/>Y NO cumple condiciones VARIABLES]
            G3[Impacto Capacidad: ❌ NO RESTA]
            G4[Razón: Máquina suplementaria<br/>que trabaja en paralelo]
        end
        
        subgraph Cat5["🟣 VARIABLES"]
            V1[Prioridad: Pendiente]
            V2[Identificación: Sin máquina O<br/>cumple 4 condiciones especiales]
            V3[Impacto Capacidad: ❌ NO RESTA]
            V4[Razón: Tiempo no confirmado,<br/>no se puede planificar aún]
        end
    end
    
    style Cat1 fill:#c8e6c9
    style Cat2 fill:#bbdefb
    style Cat3 fill:#ffcdd2
    style Cat4 fill:#ffe0b2
    style Cat5 fill:#e1bee7
```

---

### ⏱️ Cálculo de Tiempo de Producción

```mermaid
flowchart LR
    Start[Calcular tiempo para pedido] --> Check1{¿Existe<br/>tiempoProduccionPlanificado?}
    
    Check1 -->|Sí| Parse[Convertir formato HH:MM<br/>a minutos totales]
    Parse --> Divide[Dividir entre 60<br/>para obtener horas]
    Divide --> Validate{¿Resultado > 0?}
    
    Validate -->|Sí| UsePlanned[✅ Usar tiempo planificado]
    
    Validate -->|No| Fallback
    Check1 -->|No o vacío| Fallback
    
    Fallback{¿Existe<br/>tiempoProduccionDecimal?} -->|Sí| UseDecimal[✅ Usar tiempo decimal]
    
    Fallback -->|No| UseZero[✅ Usar 0 horas]
    
    UsePlanned --> End[Agregar a total de categoría]
    UseDecimal --> End
    UseZero --> End
    
    style UsePlanned fill:#a5d6a7
    style UseDecimal fill:#fff59d
    style UseZero fill:#ffccbc
```

**Ejemplo de Cálculo:**

```javascript
// EJEMPLO 1: Usar tiempo planificado
pedido.tiempoProduccionPlanificado = "12:30"
→ parseTimeToMinutes("12:30") = 750 minutos
→ 750 / 60 = 12.5 horas
✅ RESULTADO: 12.5 horas

// EJEMPLO 2: Fallback a decimal
pedido.tiempoProduccionPlanificado = "00:00"
pedido.tiempoProduccionDecimal = 8.75
→ Planificado es 0, usar decimal
✅ RESULTADO: 8.75 horas

// EJEMPLO 3: Sin datos
pedido.tiempoProduccionPlanificado = null
pedido.tiempoProduccionDecimal = null
✅ RESULTADO: 0 horas
```

---

### 📐 Fórmula de Capacidad Libre

```mermaid
flowchart TD
    subgraph Formula["💡 FÓRMULA"]
        Base[Capacidad Base = 190 horas/semana]
        Base --> Calc[LIBRES = 190 - WH1 - WH3 - DNT]
    end
    
    subgraph Impact["⚖️ IMPACTO EN CAPACIDAD"]
        WM1[Windmöller 1<br/>✅ SÍ RESTA]
        WM3[Windmöller 3<br/>✅ SÍ RESTA]
        DNT_Cat[DNT<br/>✅ SÍ RESTA]
        GIAVE[GIAVE<br/>❌ NO RESTA]
        VAR[VARIABLES<br/>❌ NO RESTA]
    end
    
    subgraph Example["📊 EJEMPLO PRÁCTICO"]
        Ex1[Semana 5:<br/>WH1 = 80h<br/>WH3 = 70h<br/>DNT = 20h<br/>GIAVE = 30h<br/>VARIABLES = 15h]
        Ex1 --> ExCalc[LIBRES = 190 - 80 - 70 - 20]
        ExCalc --> ExResult[LIBRES = 20 horas<br/>✅ Capacidad positiva]
    end
    
    subgraph Example2["⚠️ EJEMPLO SOBRECARGA"]
        Ex2[Semana 8:<br/>WH1 = 95h<br/>WH3 = 85h<br/>DNT = 25h<br/>GIAVE = 40h<br/>VARIABLES = 10h]
        Ex2 --> ExCalc2[LIBRES = 190 - 95 - 85 - 25]
        ExCalc2 --> ExResult2[LIBRES = -15 horas<br/>❌ SOBRECARGA!]
    end
    
    style Base fill:#e3f2fd
    style Calc fill:#c5e1a5
    style WM1 fill:#ffccbc
    style WM3 fill:#ffccbc
    style DNT_Cat fill:#ffccbc
    style GIAVE fill:#b2dfdb
    style VAR fill:#b2dfdb
    style ExResult fill:#a5d6a7
    style ExResult2 fill:#ef9a9a
```

**Razonamiento:**
- **Capacidad Base**: 190 horas/semana representa la capacidad total disponible para producción
- **WH1 y WH3**: Máquinas principales de producción - ocupan capacidad física
- **DNT**: Pedidos prioritarios que DEBEN ejecutarse - reservan capacidad
- **GIAVE**: Máquina auxiliar/suplementaria - corre en paralelo, no afecta capacidad principal
- **VARIABLES**: Pedidos sin tiempo confirmado - no se pueden planificar aún

---

### 📊 Tabla de Planificación Semanal

**Estructura de Columnas:**

| Columna | Cálculo | Propósito |
|---------|---------|-----------|
| **Semana** | Número de semana del año (1-52) | Identificación única |
| **Fechas** | Lunes a Viernes (ej: "3 feb al 7 feb") | Visualización del rango |
| **WH-1** | Suma de horas de pedidos en categoría "Windmöller 1" | Carga de máquina principal 1 |
| **VARIABLES** | Suma de horas de pedidos pendientes de confirmar | Trabajo pendiente de planificar |
| **WH-3** | Suma de horas de pedidos en categoría "Windmöller 3" | Carga de máquina principal 2 |
| **SUP GIAVE** | Suma de horas de pedidos en categoría "GIAVE" | Carga de máquina suplementaria |
| **DNT** | Suma de horas de pedidos prioritarios DNT | Carga prioritaria |
| **LIBRES** | 190 - WH1 - WH3 - DNT | Capacidad disponible |

**Códigos de Color:**

```mermaid
graph LR
    subgraph Columnas
        WH1[WH-1<br/>Azul Oscuro<br/>#1e3a8a] 
        VAR[VARIABLES<br/>Morado Oscuro<br/>#581c87]
        WH3[WH-3<br/>Rojo Oscuro<br/>#7f1d1d]
        GIAVE[SUP GIAVE<br/>Naranja Oscuro<br/>#9a3412]
        DNT[DNT<br/>Verde Oscuro<br/>#14532d]
        LIBRE[LIBRES<br/>Verde si > 0<br/>Rojo si < 0]
    end
    
    style WH1 fill:#1e3a8a,color:#fff
    style VAR fill:#581c87,color:#fff
    style WH3 fill:#7f1d1d,color:#fff
    style GIAVE fill:#9a3412,color:#fff
    style DNT fill:#14532d,color:#fff
    style LIBRE fill:#16a34a,color:#fff
```

---

### 📊 Gráfico de Barras Apiladas

```mermaid
flowchart TB
    subgraph Structure["🏗️ ESTRUCTURA DEL GRÁFICO"]
        Weeks[Eje X: Semanas] --> Bars[Barras Apiladas]
        Hours[Eje Y: Horas 0-Max] --> Bars
        Bars --> Sections[Secciones por Categoría:<br/>WH1, VARIABLES, WH3, GIAVE, DNT]
    end
    
    subgraph Scaling["📏 ESCALADO"]
        FindMax[Encontrar valor máximo<br/>en todos los datos]
        FindMax --> SetHeight[Altura del gráfico = 500px fijos]
        SetHeight --> Calculate[Cada hora = 500px / valorMaximo]
        Calculate --> Heights[Altura de cada sección =<br/>horas × factor de escala]
    end
    
    subgraph Interaction["🖱️ INTERACCIÓN"]
        Click[Usuario hace clic en sección] --> Filter[Filtrar pedidos de:<br/>- Semana específica<br/>- Categoría específica]
        Filter --> ShowTable[Mostrar tabla de detalle<br/>con pedidos individuales]
    end
    
    subgraph Labels["🏷️ ETIQUETAS"]
        TopLabels[Encima de cada sección:<br/>Tiempo en formato HH:MM]
        BottomLabels[Debajo del gráfico:<br/>Semana y rango de fechas]
    end
    
    style Structure fill:#e1f5fe
    style Scaling fill:#f3e5f5
    style Interaction fill:#fff3e0
    style Labels fill:#e8f5e9
```

**Ejemplo Visual (ASCII):**

```
Horas
190│
   │  ╔═══╗      
170│  ║DNT║         ╔═══╗
   │  ║ 20║         ║DNT║
150│  ╠═══╣         ║ 15║
   │  ║GIA║         ╠═══╣
130│  ║ 30║         ║GIA║
   │  ╠═══╣         ║ 25║
110│  ║WH3║   ╔═══╗ ╠═══╣
   │  ║ 70║   ║VAR║ ║WH3║
 90│  ╠═══╣   ║ 40║ ║ 65║
   │  ║VAR║   ╠═══╣ ╠═══╣
 70│  ║ 15║   ║WH1║ ║VAR║
   │  ╠═══╣   ║ 50║ ║ 35║
 50│  ║WH1║   ╚═══╝ ╠═══╣
   │  ║ 80║         ║WH1║
 30│  ╚═══╝         ║ 75║
   │                ╚═══╝
 10│  
   └──────────────────────→ Semanas
     Sem 5      Sem 6     Sem 7
   (3-7 feb) (10-14 feb)(17-21 feb)
```

---

### 📋 Tabla de Detalle por Categoría

**Activación:**
- Usuario hace clic en una sección del gráfico de barras
- Se activa filtro: `{semana: "SEMANA X", categoria: "Y"}`

**Columnas y Ordenamiento:**

| Columna | Fuente de Datos | Ordenable | Tipo de Ordenamiento |
|---------|----------------|-----------|---------------------|
| ☑️ (Checkbox) | - | ❌ No | - |
| **Pedido** | `numeroPedidoCliente` | ✅ Sí | Alfabético |
| **Cliente** | `cliente` (actualizado en tiempo real) | ✅ Sí | Alfabético |
| **Descripción** | `producto` o `descripcion` | ✅ Sí | Alfabético |
| **Fecha Entrega** | `nuevaFechaEntrega` o `fechaEntrega` | ✅ Sí | Cronológico |
| **Metros** | `metros` | ✅ Sí | Numérico |
| **Tiempo (hh:mm)** | Calculado (ver sección anterior) | ✅ Sí | Numérico (comparando horas) |
| **Acción** | - | ❌ No | - |

**Formato de Fecha:**
```
Origen BD: "2026-02-15"
Formato mostrado: "15-02-2026"
```

**Indicadores Visuales:**
- 🔵 Fila hover: fondo gris claro
- 🔵 Fila seleccionada: fondo azul claro
- ➡️ Al hacer hover: aparece "Ver →" en columna Acción

---

## 📊 Informes y Analítica

### Flujo de Datos Backend

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant API as /api/analytics/summary
    participant DB as PostgreSQL
    
    U->>F: Selecciona pestaña "Informes y Analítica"
    F->>F: Cargar filtros desde localStorage
    F->>API: GET /api/analytics/summary?params
    Note over F,API: Params: dateFilter, dateField,<br/>startDate, endDate, stages,<br/>machines, priority
    
    API->>DB: Query agregada SQL
    Note over API,DB: SELECT COUNT, SUM, AVG<br/>GROUP BY machine/stage/vendor/client<br/>+ Time series data
    
    DB-->>API: Resultados agregados
    API-->>F: JSON con 6 secciones de datos
    
    F->>F: Renderizar componentes:<br/>- 8 KPI Cards<br/>- 2 Gráficos<br/>- 1 Tabla Rankings
    F-->>U: Mostrar visualizaciones
```

---

### 📈 KPI Cards (8 Tarjetas)

```mermaid
flowchart LR
    subgraph KPIs["8 TARJETAS KPI"]
        K1[1. Total Pedidos]
        K2[2. Metros Producidos]
        K3[3. Metros Promedio]
        K4[4. Horas Totales]
        K5[5. Tiempo Promedio]
        K6[6. Tasa Completados]
        K7[7. Pedidos Urgentes]
        K8[8. Pedidos Atrasados]
    end
    
    subgraph Source["📊 FUENTE: Backend SQL"]
        SQL[Query agregada<br/>COUNT, SUM, AVG]
    end
    
    SQL --> KPIs
    
    style K1 fill:#e3f2fd
    style K2 fill:#e8f5e9
    style K3 fill:#fff9c4
    style K4 fill:#f3e5f5
    style K5 fill:#e1bee7
    style K6 fill:#c8e6c9
    style K7 fill:#ffe0b2
    style K8 fill:#ffcdd2
```

#### Detalle de Cada KPI:

##### 1️⃣ Total Pedidos
```sql
-- Cálculo en Backend
SELECT COUNT(*) as total_pedidos
FROM pedidos
WHERE [filtros aplicados]
```
**Explicación Simple:**  
Cuenta cuántos pedidos cumplen con los filtros seleccionados (fechas, etapas, máquinas, etc.)

**Subtitle:** `X completados` (del total)

---

##### 2️⃣ Metros Producidos
```sql
-- Cálculo en Backend
SELECT SUM(metros) as metros_totales
FROM pedidos
WHERE [filtros aplicados]
```
**Explicación Simple:**  
Suma todos los metros del campo `metros` de los pedidos filtrados.

**Formato:** Número con separador de miles (ej: 125,450)

---

##### 3️⃣ Metros Promedio
```sql
-- Cálculo en Backend
SELECT AVG(metros) as metros_promedio
FROM pedidos
WHERE [filtros aplicados]
```
**Fórmula Equivalente:**  
```
Metros Promedio = Metros Totales ÷ Total Pedidos
```

**Explicación Simple:**  
Cuántos metros produce cada pedido en promedio.

**Ejemplo:**
```
Total: 100 pedidos
Metros Totales: 50,000 m
→ Metros Promedio = 50,000 / 100 = 500 m por pedido
```

---

##### 4️⃣ Horas Totales
```sql
-- Cálculo en Backend
SELECT SUM(
    COALESCE(
        tiempo_produccion_decimal,
        -- Convertir HH:MM a decimal si no hay decimal
        EXTRACT(HOUR FROM tiempo_produccion_planificado::time) + 
        EXTRACT(MINUTE FROM tiempo_produccion_planificado::time) / 60.0
    )
) as tiempo_total_horas
FROM pedidos
WHERE [filtros aplicados]
```

**Explicación Simple:**  
1. Intenta sumar `tiempoProduccionDecimal`
2. Si no existe, convierte `tiempoProduccionPlanificado` (formato HH:MM) a horas decimales
3. Suma todo

**Formato:** HH:MM (ej: 245:30 = 245 horas y 30 minutos)

---

##### 5️⃣ Tiempo Promedio
```sql
-- Cálculo en Backend
SELECT AVG(tiempo_total_horas) as tiempo_promedio_horas
```

**Fórmula Equivalente:**
```
Tiempo Promedio = Horas Totales ÷ Total Pedidos
```

**Explicación Simple:**  
Cuánto tiempo de producción requiere cada pedido en promedio.

**Formato:** HH:MM

---

##### 6️⃣ Tasa Completados
```sql
-- Cálculo en Backend
SELECT 
    COUNT(*) FILTER (WHERE etapa_actual = 'COMPLETADO') as completados,
    COUNT(*) as total
FROM pedidos
WHERE [filtros aplicados]
```

**Fórmula Frontend:**
```javascript
porcentaje = (pedidos_completados / total_pedidos) × 100
```

**Explicación Simple:**  
Qué porcentaje de pedidos ya están terminados.

**Ejemplo:**
```
Total: 150 pedidos
Completados: 120 pedidos
→ Tasa = (120 / 150) × 100 = 80%
```

**Subtitle:** `120/150` (fracción)

---

##### 7️⃣ Pedidos Urgentes
```sql
-- Cálculo en Backend
SELECT COUNT(*) as pedidos_urgentes
FROM pedidos
WHERE prioridad IN ('URGENTE', 'ALTA')
AND [otros filtros]
```

**Explicación Simple:**  
Cuenta pedidos marcados como `prioridad = 'URGENTE'` o `prioridad = 'ALTA'`.

---

##### 8️⃣ Pedidos Atrasados
```sql
-- Cálculo en Backend
SELECT COUNT(*) as pedidos_atrasados
FROM pedidos
WHERE (nueva_fecha_entrega < CURRENT_DATE OR fecha_entrega < CURRENT_DATE)
AND etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO')
AND [otros filtros]
```

**Explicación Simple:**  
Cuenta pedidos cuya fecha de entrega ya pasó pero aún NO están completados ni archivados.

**Condiciones:**
1. Fecha de entrega < Hoy
2. Y etapa ≠ COMPLETADO
3. Y etapa ≠ ARCHIVADO

---

### 📊 Gráfico: Tendencias de Producción

```mermaid
flowchart TB
    subgraph Query["📊 CONSULTA SQL"]
        TimeGroup[Agrupar pedidos por fecha<br/>según dateField seleccionado]
        TimeGroup --> Aggregate[Por cada fecha:<br/>- COUNT pedidos<br/>- SUM metros<br/>- SUM horas]
    end
    
    subgraph Chart["📈 GRÁFICO DE LÍNEAS"]
        XAxis[Eje X: Fechas]
        YAxis[Eje Y: Valores]
        Line1[Línea 1: Total Pedidos<br/>Color: Azul]
        Line2[Línea 2: Metros Totales<br/>Color: Verde]
        Line3[Línea 3: Horas Totales<br/>Color: Morado]
        
        XAxis --> Lines
        YAxis --> Lines
        Lines[Renderizar 3 líneas]
        Lines --> Line1
        Lines --> Line2
        Lines --> Line3
    end
    
    subgraph Data["📦 ESTRUCTURA DE DATOS"]
        DataPoint[Por cada punto:<br/>- fecha: '2026-02-05'<br/>- total_pedidos: 12<br/>- metros_totales: 5600<br/>- tiempo_total_horas: 85]
    end
    
    Aggregate --> DataPoint
    DataPoint --> Chart
    
    style Query fill:#e3f2fd
    style Chart fill:#f3e5f5
    style Data fill:#fff9c4
```

**Ejemplo de Serie Temporal:**

| Fecha | Total Pedidos | Metros | Horas |
|-------|--------------|--------|-------|
| 2026-02-01 | 8 | 3,200 | 58.5 |
| 2026-02-02 | 12 | 5,600 | 85.0 |
| 2026-02-03 | 6 | 2,100 | 42.3 |
| 2026-02-04 | 15 | 7,200 | 102.8 |
| 2026-02-05 | 10 | 4,500 | 73.2 |

---

### 🖨️ Gráfico: Rendimiento por Máquina

```mermaid
flowchart LR
    subgraph Query["📊 CONSULTA SQL"]
        MachineGroup[Agrupar pedidos<br/>por maquinaImpresion]
        MachineGroup --> MachineAgg[Por cada máquina:<br/>- COUNT pedidos<br/>- SUM metros<br/>- SUM horas]
    end
    
    subgraph Chart["📊 GRÁFICO DE BARRAS"]
        Bars[Barras Horizontales]
        Bar1[WM1: XX pedidos]
        Bar2[WM3: YY pedidos]
        Bar3[GIAVE: ZZ pedidos]
        
        Bars --> Bar1
        Bars --> Bar2
        Bars --> Bar3
    end
    
    subgraph Sorting["📋 ORDENAMIENTO"]
        Sort[Ordenar de mayor a menor<br/>por total_pedidos]
    end
    
    MachineAgg --> Sorting
    Sorting --> Chart
    
    style Query fill:#e8f5e9
    style Chart fill:#fff3e0
    style Sorting fill:#f3e5f5
```

**Estructura de Datos:**

```typescript
[
  {
    maquina_impresion: "Windmöller 1",
    total_pedidos: 45,
    metros_totales: 22500,
    tiempo_total_horas: 320.5
  },
  {
    maquina_impresion: "Windmöller 3",
    total_pedidos: 38,
    metros_totales: 19000,
    tiempo_total_horas: 280.8
  },
  {
    maquina_impresion: "GIAVE",
    total_pedidos: 22,
    metros_totales: 8800,
    tiempo_total_horas: 145.2
  }
]
```

---

### 🏆 Tabla de Rankings

```mermaid
flowchart TB
    subgraph Sections["📊 3 SECCIONES DE RANKINGS"]
        S1[Top Vendedores]
        S2[Top Clientes]
        S3[Distribución por Etapas]
    end
    
    subgraph S1Details["👤 TOP VENDEDORES"]
        V1[Agrupar por vendedorNombre]
        V1 --> V2[Contar pedidos, sumar metros y horas]
        V2 --> V3[Ordenar por total_pedidos DESC]
        V3 --> V4[Mostrar top 10]
    end
    
    subgraph S2Details["🏢 TOP CLIENTES"]
        C1[Agrupar por cliente]
        C1 --> C2[Contar pedidos, sumar metros y horas]
        C2 --> C3[Ordenar por total_pedidos DESC]
        C3 --> C4[Mostrar top 10]
    end
    
    subgraph S3Details["📋 POR ETAPAS"]
        E1[Agrupar por etapaActual]
        E1 --> E2[Contar pedidos, sumar metros y horas]
        E2 --> E3[Mostrar todas las etapas]
    end
    
    Sections --> S1Details
    Sections --> S2Details
    Sections --> S3Details
    
    style S1 fill:#e3f2fd
    style S2 fill:#e8f5e9
    style S3 fill:#fff3e0
```

**Columnas en cada ranking:**

| Columna | Vendedores | Clientes | Etapas |
|---------|-----------|----------|--------|
| **Nombre** | Nombre del vendedor | Nombre del cliente | Nombre de la etapa |
| **Pedidos** | Total pedidos | Total pedidos | Total pedidos |
| **Metros** | Metros totales | Metros totales | Metros totales |
| **Horas** | Horas totales (HH:MM) | Horas totales (HH:MM) | Horas totales (HH:MM) |
| **% del Total** | % respecto a total filtrado | % respecto a total filtrado | % respecto a total filtrado |

**Ejemplo de Cálculo de Porcentaje:**

```javascript
// Backend calcula totales globales primero
total_global_pedidos = 200

// Por cada vendedor
vendedor_pedidos = 45
porcentaje = (45 / 200) × 100 = 22.5%
```

---

## 🔍 Filtros y Configuración

### Persistencia en LocalStorage

```mermaid
flowchart LR
    subgraph Planning["🗓️ CENTRO DE PLANIFICACIÓN"]
        P1[planning_date_filter]
        P2[planning_date_field]
        P3[planning_selected_stages]
        P4[planning_selected_machines]
        P5[planning_custom_date_range]
    end
    
    subgraph Analytics["📊 INFORMES Y ANALÍTICA"]
        A1[analytics_date_filter]
        A2[analytics_date_field]
        A3[analytics_selected_stages]
        A4[analytics_selected_machines]
        A5[analytics_custom_date_range]
        A6[analytics_priority_filter]
    end
    
    Storage[(LocalStorage)] --> Planning
    Storage --> Analytics
    
    style Planning fill:#e3f2fd
    style Analytics fill:#f3e5f5
    style Storage fill:#fff9c4
```

**Nota:** Cada pestaña tiene sus propios filtros independientes que se guardan y cargan automáticamente.

---

### Filtro de Fechas

```mermaid
flowchart TD
    Start[Seleccionar Filtro de Fecha] --> Options{Opciones}
    
    Options -->|Hoy| Today[Fecha = Hoy]
    Options -->|Ayer| Yesterday[Fecha = Ayer]
    Options -->|Esta Semana| ThisWeek[Lunes a Domingo actuales]
    Options -->|Semana Pasada| LastWeek[Lunes a Domingo anteriores]
    Options -->|Próxima Semana| NextWeek[Lunes a Domingo siguientes]
    Options -->|Este Mes| ThisMonth[Día 1 a último día del mes actual]
    Options -->|Mes Pasado| LastMonth[Día 1 a último día del mes anterior]
    Options -->|Próximo Mes| NextMonth[Día 1 a último día del mes siguiente]
    Options -->|Últimos 30 días| Last30[Hoy - 30 días hasta Hoy]
    Options -->|Rango Personalizado| Custom[Usuario ingresa Start y End]
    Options -->|Todos| All[Sin filtro de fecha]
    
    Today --> Apply
    Yesterday --> Apply
    ThisWeek --> Apply
    LastWeek --> Apply
    NextWeek --> Apply
    ThisMonth --> Apply
    LastMonth --> Apply
    NextMonth --> Apply
    Last30 --> Apply
    Custom --> Apply
    All --> Apply
    
    Apply[Aplicar filtro a pedidos]
    
    style Custom fill:#ffe0b2
    style All fill:#c8e6c9
```

**Campo de Fecha:**
- Usuario puede elegir qué campo usar: `nuevaFechaEntrega`, `fechaEntrega`, `fechaCreacion`
- Este campo se usa para comparar contra el rango seleccionado

---

### Filtros Avanzados (Solo Analítica)

```mermaid
flowchart LR
    subgraph Filters["🔧 FILTROS DISPONIBLES"]
        F1[Prioridad<br/>URGENTE, ALTA, NORMAL, BAJA]
        F2[Máquinas<br/>WM1, WM3, GIAVE]
        F3[Etapas<br/>Todas excepto ARCHIVADO]
    end
    
    subgraph Logic["🔗 LÓGICA DE COMBINACIÓN"]
        AND[Operador AND<br/>entre todos los filtros]
    end
    
    Filters --> Logic
    Logic --> Result[Solo pedidos que cumplen<br/>TODOS los filtros activos]
    
    style Filters fill:#e3f2fd
    style Logic fill:#fff9c4
    style Result fill:#c8e6c9
```

---

## 📖 Glosario de Términos

### Términos Técnicos

| Término | Definición | Ejemplo |
|---------|-----------|---------|
| **Enriquecimiento** | Proceso de actualizar datos de pedidos con información actualizada de otras tablas (clientes, vendedores) | Pedido tiene `clienteId="abc123"`, se busca el nombre actual en tabla clientes |
| **Agregación** | Combinar múltiples valores en uno solo (suma, promedio, conteo) | SUM(metros) agrupa todos los metros en un solo total |
| **Serie Temporal** | Datos organizados por fecha/tiempo | Lista de pedidos por día: 2026-02-01: 12, 2026-02-02: 15 |
| **KPI** | Key Performance Indicator - Métrica clave de rendimiento | "Total Pedidos", "Tasa Completados" |
| **Tooltip** | Texto explicativo que aparece al pasar el mouse | ℹ️ icono muestra información adicional |

---

### Términos de Negocio

| Término | Definición | Importancia |
|---------|-----------|-------------|
| **DNT** | Categoría de pedidos prioritarios (cliente o vendedor contiene "DNT") | Máxima prioridad - SIEMPRE va a esta categoría |
| **VARIABLES** | Pedidos con clichés nuevos o cambios sin confirmar | No se pueden planificar aún - tiempo incierto |
| **Capacidad Libre** | Horas disponibles después de asignar trabajo a máquinas principales | Indicador crítico de sobrecarga |
| **Tiempo Planificado** | Estimación en formato HH:MM de duración de producción | Usado para planificación semanal |
| **Tiempo Decimal** | Horas en formato decimal (ej: 8.5 horas = 8h 30min) | Alternativa al formato HH:MM |

---

### Estados de Cliché

| Estado | Significado | Impacto en Clasificación |
|--------|------------|-------------------------|
| **NUEVO** | Cliché debe crearse desde cero | Puede llevar a categoría VARIABLES |
| **REPETICIÓN** | Usar cliché existente sin cambios | NO afecta clasificación |
| **REPETICIÓN CON CAMBIO** | Modificar cliché existente | Puede llevar a categoría VARIABLES |

**Condiciones para VARIABLES:**
```
Si (estado = NUEVO O REPETICIÓN CON CAMBIO)
Y NO horasConfirmadas
Y NO compraCliche
Y NO clicheDisponible
→ Categoría VARIABLES
```

---

## 🔄 Sincronización en Tiempo Real

### WebSocket Events

```mermaid
sequenceDiagram
    participant O as Otro Usuario
    participant S as Servidor
    participant W as WebSocket
    participant C as Cliente Actual
    
    O->>S: Actualiza pedido/cliente/vendedor
    S->>S: Procesa cambio en BD
    S->>W: Emite evento (pedido-updated, etc.)
    W->>C: Notificación de cambio
    
    alt Centro de Planificación
        C->>C: Actualiza pedidos enriquecidos
        C->>C: Recalcula tablas y gráficos
    else Informes y Analítica
        C->>C: Programa refetch (debounce 800ms)
        C->>S: GET /api/analytics/summary
        S-->>C: Datos actualizados
    end
    
    C->>C: Renderiza visualizaciones
```

**Events Monitoreados:**
- `pedido-created`
- `pedido-updated`
- `pedido-deleted`
- `pedidos-by-vendedor-updated`
- `pedidos-by-cliente-updated`
- `vendedor-updated` (legacy)
- `vendedor-deleted` (legacy)

---

## 💾 Exportación de Datos

### Formatos Disponibles (Solo Analítica)

```mermaid
flowchart TB
    Start[Usuario solicita exportación] --> Menu{Seleccionar formato}
    
    Menu -->|Excel Completo| Excel[Genera .xlsx con<br/>6 hojas separadas]
    Menu -->|CSV Completo| CSV1[Un archivo con<br/>todos los datos]
    Menu -->|CSV Máquinas| CSV2[Solo datos de máquinas]
    Menu -->|CSV Vendedores| CSV3[Solo top vendedores]
    Menu -->|CSV Clientes| CSV4[Solo top clientes]
    Menu -->|CSV Etapas| CSV5[Solo por etapas]
    Menu -->|CSV Tendencias| CSV6[Serie temporal]
    
    Excel --> Download[Descarga automática]
    CSV1 --> Download
    CSV2 --> Download
    CSV3 --> Download
    CSV4 --> Download
    CSV5 --> Download
    CSV6 --> Download
    
    style Excel fill:#e8f5e9
    style CSV1 fill:#e3f2fd
    style CSV2 fill:#e3f2fd
    style CSV3 fill:#e3f2fd
    style CSV4 fill:#e3f2fd
    style CSV5 fill:#e3f2fd
    style CSV6 fill:#e3f2fd
```

**Estructura Excel:**

| Hoja | Contenido |
|------|-----------|
| **Resumen** | Los 8 KPIs principales |
| **Por Máquina** | Métricas agrupadas por máquina |
| **Por Etapa** | Métricas agrupadas por etapa |
| **Top Vendedores** | Ranking de vendedores (top 10) |
| **Top Clientes** | Ranking de clientes (top 10) |
| **Tendencias** | Serie temporal día a día |

---

## 🎯 Casos de Uso Prácticos

### Caso 1: Detectar Sobrecarga Semanal

**Objetivo:** Identificar semanas con capacidad negativa

**Pasos:**
1. Ir a "Centro de Planificación"
2. Seleccionar filtro de fecha: "Próximo Mes"
3. Revisar columna "LIBRES" en Tabla Semanal
4. ✅ Verde = Capacidad positiva
5. ❌ Rojo = SOBRECARGA

**Interpretación:**
```
Semana 10: LIBRES = -15 horas
→ WM1 + WM3 + DNT exceden 190 horas
→ Acción: Redistribuir pedidos o ajustar fechas
```

---

### Caso 2: Analizar Rendimiento de Vendedor

**Objetivo:** Ver cuántos pedidos y metros genera un vendedor

**Pasos:**
1. Ir a "Informes y Analítica"
2. Seleccionar filtro de fecha: "Este Mes"
3. Scrollear a "Top Vendedores"
4. Buscar nombre del vendedor
5. Ver métricas:
   - Total pedidos
   - Metros producidos
   - Horas consumidas
   - % del total

---

### Caso 3: Revisar Pedidos de una Categoría

**Objetivo:** Ver lista detallada de pedidos DNT de una semana

**Pasos:**
1. Ir a "Centro de Planificación"
2. En gráfico de barras, hacer clic en sección "DNT" de Semana X
3. Se abre tabla de detalle automáticamente
4. Ver todos los pedidos DNT:
   - Número de pedido
   - Cliente
   - Fecha de entrega
   - Metros
   - Tiempo estimado
5. Hacer clic en fila para ver detalles completos

---

### Caso 4: Identificar Pedidos Atrasados

**Objetivo:** Encontrar pedidos que debieron entregarse pero siguen en proceso

**Pasos:**
1. Ir a "Informes y Analítica"
2. Observar KPI "Pedidos Atrasados"
3. Número en rojo indica cantidad
4. Para ver cuáles son:
   - Ir a vista principal de pedidos
   - Filtrar por fecha de entrega < Hoy
   - Excluir etapas: COMPLETADO, ARCHIVADO

---

## 🔧 Modificación y Mejora

### Para Cambiar la Capacidad Base

**Archivo:** `components/ReportView.tsx`

**Línea 78:**
```javascript
const CAPACITY_BASE = 190; // ← CAMBIAR ESTE NÚMERO
```

**Impacto:**
- Afecta cálculo de "LIBRES"
- Nueva fórmula: `LIBRES = [NUEVO_VALOR] - WH1 - WH3 - DNT`

---

### Para Agregar una Nueva Categoría

**Pasos:**

1. **Agregar constante:**
```javascript
const MACHINE_NUEVA = 'NUEVA_CATEGORIA';
```

2. **Agregar a opciones:**
```javascript
const allMachineOptions = [
  'Windmöller 1', 
  'Windmöller 3', 
  'GIAVE', 
  'DNT', 
  'VARIABLES',
  'NUEVA_CATEGORIA' // ← Agregar aquí
];
```

3. **Definir lógica de clasificación** (líneas 420-480):
```javascript
// Agregar nueva condición
else if (/* condición para nueva categoría */) {
    machineCategory = MACHINE_NUEVA;
}
```

4. **Agregar color** en `PlanningTable.tsx` y `PlanningChart.tsx`:
```javascript
const MACHINE_COLORS: Record<string, string> = {
  // ... existentes ...
  'NUEVA_CATEGORIA': 'bg-teal-900 text-white border-teal-950'
};
```

5. **Decidir si resta capacidad:**
```javascript
// Si NO debe restar capacidad, NO agregar a fórmula
// Si SÍ debe restar, agregar a:
group.freeCapacity = CAPACITY_BASE - wh1 - wh3 - dnt - nueva;
```

---

### Para Cambiar KPIs en Analítica

**Archivo:** `components/analytics/KPICards.tsx`

**Modificar array `cards`** (líneas 41-138):

```typescript
const cards: KPICardData[] = [
  {
    title: 'Nombre del KPI',
    value: summary.campo_del_backend, // ← Fuente de datos
    subtitle: 'descripción',
    tooltip: 'Cómo se calcula este KPI',
    icon: (/* SVG icon */),
    colorClass: 'from-color-500 to-color-600'
  },
  // ... más KPIs
];
```

**Backend correspondiente:**  
Modificar `backend/routes/analytics.js` para incluir nuevos cálculos SQL.

---

## ❓ Preguntas Frecuentes

### ¿Por qué GIAVE no resta capacidad?

**R:** GIAVE es una máquina suplementaria que trabaja en paralelo. No compite por el mismo tiempo productivo que WM1 y WM3, por lo que no reduce la capacidad disponible de las máquinas principales.

---

### ¿Qué pasa si un pedido tiene máquina asignada pero cumple condiciones VARIABLES?

**R:** La lógica de PRIORIDAD 4 tiene precedencia. Aunque tenga máquina asignada, si cumple TODAS las condiciones de VARIABLES (cliché nuevo/cambiado + sin confirmar horas/compra/disponibilidad), va a VARIABLES.

**Ejemplo:**
```
Pedido #123
- Máquina: WM1
- Estado cliché: NUEVO
- horasConfirmadas: false
- compraCliche: null
- clicheDisponible: false
→ Categoría: VARIABLES (NO WM1)
```

---

### ¿Cómo se calcula el número de semana?

**R:** Usa estándar ISO 8601:
- Semana empieza en Lunes
- Semana 1 = primera semana con al menos 4 días del año nuevo
- Semana 52 o 53 = última del año

**Función:** `getWeekNumber()` en `utils/weekUtils.ts`

---

### ¿Los filtros de Planning y Analytics son independientes?

**R:** SÍ. Cada pestaña guarda sus propios filtros en localStorage con prefijos diferentes (`planning_*` vs `analytics_*`). Esto permite tener configuraciones diferentes según el uso.

---

### ¿Qué pasa si cambio el campo de fecha?

**R:** El sistema re-agrupa automáticamente todos los pedidos usando el nuevo campo. Por ejemplo:
- Campo anterior: `fechaEntrega`
- Campo nuevo: `nuevaFechaEntrega`
→ Las semanas pueden cambiar completamente si las fechas son diferentes

---

## 📚 Referencias de Código

### Archivos Principales

| Archivo | Responsabilidad |
|---------|----------------|
| `components/ReportView.tsx` | Componente principal - Pestañas y lógica de planificación |
| `components/AnalyticsDashboard.tsx` | Dashboard de analítica - Filtros y layout |
| `components/PlanningTable.tsx` | Tabla semanal de planificación |
| `components/PlanningChart.tsx` | Gráfico de barras apiladas |
| `components/analytics/KPICards.tsx` | 8 tarjetas de KPIs |
| `hooks/useAnalyticsData.ts` | Hook para fetch de datos de analítica |
| `utils/weekUtils.ts` | Funciones de cálculo de semanas |
| `utils/date.ts` | Funciones de formato de fechas y tiempo |
| `backend/routes/analytics.js` | API endpoint de analítica (backend) |

---

## 🎓 Conclusión

Este documento proporciona una visión completa y detallada de cómo funcionan los reportes del sistema. Está diseñado para ser comprensible tanto para personas técnicas (desarrolladores) como no técnicas (gerentes, analistas de negocio).

**Para desarrolladores:**  
Utiliza este documento como referencia antes de modificar lógica de cálculos.

**Para gerencia:**  
Utiliza los diagramas y explicaciones para entender qué significan los números y tomar decisiones informadas.

**Mantenimiento:**  
Actualizar este documento cada vez que se modifique la lógica de cálculo de métricas.

---

**📅 Fecha de Creación:** 6 de Febrero de 2026  
**✍️ Versión:** 1.0  
**🔄 Última Actualización:** 6 de Febrero de 2026
