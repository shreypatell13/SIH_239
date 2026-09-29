# Changelog

## 2026-09-29 — Phase 2M Final Validation (COMPLETED & VERIFIED)

- Added two connected Playwright lifecycle scenarios: applicant scheme/form/document/OCR/submission/deficiency correction/targeted recheck/officer decision/audit/management; and seeded scholar registry/detail/renewal submission/officer approval/simulated disbursement/audit.
- Moved the state-mutating lifecycle scenarios to the end of the E2E suite so existing scenarios run against their expected seeded baseline; aligned NextAuth external/internal callback URLs with Playwright's selected port so logout remains on the test server.
- Replaced generic seeded application attachments with deterministic synthetic certificate-style PDFs, clearly marked DEMO ONLY and containing fake values; retained an intentionally ambiguous generic fixture for the test that verifies an unresolved targeted recheck.
- Fixed the schema reconciliation migration's missing final newline, allowing a fresh PostgreSQL deployment to apply all five migrations.
- Fresh-database reset/migration/seed, application startup, demo persona login/main routes, and repeat reset/reseed verified on an isolated database. The configured user database was not reset or modified.
- Timed the final walkthrough at approximately 16 seconds of active browser interaction. No blocking navigation, runtime, authentication, missing-record, or integration-labeling issues remained.
- Final regression: type-check, lint, format check, production build, Vitest (22 files/215 tests), and Playwright (66/66) passed. The two connected lifecycle tests also passed independently.
- Limitation: integrations remain MOCK/DEMO; Docker startup and a cold stop/start of the already-running native PostgreSQL service were not exercised.

## 2026-09-29 — Phase 2M End-to-End Testing & Demo Readiness (PARTIAL)

- Made synthetic seed records repeatable: stable seed timestamps/IDs, fixed seed audit rows, preserved seeded password hashes, safe seeded PDF storage, and no deletion of later scheme versions.
- Added a schema reconciliation migration; validated the migration chain against an isolated shadow PostgreSQL database and recorded the already-existing live schema as applied.
- Added `prisma:migrate:deploy`, aligned Docker Compose with PostgreSQL 17 and the configured 5433 port, and documented local setup/personas/walkthrough/reset in `README.md`.
- Replaced random mock integration identifiers and fallback PFMS references with stable deterministic values.
- Strengthened E2E coverage for correction upload → targeted recheck → officer resolution and protected PDF preview; fixed test-created scheme cleanup.
- Verified: Prisma validate/migrate status, type-check, lint, format, build (31 routes), Vitest (22 files/215 tests), Playwright (64/64), and repeat seed.
- **Partial:** full applicant submission/OCR/decision and post-selection renewal/disbursement are not yet continuous E2E workflows; certificate files are generic synthetic PDFs; fresh Docker startup and timed full-demo rehearsal remain unverified.

## 2026-09-29 — Phase 2L Integration Adapters & Security Hardening (COMPLETED & VERIFIED)

- Created production-ready, decoupled integration adapter boundaries for external government systems (`IDigiLockerAdapter`, `IPfmsAdapter`, `INspAdapter`, `IMotaAdapter`).
- Implemented deterministic, safe mock adapters (`MockDigiLockerAdapter`, `MockPfmsAdapter`, `MockNspAdapter`, `MockMotaAdapter`) with built-in test hooks for timeout simulation, provider outage, and malformed payload resilience.
- Provided centralized `IntegrationRegistry` and server-protected health API (`GET /api/integrations/health`) with responsive status visualization (`IntegrationStatusCard`) in the Operations Control Tower.
- Hardened HTTP security headers in `next.config.mjs` (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-XSS-Protection`).
- Reinforced local document storage against directory traversal attacks via `LocalStorageAdapter.resolveSafePath`.
- Implemented `security-sanitizer.ts` for PII protection: masking Aadhaar numbers (`XXXX-XXXX-1234`), bank account numbers (`XXXX-XXXX-4921`), and scrubbing passwords/tokens/database connection strings from audit logs and error responses.
- Verified: Type-check (0 errors), ESLint (0 warnings/errors), Prettier (100% compliant), Next.js production build (31/31 routes compiled), Vitest unit & integration tests (22/22 test suites, 214/214 tests passing), and Playwright E2E tests (63/63 tests passing).

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
