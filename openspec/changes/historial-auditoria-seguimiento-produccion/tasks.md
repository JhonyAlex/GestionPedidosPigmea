# Tasks: Production Tracking History and Audit

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700-950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Audit API, normalization, typed client contract | PR 1 | Backend-first slice; include manual API checks |
| 2 | Extract audit UI and wire section into tracking | PR 2 | Depends on PR 1; keep `ProductionTrackingTable.tsx` thin |
| 3 | PDF export, empty states, end-to-end verification | PR 3 | Depends on PR 2; confirm visible-rows export behavior |

## Phase 1: Backend / Data Contract

- [x] 1.1 Add `getTrackingAuditPaginated()` helpers in `backend/postgres-client.js` for server-driven search, machine filter, timestamp range, cursor pagination, and readable fallback summaries from `action_history` + `limpio.pedidos`.
- [x] 1.2 Add `GET /api/pedidos/tracking/audit` in `backend/index.js` with strict `timestamp` date-field validation, safe cursor parsing, and auth/error handling aligned with existing tracking routes.
- [x] 1.3 Extend `types.ts` and `services/actionHistory.ts` with `TrackingAuditEntry`, `TrackingAuditFilters`, `TrackingAuditResponse`, and `getTrackingAudit()` using auth headers and visible-row payloads.

## Phase 2: Frontend Composition

- [x] 2.1 Update `components/DateFilterCombined.tsx` to accept consumer-provided field options so audit UI exposes only registration date while existing consumers keep current choices.
- [x] 2.2 Create `components/production-tracking/TrackingAuditFilters.tsx` for debounced search, machine select, timestamp filter, and clear visual separation from the timeline.
- [x] 2.3 Create `components/production-tracking/TrackingAuditTimeline.tsx` for readable audit cards, fallback text, load-more state, and empty-result messaging.
- [x] 2.4 Create `components/production-tracking/TrackingAuditSection.tsx` to own query state, cursor refresh on `action-history-update`, export enablement, and server-only filtering.
- [x] 2.5 Modify `components/ProductionTrackingTable.tsx` to mount the new section and keep existing tracking grid behavior unchanged when History & Audit is unused.

## Phase 3: Export / Verification

- [x] 3.1 Add `generateTrackingAuditPDF()` in `utils/kpi.ts` so PDF output reuses Pigmea styling, preserves readable fallback text, and blocks misleading empty-result exports.
- [ ] 3.2 Manually verify `GET /api/pedidos/tracking/audit` for spec scenarios: descending readable rows, incomplete-summary fallback, timestamp alignment, machine filter, search, and cursor pagination at scale.
- [ ] 3.3 Manually verify the UI in `components/production-tracking/*`: dense-layout readability, load-more, socket refresh without reset during in-flight requests, and PDF parity with visible filtered rows.

## Phase 4: Cleanup / Release Readiness

- [x] 4.1 Clean imports/helpers in `components/ProductionTrackingTable.tsx`, `services/actionHistory.ts`, and `utils/kpi.ts`; keep final review slices aligned to the PR work units above.
