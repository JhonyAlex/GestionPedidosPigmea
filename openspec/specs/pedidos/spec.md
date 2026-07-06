# Pedidos — Campo Semana

## Overview

Pedidos include an optional `semana` field that records the production week. The field auto-derives from `nuevaFechaEntrega` on first save when untouched, then stays independent. The "Carga Semanal por Máquina (Horas)" chart uses this field for week grouping with date-derived fallback for legacy pedidos.

## Requirements

### R1: Semana select field

The system MUST render a "Semana" `<select>` in AddPedidoModal and PedidoModal. It MUST start empty. Options MUST list all weeks of the current year as `"Sem X - YYYY"`.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R1 | Field empty by default | User opens AddPedidoModal | Form renders | Semana dropdown shows no pre-selected value; options list "Sem 1 - {year}" through "Sem 52 - {year}" |
| R1 | Current year only | Year is 2026 | User opens dropdown | All options are "Sem X - 2026"; no other years appear |

### R2: Auto-derive on first save

The system MUST derive `semana` from `nuevaFechaEntrega` on first save when user never changed the field. If `nuevaFechaEntrega` is empty, `semana` MUST stay empty.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R2 | Auto-derives | NuevaFechaEntrega = "2026-06-10", Semana left empty | User saves new pedido | pedido.semana = "Sem 24 - 2026" |
| R2 | No fecha, no semana | NuevaFechaEntrega empty, Semana untouched | User saves | pedido.semana remains undefined |
| R2 | Manual overrides auto | User selects "Sem 15 - 2026" in dropdown | User saves | pedido.semana = "Sem 15 - 2026"; fechaEntrega has no effect |

### R3: Post-save independence

Once saved with a non-empty value, the system MUST NOT recalculate `semana` on subsequent `nuevaFechaEntrega` changes. User MAY manually change it at any time.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R3 | Fecha change no effect | Pedido has semana = "Sem 24 - 2026" | User changes fechaEntrega, saves in modal | semana stays "Sem 24 - 2026" |
| R3 | Manual change post-save | Pedido has semana = "Sem 24 - 2026" | User changes to "Sem 30 - 2026" in PedidoModal, saves | pedido.semana = "Sem 30 - 2026" |

### R4: PedidoCard clearing

When `nuevaFechaEntrega` is edited inline in PedidoCard, the system MUST clear `semana` to undefined so the next modal save re-derives it.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R4 | Inline clear | Pedido has semana = "Sem 24 - 2026" | User edits fechaEntrega inline in PedidoCard | pedido.semana cleared to undefined |

### R5: Chart week grouping

The "Carga Semanal por Máquina (Horas)" chart MUST group hours by `p.semana ?? getWeekNumber(p.nuevaFechaEntrega)`. Legacy pedidos without `semana` MUST fall back to date-derived week. Chart labels MUST use the semana format.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R5 | Explicit semana | Pedido has semana = "Sem 10 - 2026", fechaEntrega in week 25 | Chart calculates load | Hours go to week 10, NOT week 25 |
| R5 | Legacy fallback | Pedido has no semana, fechaEntrega = "2026-06-15" | Chart calculates load | Hours go to week 25 (date-derived) |
| R5 | Mixed data | A=Sem 10, B=no semana (fecha→wk10), C=Sem 11 | Chart processes all three | A+B contribute to week 10 bar; C to week 11 bar |
| R5 | Label format | Pedidos grouped under "Sem 10 - 2026" | Chart renders week label | Label uses semana value format |
