# Tasks: Campo Semana en Pedidos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~100-130 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation

- [x] 1.1 `types.ts` — Add `semana?: string` to `Pedido` interface after `nuevaFechaEntrega` (line 78)
- [x] 1.2 `utils/weekUtils.ts` — Add `getSemanaFromDate(date)` returning `"Sem X - YYYY"` via existing `getYearAndWeek`
- [x] 1.3 `utils/weekUtils.ts` — Add `parseSemanaLabel(label)` via regex `/^Sem\s+(\d{1,2})\s*-\s*(\d{4})$/i` returning `{week, year}` or `null`
- [x] 1.4 `utils/weekUtils.ts` — Add `getWeeksSelectOptions()` mapping `getWeeksOfYear(new Date().getFullYear())` to `{value, label}` in `"Sem X - YYYY"` format

**Verify**: `npx tsc --noEmit` passes. Run `npm test` for existing weekUtils tests.

## Phase 2: Modal Integration

- [x] 2.1 `components/AddPedidoModal.tsx` — Add `semana: ''` to `initialFormData` (line 68)
- [x] 2.2 `components/AddPedidoModal.tsx` — Add `<select>` for Semana in JSX, populated by `getWeeksSelectOptions()`, bound to `formData.semana`
- [x] 2.3 `components/AddPedidoModal.tsx` — In `createPedido()` (line 515), before `onAdd`: if `!formData.semana && formData.nuevaFechaEntrega`, derive via `getSemanaFromDate`
- [x] 2.4 `components/PedidoModal.tsx` — Add `<select>` for Semana in JSX, populated by `getWeeksSelectOptions()`, bound to form state
- [x] 2.5 `components/PedidoModal.tsx` — In `getValidatedPedidoForPersistence()` (line 1198), before `return` at line 1230: if `!formData.semana && formData.nuevaFechaEntrega`, derive via `getSemanaFromDate`

**Verify**: `npx tsc --noEmit`. Manually: open AddPedidoModal → Semana dropdown shows weeks, empty by default. Save with fecha → semana auto-populates. Open PedidoModal → saved semana shows.

## Phase 3: Chart & Card Wiring

- [x] 3.1 `components/PedidoCard.tsx` — In `handleSaveFecha()` (line 498), add `semana: undefined` to `updatedPedido` object (line 510) so next modal save re-derives
- [x] 3.2 `components/ReportView.tsx` — Replace lines 440-448 week derivation: `parseSemanaLabel(p.semana)` → use parsed `{week, year}`; fallback to `getWeekNumber(date)` for legacy pedidos without `semana`

**Verify**: `npx tsc --noEmit`. Manually: edit fecha in PedidoCard → open modal → semana empty, re-derives on save. Chart groups pedidos by explicit semana, legacy fallback works.

## Phase 4: Bulk Import

- [x] 4.1 `components/BulkImportModalV2.tsx` — Add `{ value: 'semana', label: '📅 Semana' }` to `AVAILABLE_FIELDS` after line 126 (`nuevaFechaEntrega` entry)

**Verify**: `npx tsc --noEmit`. Manually: open BulkImport → Semana appears in column mapping dropdown.
