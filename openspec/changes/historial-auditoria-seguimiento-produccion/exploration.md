## Exploration: Historial y Auditoría en Seguimiento de Producción

### Current State
`components/ReportView.tsx` mounts `ProductionTrackingTable` as the current “Seguimiento de Producción” tab. That table only shows `COMPLETADO` and `ARCHIVADO` orders, supports text search plus a generic date filter, and fetches data through `/api/pedidos/tracking`. There is no machine filter, no audit-focused section, and no PDF export for this tab. Audit data is split between legacy `audit_log` (`/api/audit`) and richer `action_history` (`/api/action-history`), while order-level `historial` entries already store natural-language movement notes.

### Affected Areas
- `components/ProductionTrackingTable.tsx` — current tracking UI, filters, pagination, and table layout where the new section would live.
- `components/DateFilterCombined.tsx` — existing date-filter control that would need a dedicated registration-date option/state alignment.
- `services/storage.ts` — tracking query builder for new filter params.
- `backend/index.js` — `/api/pedidos/tracking` contract and existing action-history endpoints.
- `backend/postgres-client.js` — server-side tracking filters/sorting; current whitelist is narrower than the frontend date-field UI.
- `components/ActivityPanel.tsx` / `services/actionHistory.ts` — reusable audit feed/search patterns for readable timeline UX.
- `utils/kpi.ts` — existing jsPDF order-report pattern to keep PDF output visually consistent.

### Approaches
1. **Extend the current tracking tab** — add a new “Historial y Auditoría” section inside `ProductionTrackingTable`, backed by richer tracking filters and action-history queries.
   - Pros: Reuses the existing tab, current filters, current order navigation, and existing PDF/report styling.
   - Cons: `ProductionTrackingTable.tsx` is already large, and the tracking endpoint would grow further.
   - Effort: Medium

2. **Create a tracking subview with master-detail audit UX** — keep the order list on one side and load a dedicated audit timeline/detail pane for the selected order/date.
   - Pros: Better readability for audit work, clearer separation between list data and movement history, easier natural-language storytelling.
   - Cons: More UI/API surface, more coordination for export scope and state sync.
   - Effort: High

### Recommendation
Use **Approach 1**, but implement it with extracted subcomponents. Keep the new feature inside “Seguimiento de Producción” as requested, use `action_history` as the canonical audit source for movement events, enrich entries with existing `payload.summary`/before-after data, and reuse the current jsPDF visual language for export.

### Risks
- `DateFilterCombined` exposes fields like `nuevaFechaEntrega`, but `getTrackingPaginated()` currently only honors `fechaCreacion`, `fechaEntrega`, and `fechaFinalizacion`; this mismatch must be fixed before adding another date-driven audit filter.
- `action_history` and legacy `audit_log` overlap but are not the same source of truth; the proposal must define which one powers the new section.
- Tracking sort keys for milestone columns currently map to `secuencia_pedido`, not real movement dates, so audit ordering expectations need explicit handling.

### Ready for Proposal
Yes — but the proposal should first lock the canonical audit source, confirm whether the PDF exports only the filtered list or also the readable timeline, and keep the UI split into smaller subcomponents to avoid bloating the current tracking table.
