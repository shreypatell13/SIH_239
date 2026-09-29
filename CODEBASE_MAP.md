# Codebase Map

## Application

- `src/app/` — Next.js pages, layouts, middleware-facing pages, and route handlers under `src/app/api/`.
- `src/components/` — applicant, officer, operations, and shared React UI.
- `src/server/auth/` — session role/permission checks and centralized case-scope policy (`case-access.ts`).
- `src/server/domain/` — framework-independent workflow, eligibility, deficiency, document, and operations domain types/policies.
- `src/server/documents/` — OCR provider contracts and implementations, including PDF text extraction/rasterization.
- `src/server/repositories/` — Prisma persistence queries and transactions.
- `src/server/services/` — application workflows, authorization boundaries, audit orchestration, and domain service coordination.
- Operations Control Tower: `/management` → `src/components/operations/` → `/api/operations/{overview,bottlenecks,cases}` → `src/server/services/operations-analytics.service.ts` → `src/server/repositories/operations-analytics.repository.ts`; role enforcement is in `src/server/auth/operations-access.ts`.
- Post-Selection Portal: `/post-selection` & `/post-selection/[id]` → `src/components/post-selection/` → `/api/post-selection/{overview,scholars,renewals,disbursements}` → `src/server/services/post-selection.service.ts` → `src/server/repositories/post-selection.repository.ts`; role enforcement is in `src/server/auth/post-selection-access.ts`.
- External Integration Adapters: `src/server/integrations/` (`digilocker`, `pfms`, `nsp`, `mota`, `registry.ts`) → `src/server/services/integration.service.ts` → `/api/integrations/health` and `src/components/integrations/integration-status-card.tsx`.
- `prisma/` — PostgreSQL Prisma schema, migrations, and seed data.

## Verification

- `tests/unit/` — Vitest unit and service tests.
- `tests/e2e/` — Playwright browser/API flows.
- `tests/e2e/zz-phase2m-complete-lifecycle.spec.ts` — two connected browser workflows for applicant-to-decision/management and seeded scholar renewal-to-disbursement/audit; placed last because the workflows intentionally mutate seed state.
- `tests/fixtures/documents/demo-*.pdf` — deterministic synthetic certificate-style fixtures. Every document is visibly marked DEMO ONLY and uses fake values.
- `scripts/` — maintenance and diagnostic scripts; inspect each script before execution.

## Security-sensitive paths

- Document preview: `src/app/api/documents/preview/[...key]/route.ts` → `ApplicationService.getPreviewBuffer` → `DocumentRepository.findByStoragePath` → `case-access.ts`.
- Storage access: `src/server/storage/local-storage.adapter.ts` enforces `resolveSafePath` with directory traversal containment guards.
- Officer case access/actions: officer route handlers → `OfficerService` → `case-access.ts` and `CaseRepository`.
- Deficiency corrections: applicant respond route → `ApplicationService.uploadCorrectionDocument` → `DeficiencyService` → scoped targeted recheck.
- Eligibility: `EligibilityEngineService.evaluateApplication` for full runs; `evaluateTargetedRules` for correction-linked rules only.
- Operations analytics: all three operations APIs independently require an active `OPERATIONS_DIRECTOR`; case-list responses omit applicant names and document-level data. The dashboard's age bands are analytical, derived from case/stage workflow timestamps and are not official SLA claims.
- Post-selection renewal & disbursement: `/api/post-selection/*` routes require role-specific authentication; applicants may only read/submit their own records (`scholar:read:own`, `renewal:submit:own`), while renewal adjudication (`renewal:review`) and disbursement status updates (`disbursement:update`) require authoritative officer/admin action and generate immutable `AuditLog` events.
- PII & Audit sanitization: `src/server/utils/security-sanitizer.ts` redacts passwords, tokens, API keys, and masks Aadhaar/bank account numbers before persistence to `AuditLog`.

## Verification status

Verified against a fresh disposable PostgreSQL database on local PostgreSQL 17.10, port 5433 (native service):

- Vitest: 22/22 test files, 215/215 tests passing
- Playwright: 66/66 E2E tests passing, including the two full connected lifecycle journeys
- Type-check, ESLint, Prettier, Prisma validation, migration status, production build: PASS
- Fresh blank database migration and deterministic seed, production application startup, demo persona routes, and reset/reseed: PASS. The configured user database was not modified.
- Connected applicant → OCR/verification → deficiency/correction/recheck → officer decision → audit/management and scholar → renewal → approval → disbursement → audit journeys: PASS.
- Demo walkthrough was timed at approximately 16 seconds of active browser interaction; MOCK/DEMO integration labeling is asserted.
- Limitation: the already-running native PostgreSQL service was not cold-restarted, and Docker startup was not exercised. Government integrations remain MOCK/DEMO. See `current-state.md` for full results and scope.

## Phase 2M demo/readiness files

- `README.md` — local PostgreSQL, migrations, deterministic seed, demo credentials, walkthrough, reset, and verification commands.
- `prisma/seed.ts` — idempotent synthetic records and protected previewable PDF fixtures.
- `prisma/migrations/20260929120000_phase_2m_schema_reconciliation/` — completes migration history for the current Prisma schema.
- `tests/e2e/deficiency.spec.ts` and `tests/e2e/document-intelligence.spec.ts` — corrected-evidence recheck/manual resolution and protected synthetic PDF preview scenarios.
- `src/server/integrations/core/synthetic-id.ts` — stable IDs for demo adapter responses.
