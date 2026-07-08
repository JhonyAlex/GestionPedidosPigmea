# Delta for Pedidos — Post-Impresión Sequence Index

## Purpose

Document the intended behavior of `secuenciaPositionIndex` initialization when a pedido enters a post-impresión stage. The `enteringPostImpresion` guard SHALL set the index past the consumed entry occurrence so the first "Seguir secuencia" click evaluates the next unconsumed position.

## ADDED Requirements

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
