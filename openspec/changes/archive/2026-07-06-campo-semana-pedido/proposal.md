# Proposal: Campo Semana en Pedidos

## Intent

Users have no way to manually assign a production week to orders. The "Carga Semanal por Máquina" chart derives weeks from `nuevaFechaEntrega`, which breaks when delivery dates change post-assignment or when the logical week differs from the calendar week. Adding an explicit `semana` field gives users control while keeping backward compatibility with legacy orders.

## Scope

### In Scope
- `semana?: string` on Pedido type
- `<select>` field in AddPedidoModal and PedidoModal with all weeks of the current year (format: "Sem 23 - 2026")
- Auto-derive from `nuevaFechaEntrega` on first save if user never touched the field
- Once saved, the field is permanent — future date changes don't alter it
- PedidoCard clears `semana` on inline `nuevaFechaEntrega` edits so next save re-derives
- ReportView uses `p.semana` as primary week source, date derivation as fallback
- New week utilities: `getSemanaFromDate`, `parseSemanaLabel`, `getWeeksSelectOptions`
- BulkImportModalV2: add `semana` to importable fields

### Out of Scope
- Backend migration (JSONB auto-persists)
- Test suite (deferred to sdd-spec/tasks)
- Week-selection in PedidoCard inline view
- Multi-year week support beyond current year

## Capabilities

### New Capabilities
- `pedido-semana-field`: `<select>` field in add/edit pedido modals that auto-derives semana from `fechaEntrega` on first save and remains independent thereafter
- `weekly-load-by-semana`: chart grouping in ReportView prioritizes explicit `p.semana` over date-derived week for machine load calculation

### Modified Capabilities
None — no existing capability specs.

## Approach

**4 phases** from exploration:

1. **Type + Utils**: Add `semana?: string` to Pedido (`types.ts`). Add `getSemanaFromDate`, `parseSemanaLabel`, `getWeeksSelectOptions` to `utils/weekUtils.ts`.
2. **Forms**: Add `<select>` with empty default to AddPedidoModal and PedidoModal. Auto-derive in `createPedido` / `persistCurrentPedido` when untouched.
3. **Chart + Safety**: ReportView uses `p.semana ?? getSemanaFromDate(p.nuevaFechaEntrega)`. PedidoCard clears `semana` on inline `nuevaFechaEntrega` change.
4. **Bulk Import**: Add `semana` to `AVAILABLE_FIELDS` in BulkImportModalV2.

No backend or DB changes — PostgreSQL JSONB column stores the full pedido object transparently.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `types.ts` | Modified | Add `semana?: string` |
| `utils/weekUtils.ts` | Modified | New helpers (3 functions) |
| `components/AddPedidoModal.tsx` | Modified | Select + auto-derive logic |
| `components/PedidoModal.tsx` | Modified | Select + auto-derive logic |
| `components/PedidoCard.tsx` | Modified | Clear semana on fecha change |
| `components/ReportView.tsx` | Modified | Use `p.semana` in grouping |
| `components/BulkImportModalV2.tsx` | Modified | Add to importable fields |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PedidoCard inline fecha edit desyncs semana | Medium | Clear `semana` on every `nuevaFechaEntrega` change from PedidoCard |
| ISO week vs calendar week mismatch at year boundaries | Low | Use existing `getWeekNumber` logic; document edge |
| ReportView `dateField` toggle with mixed data (some pedidos have semana, some don't) | Low | Fallback chain handles mixed; no behavioral change for legacy |

## Rollback Plan

Revert the commit. `semana` is optional (`semana?: string`) — legacy pedidos without it continue working via the date fallback. No DB rollback needed; existing JSONB rows are unaffected by a new optional key.

## Dependencies

None. No new libraries, no API changes, no DB schema migration.

## Success Criteria

- [ ] User can select a week from the dropdown in both AddPedidoModal and PedidoModal
- [ ] Leaving field untouched auto-derives semana from `nuevaFechaEntrega` on first save
- [ ] After first save, changing `nuevaFechaEntrega` does NOT alter `semana`
- [ ] Chart groups pedidos by explicit `semana` when set, falls back to date otherwise
- [ ] Legacy pedidos (no `semana` field) display correctly in chart
- [ ] `tsc --noEmit` passes with no new errors
