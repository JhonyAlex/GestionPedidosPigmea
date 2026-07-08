# Tasks: Fix Double-Click Sequence Completion

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 30–40 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Fix + test updates + new test | PR 1 | Single self-contained unit |

## Phase 1: Bug Fix (Core)

- [x] 1.1 `hooks/usePedidosManager.ts` L928: change `foundIndex` to `foundIndex + 1` in the `enteringPostImpresion` guard ternary
  - Covers: R6, R7, R8, R9, R10

## Phase 2: Test Updates (Contract Alignment)

- [x] 2.1 `utils/etapaLogic.test.ts`: update "cancel-antivaho to first post-impresión" comment (L366–368) — entering guard now sets index to `foundIndex + 1` instead of `0`
- [x] 2.2 `utils/etapaLogic.test.ts`: update "manual entry to mid-sequence stage" comment (L469–472) — entering guard now sets index to `indexOf(newEtapa) + 1`
- [x] 2.3 `utils/etapaLogic.test.ts`: review ALL contract test comments referencing the entering guard's index value; adjust any others found from Phase 2.1–2.2 to match `foundIndex + 1` semantics
  - Covers: R8, R9

## Phase 3: New Test (R6 Coverage)

- [x] 3.1 `utils/etapaLogic.test.ts`: add test "single-stage sequence: entering guard sets index past last position" — verify `calcularSiguienteEtapa` with `index === secuencia.length` returns `Etapa.COMPLETADO` for single-element sequence `[POST_ECCONVERT_22]`
  - Covers: R6-S1, R6-S2

## Phase 4: Verification

- [x] 4.1 Run `npx vitest run utils/etapaLogic.test.ts` — all existing + new tests pass
- [x] 4.2 Run full test suite `npx vitest run` — zero regressions
  - Covers: All requirements (regression gate)

## Phase 5: Integration Sanity Check

- [x] 5.1 Verify `hooks/usePedidosManager.ts` around L928: confirm `enteringPostImpresion` guard is the ONLY code path setting `secuenciaPositionIndex` on post-impresión entry (printing path uses separate Step 6b in `handleAdvanceStage`)
  - Covers: R10 (printing isolation)
