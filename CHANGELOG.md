# Changelog

## 2026-09-29 — Phase 2K Post-Selection Management & Renewal Workflows (COMPLETED & VERIFIED)

- Implemented database-backed Post-Selection Scholar Master Registry, multi-year progress report renewals, supervisor recommendation capture, and simulated PFMS disbursement schedules (`PostSelectionRecord`, `ScholarRenewal`, `DisbursementRecord`).
- Built dedicated role-scoped protected APIs under `/api/post-selection/*` (`overview`, `scholars`, `renewals`, `disbursements`) with server-authoritative RBAC enforcing applicant data privacy and officer adjudication authorities.
- Created interactive Post-Selection Console (`/post-selection`) with real-time KPI overview, filterable scholar registry, renewals queue, and disbursement tracking table.
- Created 5-tab Scholar Detail Workspace (`/post-selection/[id]`) providing complete visibility into scholar metadata, academic renewal cycles, disbursement installments, uploaded documentation, and immutable audit logs.
- Added modal workflows for applicant renewal submission (with auto-generated synthetic document storage keys) and officer renewal review with mandatory remarks and stage transition audit logs.
- Seeded Ramesh Meena NOS scholar record with 3-year tenure, approved Year 1 renewal, pending/upcoming renewal cycles, and simulated PFMS disbursement schedule with synthetic transaction references.
- Verified: Type-check (0 errors), ESLint (0 warnings), Prettier (100% compliant), Next.js production build (30/30 routes compiled), Vitest unit/integration tests (20/20 test suites, 185/185 tests passing), and Playwright E2E tests (60/60 tests passing).

## 2026-09-29 — Phase 2J Operations Control Tower (COMPLETED & VERIFIED)

- Added Operations Director-protected overview, bottleneck, and paginated case-list APIs with sanitized errors and query validation.
- Connected management dashboard KPIs, stage counts/age, deterministic analytical aging buckets, explainable multi-signal bottlenecks, officer workload, generic scheme comparison, and deficiency summaries to Prisma-backed services.
- Added PII-minimized case-list drill-down and composable filters for scheme, stage/state, age, assignment, open deficiencies, verification, officer attention, and completed cases.
- Kept analytical triggers distinct from official SLA claims; workload visibility does not score officers.
- Connected to native PostgreSQL 17 cluster running on port 5433 with UTF-8 encoding and seed dataset.
- Verification: type-check, lint, format check, Next.js build (25/25 routes), Vitest (18/18 test suites, 173/173 tests passing), and Playwright E2E (56/56 tests passing) all verified and passing cleanly.

## 2026-09-29 — Phase 2A–2I audit remediation

- Enforced case-scope authorization for document preview, officer detail/actions, deficiency operations, and evidence-related service paths.
- Preserved officer queue authorization when search and filters are applied; made officer claiming conditional to prevent assignment races.
- Added applicant-owned replacement uploads for open deficiencies on submitted applications, with requirement/signature validation, version history, provenance, and audit events.
- Separated targeted rule evaluation from full application evaluation and made deficiency rechecks evidence-scoped.
- Added scanned-PDF rasterization for OCR with per-page provenance, resource limits, timeout, and cleanup; bounding boxes are nullable when unavailable.
- Added authorized, state-checked, audited officer decision transitions and removed unused hardcoded rule/workflow services.
- Internal OCR sweep now fails closed when its secret is missing.
- Verification limits: type-check, ESLint, Prettier, and Next build passed; PostgreSQL was unavailable for database-backed checks; Vitest config loading was blocked by sandbox parent-directory access. Refer to `current-state.md` for exact results.
