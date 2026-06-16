# Production Tracking Audit PDF Export Specification

## Purpose

Export the active History & Audit view to PDF with Pigmea-consistent styling.

## Requirements

### Requirement: Export the active filtered view

The system MUST export the same readable audit/history view currently active on screen, including the selected registration-date range, optional machine filter, visible ordering, and transformed readable text instead of raw payload JSON.

#### Scenario: Export filtered history

- GIVEN the user has applied date and optional machine filters
- WHEN the user exports History & Audit to PDF
- THEN the PDF contains the same filtered entries shown on screen
- AND the PDF excludes entries outside the active filters

#### Scenario: Preserve readable fallback text

- GIVEN a visible entry uses fallback audit text
- WHEN the PDF is generated
- THEN the export includes the same readable fallback content

### Requirement: Consistent and safe export states

The system MUST keep the export readable and consistent with current Pigmea PDF conventions, and it MUST handle empty filtered results without exporting misleading data.

#### Scenario: Consistent PDF presentation

- GIVEN visible history results are available
- WHEN the PDF is generated
- THEN the document follows current Pigmea PDF styling conventions
- AND the exported section remains easy to scan

#### Scenario: Empty filtered result export

- GIVEN the active filters produce no history entries
- WHEN the user triggers export
- THEN the system prevents or clearly marks an empty-result export
- AND it does not generate a misleading unfiltered document
