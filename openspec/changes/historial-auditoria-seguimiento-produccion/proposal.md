# Proposal: Production Tracking History and Audit

## Intent

Add a readable **History & Audit** section inside Production Tracking so supervisors can review order movements, actors, and machine context without decoding raw logs or leaving the current workflow.

## Scope

### In Scope
- Add an in-tab History & Audit section with registration-date range filtering and optional machine filtering.
- Render human-readable audit entries from `public.action_history` plus order context.
- Export the active filtered on-screen view to PDF with Pigmea-consistent styling.

### Out of Scope
- Replacing the global Activity Log or merging legacy `audit_log` / `audit_logs`.
- New tables, new audit ingestion flows, or historical backfill.

## Capabilities

### New Capabilities
- `production-tracking-audit-history`: Readable audit timeline and filters inside Seguimiento de Producción.
- `production-tracking-audit-pdf-export`: PDF export of the active filtered audit/history view.

### Modified Capabilities
- None.

## Approach

Extend the current tracking tab, but extract audit UI into focused subcomponents to avoid further bloating `components/ProductionTrackingTable.tsx`. Use `public.action_history` as the canonical source, normalize `payload.summary`, before/after values, and order metadata into plain-language entries, and extend tracking query state/API support for registration-date and machine filters.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/ProductionTrackingTable.tsx` | Modified | Host the new section, filters, and export entry point. |
| `components/DateFilterCombined.tsx` | Modified | Add aligned registration-date filtering UX. |
| `services/storage.ts`, `backend/index.js`, `backend/postgres-client.js` | Modified | Support machine + registration-date filters in `/api/pedidos/tracking` or companion reads. |
| `services/actionHistory.ts`, `components/ActivityPanel.tsx`, `utils/kpi.ts` | Modified | Reuse audit fetch patterns and Pigmea PDF styling. |

## Assumptions

- Registration date means the audit event timestamp.
- PDF exports the same filtered rows and readable entries visible on screen, not raw payload JSON.
- Machine filtering uses existing order machine data, so no schema migration is planned in this slice.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Date-field whitelist mismatch drops the new filter | Med | Align UI options, API params, and SQL-safe field handling. |
| Some events may not have clean summaries | Med | Define fallback translation rules with actor, timestamp, and context. |
| Added density could hurt readability | Med | Split filters, timeline, and export controls into subcomponents. |

## Rollback Plan

Revert the new section, export trigger, and added tracking query parameters, leaving existing tracking and action-history endpoints unchanged. No database rollback should be required.

## Dependencies

- Existing `public.action_history` data completeness and order linkage.
- Existing jsPDF conventions in `utils/kpi.ts`.

## Success Criteria

- [ ] Users can filter audit/history by registration date and optionally by machine, with readable entries instead of raw logs.
- [ ] PDF output matches the active filtered view and follows current Pigmea report styling.
- [ ] Existing Seguimiento de Producción behavior remains unchanged when the new section is unused.
