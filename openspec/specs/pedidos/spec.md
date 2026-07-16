# Pedidos

## Overview

Pedidos include an optional `semana` field that records the production week. The field auto-derives from `nuevaFechaEntrega` on every save when the user has never manually selected a semana (`semanaManual: false`). Once the user manually selects a semana in the dropdown, auto-derivation stops (`semanaManual: true`) and the user controls the value. A "🔄 Auto" / "📌 Manual" indicator shows the current mode. The user may switch back to auto mode at any time. The "Carga Semanal por Máquina (Horas)" chart uses this field for week grouping with date-derived fallback for legacy pedidos.

## Requirements

### R1: Semana select field

The system MUST render a "Semana" `<select>` in AddPedidoModal and PedidoModal. It MUST start empty. Options MUST list all weeks of the current year as `"Sem X - YYYY"`.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R1 | Field empty by default | User opens AddPedidoModal | Form renders | Semana dropdown shows no pre-selected value; options list "Sem 1 - {year}" through "Sem 52 - {year}" |
| R1 | Current year only | Year is 2026 | User opens dropdown | All options are "Sem X - 2026"; no other years appear |

### R2: Auto-derive when semanaManual is false

The system MUST derive `semana` from `nuevaFechaEntrega` on every save when `semanaManual` is false or undefined. If `nuevaFechaEntrega` is empty, `semana` MUST stay empty. The system MUST set `semanaManual: false` on the saved pedido.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R2 | Auto-derives on create | NuevaFechaEntrega = "2026-06-10", Semana untouched | User saves new pedido | pedido.semana = "Sem 24 - 2026", pedido.semanaManual = false |
| R2 | Auto-derives on edit | Pedido has semanaManual=false, nuevaFechaEntrega changed to "2026-07-01" | User saves in modal | pedido.semana = "Sem 27 - 2026" (re-derived) |
| R2 | No fecha, no semana | NuevaFechaEntrega empty, Semana untouched | User saves | pedido.semana remains undefined |
| R2 | Manual overrides auto | User selects "Sem 15 - 2026" in dropdown | User saves | pedido.semana = "Sem 15 - 2026", pedido.semanaManual = true |

### R3: Manual mode independence

Once `semanaManual` is true (user manually selected a semana), the system MUST NOT recalculate `semana` on subsequent `nuevaFechaEntrega` changes. The system MUST render a "📌 Manual" indicator. The user MAY switch back to auto mode via a "🔄 Volver a automático" control, which sets `semanaManual: false` and clears `semana` so the next save re-derives it.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R3 | Fecha change no effect in manual | Pedido has semanaManual=true, semana="Sem 24 - 2026" | User changes fechaEntrega, saves in modal | semana stays "Sem 24 - 2026" |
| R3 | Manual change sets flag | Pedido has semanaManual=false | User selects "Sem 30 - 2026" in dropdown, saves | pedido.semana = "Sem 30 - 2026", pedido.semanaManual = true |
| R3 | Switch back to auto | Pedido has semanaManual=true | User clicks "🔄 Volver a automático", saves | pedido.semana re-derived from nuevaFechaEntrega, pedido.semanaManual = false |
| R3 | Visual indicator auto | Pedido has semanaManual=false | Modal renders | "🔄 Auto" badge shown next to Semana label |
| R3 | Visual indicator manual | Pedido has semanaManual=true | Modal renders | "📌 Manual" badge shown next to Semana label |

### R4: PedidoCard inline reset to auto

When `nuevaFechaEntrega` is edited inline in PedidoCard, the system MUST set `semanaManual: false` and clear `semana` to undefined so the next modal save re-derives it from the new date.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R4 | Inline resets to auto | Pedido has semanaManual=true, semana="Sem 24 - 2026" | User edits fechaEntrega inline in PedidoCard | pedido.semana cleared to undefined, pedido.semanaManual = false |
| R4 | Inline auto stays auto | Pedido has semanaManual=false | User edits fechaEntrega inline in PedidoCard | pedido.semana cleared to undefined, pedido.semanaManual = false (unchanged) |

### R5: Chart week grouping

The "Carga Semanal por Máquina (Horas)" chart MUST group hours by `p.semana ?? getWeekNumber(p.nuevaFechaEntrega)`. Legacy pedidos without `semana` MUST fall back to date-derived week. Chart labels MUST use the semana format.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R5 | Explicit semana | Pedido has semana = "Sem 10 - 2026", fechaEntrega in week 25 | Chart calculates load | Hours go to week 10, NOT week 25 |
| R5 | Legacy fallback | Pedido has no semana, fechaEntrega = "2026-06-15" | Chart calculates load | Hours go to week 25 (date-derived) |
| R5 | Mixed data | A=Sem 10, B=no semana (fecha→wk10), C=Sem 11 | Chart processes all three | A+B contribute to week 10 bar; C to week 11 bar |
| R5 | Label format | Pedidos grouped under "Sem 10 - 2026" | Chart renders week label | Label uses semana value format |

### R6: Single-Stage Sequence Completion

Pedidos with a single-stage post-impresión sequence MUST reach COMPLETADO on the first "Seguir secuencia" click after entering that stage. `secuenciaPositionIndex` SHALL be `foundIndex + 1`, which equals `secuencia.length`, causing `calcularSiguienteEtapa` to return completion immediately.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R6-S1 | Single-stage completes on first click | Pedido enters `POST_ECCONVERT_22`, secuencia=`[POST_ECCONVERT_22]` | User clicks "Seguir secuencia" once | Pedido reaches COMPLETADO |
| R6-S2 | Index past last position | Pedido with secuencia of length 1, entering occurrence at index 0 | enteringPostImpresion sets index | secuenciaPositionIndex = 1 (past last) |

### R7: Multi-Stage Sequence Progression

The system MUST advance pedidos through multi-stage sequences one stage per click, without skipping stages.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R7-M1 | Stage-by-stage advance | Pedido in `SL2`, secuencia=`[SL2, S2DT]`, index=1 | Click "Seguir secuencia" | Pedido moves to `S2DT`, index becomes 2 |
| R7-M2 | Completion after last stage | Pedido in final stage, index ≥ secuencia.length | Click "Seguir secuencia" | Pedido reaches COMPLETADO |

### R8: Cancel-Antivaho Entry Index

When antivaho is cancelled and pedido enters post-impresión directly, `secuenciaPositionIndex` MUST equal `foundIndex + 1`, pointing to the next unconsumed stage after the entry occurrence.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R8-C1 | Correct index after cancel | Pedido enters `SL2` from antivaho, secuencia=`[SL2, S2DT]` | enteringPostImpresion sets index | secuenciaPositionIndex = 1 |
| R8-C2 | First click after cancel advances | From R8-C1, pedido at SL2 with index=1 | Click "Seguir secuencia" | Pedido advances to S2DT |

### R9: Repeated-Stage Sequences

Sequences with repeated stages (e.g., `[SL2, SL2, S2DT]`) MUST consume each occurrence separately. `foundIndex` SHALL use `indexOf` (first occurrence), and the `+1` offset SHALL skip only the consumed entry occurrence.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R9-R1 | Entry skips consumed occurrence | Pedido enters first `SL2`, secuencia=`[SL2, SL2, S2DT]` | enteringPostImpresion runs | secuenciaPositionIndex = 1 (second occurrence) |
| R9-R2 | Second occurrence consumed | From R9-R1, pedido at SL2, index=1 | Click "Seguir secuencia" | Pedido stays at SL2, index=2 |
| R9-R3 | Final stage after repeats | From R9-R2, pedido with index=2 | Click "Seguir secuencia" | Pedido reaches S2DT |

### R10: Printing Entry Unaffected

Pedidos entering post-impresión from the printing flow MUST NOT execute `enteringPostImpresion`. Index SHALL be set by the toImpresion flow via a separate code path.

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| R10-P1 | Printing path isolation | Pedido enters post-impresión from toImpresion flow | enteringPostImpresion guard checks conditions | Guard does NOT execute; index set by Step 6b |
| R10-P2 | Printing entry works normally | Pedido enters post-impresión from printing | Click "Seguir secuencia" | Pedido advances through stages correctly |
