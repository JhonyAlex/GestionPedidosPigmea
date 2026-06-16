# Production Tracking Audit History Specification

## Purpose

Add a readable History & Audit section inside Production Tracking with aligned, server-driven filtering.

## Requirements

### Requirement: Readable audit timeline

The system MUST show a readable audit timeline inside Production Tracking using audit event timestamp as the registration date, plus actor, action, order context, and machine context when available.

#### Scenario: Render readable entries

- GIVEN audit data exists for tracked orders
- WHEN the user opens History & Audit
- THEN the system shows entries sorted by registration date descending
- AND each entry is readable without exposing raw payload JSON

#### Scenario: Fallback for incomplete summaries

- GIVEN an audit event has no clean summary
- WHEN the event is rendered
- THEN the system shows fallback text with actor, timestamp, action type, and order context

### Requirement: Server-driven filter alignment

The system MUST apply registration-date and optional machine filters through one frontend, API, and backend contract. The frontend MUST send only supported filter parameters, the API MUST validate the same whitelist, and the backend MUST execute filtering and searching server-side rather than loading the full history for client-side filtering.

#### Scenario: Aligned date filtering

- GIVEN the user selects a registration-date range
- WHEN the filter is applied
- THEN the request uses the audit-event timestamp field accepted by the API and backend
- AND the returned entries match that server-filtered range

#### Scenario: Scalable filtering behavior

- GIVEN the audit history contains thousands of records
- WHEN the user filters or searches the history
- THEN the client requests only the filtered page from the server
- AND the client does not fetch the full history for eager local filtering

#### Scenario: Readable dense layout

- GIVEN filters, timeline entries, and actions are visible together
- WHEN the section renders in the current tracking view
- THEN controls remain visually separated from the timeline
- AND the layout stays consistent with existing Production Tracking patterns
