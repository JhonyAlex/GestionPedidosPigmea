# Design: Implementar nuevo apartado de Historial y Auditoría en Seguimiento de Producción

## Technical Approach

Keep `components/ProductionTrackingTable.tsx` as the tracking entry point, but split the new history feature into focused subcomponents. The order grid stays backed by `/api/pedidos/tracking`; the new History & Audit section uses a dedicated server-driven endpoint over `action_history`, enriched with order data from `limpio.pedidos`. This matches the proposal, keeps search deferred for scale, and lets PDF export reuse Pigmea’s existing jsPDF styling patterns.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|---|---|---|---|
| Audit data source | `action_history` vs legacy `audit_log(s)` | Legacy logs are broader but less structured for order storytelling | Use `action_history` as canonical source, with readable fallback text from `description` and payload diffs |
| Search and pagination | Client eager filtering vs server-driven query | Client filtering breaks at thousands of rows and diverges from export | Use server-driven filters, debounced search, and cursor pagination by `(timestamp,id)` |
| UI composition | Keep everything in `ProductionTrackingTable.tsx` vs extract components | Single file is faster short-term but worsens current 539-line component | Extract audit filters, timeline, and export controls into `components/production-tracking/*` |
| Date filtering | Reuse current hardcoded `DateFilterCombined` vs configurable field whitelist | Current component exposes fields unsupported by `/api/pedidos/tracking` | Make `DateFilterCombined` accept explicit field options per consumer; audit exposes only registration date |

## Data Flow

`ReportView` → `ProductionTrackingTable`

`ProductionTrackingTable` ──→ `store.getTracking()` ──→ `GET /api/pedidos/tracking`

`TrackingAuditSection` ──→ `actionHistoryDB.getTrackingAudit()` ──→ `GET /api/pedidos/tracking/audit`
                                    │
                                    ├─ backend joins `action_history` + `limpio.pedidos`
                                    ├─ normalizes summary/title/details/machine/order context
                                    └─ returns cursor page + export-ready readable rows

`TrackingAuditSection` ──→ `generateTrackingAuditPDF(visibleEntries, filters)`

On `action-history-update`, the audit section refreshes the first cursor page when no search/load-more request is in flight. No new WebSocket event is required.

## File Changes

| File | Action | Description |
|---|---|---|
| `components/ProductionTrackingTable.tsx` | Modify | Keep tracking table orchestration and mount the new audit section without further bloating the file |
| `components/production-tracking/TrackingAuditSection.tsx` | Create | Own audit query state, cursor pagination, socket refresh, and export action |
| `components/production-tracking/TrackingAuditFilters.tsx` | Create | Render debounced search, machine select, and registration-date filter controls |
| `components/production-tracking/TrackingAuditTimeline.tsx` | Create | Render readable audit cards and load-more UX |
| `components/DateFilterCombined.tsx` | Modify | Accept consumer-provided date-field options to align UI with backend whitelist |
| `services/actionHistory.ts` | Modify | Add `getTrackingAudit()` and shared response types using existing auth-header convention |
| `backend/index.js` | Modify | Add `GET /api/pedidos/tracking/audit` and validate allowed filters/cursor |
| `backend/postgres-client.js` | Modify | Add `getTrackingAuditPaginated()` with safe SQL filters and normalization helpers |
| `types.ts` | Modify | Add `TrackingAuditEntry`, `TrackingAuditFilters`, and `TrackingAuditResponse` |
| `utils/kpi.ts` | Modify | Add `generateTrackingAuditPDF()` reusing Pigmea header/footer/table styling |

## Interfaces / Contracts

```ts
export interface TrackingAuditFilters {
  search?: string;
  machine?: string;
  dateField: 'timestamp';
  dateFrom?: string;
  dateTo?: string;
  cursor?: string | null;
  limit?: number;
}

export interface TrackingAuditEntry {
  id: string;
  pedidoId: string;
  numeroPedidoCliente: string;
  cliente: string;
  maquinaImpresion?: string;
  timestamp: string;
  userName: string;
  source?: 'frontend' | 'backend';
  title: string;
  details: string;
  changes?: string[];
}
```

`GET /api/pedidos/tracking/audit` returns `{ actions, nextCursor, hasMore }`. Filters are validated server-side; the only accepted date field is `timestamp` to keep frontend, API, and SQL whitelist aligned.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Audit normalization fallbacks and date-field whitelist mapping | Manual TypeScript-focused checks plus targeted helper verification |
| Integration | `/api/pedidos/tracking/audit` search, machine filter, cursor, and date range | Manual API calls against real backend data |
| E2E | Tracking tab, load-more, socket refresh, and PDF consistency | Manual browser verification and exported PDF review |

## Migration / Rollout

No migration required. Roll out behind the new UI section only. Existing tracking behavior remains unchanged if users never open History & Audit.

## Open Questions

- [ ] Confirm whether PDF export should include only the currently loaded/visible audit rows or the full filtered dataset; this design assumes visible rows for scalability.
- [ ] Confirm whether machine filtering should use exact machine names only or include derived post-production group labels when an order has no direct `maquinaImpresion` value.
