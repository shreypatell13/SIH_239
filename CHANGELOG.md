# Changelog

## 2026-09-29 — Phase 2J Operations Control Tower (PARTIAL)

- Added Operations Director-protected overview, bottleneck, and paginated case-list APIs with sanitized errors and query validation.
- Connected management dashboard KPIs, stage counts/age, deterministic analytical aging buckets, explainable multi-signal bottlenecks, officer workload, generic scheme comparison, and deficiency summaries to Prisma-backed services.
- Added PII-minimized case-list drill-down and composable filters for scheme, stage/state, age, assignment, open deficiencies, verification, officer attention, and completed cases.
- Kept analytical triggers distinct from official SLA claims; workload visibility does not score officers.
- No Prisma schema or migration change was required.
- Verification: type-check, lint, format check, and build passed. PostgreSQL at `localhost:5433` was unavailable; Vitest could not load its config due sandbox parent-directory access denial; unauthenticated operations API E2E passed, but seeded-role E2E checks failed because demo credentials were rejected. Phase 2J remains PARTIAL pending database-backed verification.

## 2026-09-29 — Phase 2A–2I audit remediation

- Enforced case-scope authorization for document preview, officer detail/actions, deficiency operations, and evidence-related service paths.
- Preserved officer queue authorization when search and filters are applied; made officer claiming conditional to prevent assignment races.
- Added applicant-owned replacement uploads for open deficiencies on submitted applications, with requirement/signature validation, version history, provenance, and audit events.
- Separated targeted rule evaluation from full application evaluation and made deficiency rechecks evidence-scoped.
- Added scanned-PDF rasterization for OCR with per-page provenance, resource limits, timeout, and cleanup; bounding boxes are nullable when unavailable.
- Added authorized, state-checked, audited officer decision transitions and removed unused hardcoded rule/workflow services.
- Internal OCR sweep now fails closed when its secret is missing.
- Verification limits: type-check, ESLint, Prettier, and Next build passed; PostgreSQL was unavailable for database-backed checks; Vitest config loading was blocked by sandbox parent-directory access. Refer to `current-state.md` for exact results.
