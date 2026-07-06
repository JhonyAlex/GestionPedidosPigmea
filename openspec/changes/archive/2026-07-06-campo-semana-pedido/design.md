# Design: Campo Semana en Pedidos

## Technical Approach

Add an optional `semana?: string` field to the `Pedido` type. The field auto-derives from `nuevaFechaEntrega` on first save when untouched, then stays independent. Three new `weekUtils` helpers provide the derivation, parsing, and option generation. The `ReportView` chart groups by `p.semana` with date-derived fallback for legacy pedidos. No backend or DB changes — JSONB transparently stores the new optional key.

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | Auto-derive location | In each modal's save function (`createPedido` / `getValidatedPedidoForPersistence`) | Keeps logic co-located with form submission; avoids indirection. Both modals already spread `formData` into the persist call — one line check before that spread is minimal. |
| D2 | "Untouched" detection | `!formData.semana` (falsy check on empty string or undefined) | No extra tracking flag. Empty string = default/untouched, non-empty = user set it. Simpler than a `semanaTouched` boolean that would need syncing with the select's `onChange`. |
| D3 | PedidoCard inline behavior | Clear `semana` to `undefined` in `handleSaveFecha` | Next PedidoModal save will see empty semana → re-derives from the new date. Avoids stale week assignments when delivery dates shift inline. |
| D4 | ReportView fallback chain | `p.semana` → parse → if valid use parsed week/year; else derive from `p[dateField]` via existing `getWeekNumber` | Single code path. `parseSemanaLabel` returns `null` for invalid/legacy data, falling through to existing date logic with zero behavior change for old pedidos. |

## Data Flow

```
AddPedidoModal.createPedido()
  └─ if !semana && fecha → semana = getSemanaFromDate(fecha)
     └─ onAdd({ ...formData, ... })  ───→ DB (JSONB)

PedidoModal.persistCurrentPedido()
  └─ if !semana && fecha → semana = getSemanaFromDate(fecha)
     └─ persistFn(pedido)  ───→ DB (JSONB)

PedidoCard.handleSaveFecha()
  └─ updatedPedido = { ...pedido, nuevaFechaEntrega, semana: undefined }
     └─ onUpdatePedido()  ───→ DB (JSONB)

ReportView (useMemo)
  └─ For each pedido:
       if p.semana → parseSemanaLabel → week/year
       else → getWeekNumber(p[dateField]) → week/year
     └─ group into weeklyGroups[weekKey]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `types.ts` | Modify | Add `semana?: string` to `Pedido` interface (after `nuevaFechaEntrega`) |
| `utils/weekUtils.ts` | Modify | Add `getSemanaFromDate`, `parseSemanaLabel`, `getWeeksSelectOptions` |
| `components/AddPedidoModal.tsx` | Modify | Add `semana: ''` to `initialFormData`; `<select>` in JSX; auto-derive in `createPedido` before `onAdd` |
| `components/PedidoModal.tsx` | Modify | `<select>` in JSX; auto-derive in `getValidatedPedidoForPersistence` before return |
| `components/PedidoCard.tsx` | Modify | Add `semana: undefined` in `handleSaveFecha`'s `updatedPedido` |
| `components/ReportView.tsx` | Modify | Replace lines 442-448 week derivation with `p.semana ?? date` fallback chain |
| `components/BulkImportModalV2.tsx` | Modify | Add `{ value: 'semana', label: '📅 Semana' }` to `AVAILABLE_FIELDS` |

## Interfaces / Contracts

```typescript
// utils/weekUtils.ts — new exports

/** Derives "Sem X - YYYY" from a date. Returns "" if date is invalid. */
export const getSemanaFromDate = (date: Date | string): string;

/** Parses "Sem X - YYYY" → { week, year } or null on failure. */
export const parseSemanaLabel = (label: string): { week: number; year: number } | null;

/** Generates dropdown options for the current year. */
export const getWeeksSelectOptions = (): { value: string; label: string }[];
```

- `getSemanaFromDate`: reuses existing `getWeekNumber` and `getYearAndWeek` from the same module. Returns format `"Sem 24 - 2026"`.
- `parseSemanaLabel`: regex `/^Sem\s+(\d{1,2})\s*-\s*(\d{4})$/i`.
- `getWeeksSelectOptions`: calls existing `getWeeksOfYear(new Date().getFullYear())`, maps to `{ value: item.label, label: item.label }`.
- **No new state** beyond what `formData` already holds. The `semana` field is just another key in the `formData` spread.
- **No new props**. The select is self-contained within each modal's existing form.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `getSemanaFromDate`, `parseSemanaLabel`, `getWeeksSelectOptions` | Vitest — pure functions, input/output assertions |
| Unit | Auto-derive: empty semana + valid fecha → derived; empty fecha → stays empty | Vitest — mock `formData`, call save functions |
| Integration | `ReportView` grouping: explicit semana vs fallback | Vitest + @testing-library/react — render with mixed pedido data, assert week grouping |
| E2E | Full flow: create → Card edit fecha clears semana → Modal save re-derives | Manual per `docs/E2E_TESTING.md` |

## Migration / Rollout

No DB migration — `semana` is optional and JSONB absorbs it transparently. Rollback: revert commit; existing pedidos without the key continue via date fallback in ReportView. No data loss risk.

## Open Questions

- None. All blockers resolved during exploration.
