# Proposal: Fix Double-Click Sequence Completion

## Intent

Pedidos in a single-stage post-impresión sequence require two clicks of "Seguir secuencia" to reach COMPLETADO instead of one. The `enteringPostImpresion` guard sets `secuenciaPositionIndex` to the index of the entering stage rather than the NEXT unconsumed position, causing one extra same-stage-repetition cycle.

## Scope

### In Scope
- Fix `hooks/usePedidosManager.ts` line 928: `foundIndex` → `foundIndex + 1`
- Update `utils/etapaLogic.test.ts`: adjust expected index values in antivaho-entry, cancel-antivaho, and manual-entry contract tests
- Add test for single-stage sequence completion on first click

### Out of Scope
- Changes to `calcularSiguienteEtapa` or `findNextOccurrenceIndex` (logic is correct)
- Changes to printing-entry flow (index handled by Step 6b in App.tsx)
- UI changes

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None (bug fix — behavior was always intended to complete on first click).

## Approach

One-line fix in the `enteringPostImpresion` guard:

```diff
- updatedPedido.secuenciaPositionIndex = foundIndex >= 0 ? foundIndex : 0;
+ updatedPedido.secuenciaPositionIndex = foundIndex >= 0 ? foundIndex + 1 : 0;
```

When a pedido enters a post-impresión stage, the entering occurrence is already consumed. The index must point to the next unconsumed position so that `calcularSiguienteEtapa` correctly evaluates completion or returns the next stage on the first click.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `hooks/usePedidosManager.ts` | Modified (1 line) | `enteringPostImpresion` guard index computation |
| `utils/etapaLogic.test.ts` | Modified (~8 assertions) | Contract tests: antivaho-entry, cancel-antivaho, manual-entry expected indices |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cancel-antivaho flow skips the first post-impresión stage | Low | `+1` correctly consumes the entry; pedido reaches SL2/S2DT in correct order. Existing antivaho contract tests assert the new index values. |
| Repeated-stage sequences ([SL2, SL2, S2DT]) break same-stage repetition | Low | `foundIndex` still uses `indexOf` (first occurrence). `+1` skips consumed first occurrence; remaining repetitions consumed normally. |
| Printing entry regresses | None | Printing-entry guard does NOT execute `enteringPostImpresion`; index set by toImpresion flow. |

## Rollback Plan

Revert line 928 to `foundIndex >= 0 ? foundIndex : 0`. No database or API changes.

## Dependencies

- None.

## Success Criteria

- [ ] Single-stage sequence pedido reaches COMPLETADO on first "Seguir secuencia" click
- [ ] Multi-stage sequences still advance stage-by-stage without skipping
- [ ] Cancel-antivaho entry correctly positions pedido at the next unconsumed stage
- [ ] All existing tests pass after updating expected index values
- [ ] New test covers single-stage `[POST_ECCONVERT_22]` completing on first click
