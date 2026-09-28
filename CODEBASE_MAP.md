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
- `prisma/` — PostgreSQL Prisma schema, migrations, and seed data.

## Verification

- `tests/unit/` — Vitest unit and service tests.
- `tests/e2e/` — Playwright browser/API flows.
- `scripts/` — maintenance and diagnostic scripts; inspect each script before execution.

## Security-sensitive paths

- Document preview: `src/app/api/documents/preview/[...key]/route.ts` → `ApplicationService.getPreviewBuffer` → `DocumentRepository.findByStoragePath` → `case-access.ts`.
- Officer case access/actions: officer route handlers → `OfficerService` → `case-access.ts` and `CaseRepository`.
- Deficiency corrections: applicant respond route → `ApplicationService.uploadCorrectionDocument` → `DeficiencyService` → scoped targeted recheck.
- Eligibility: `EligibilityEngineService.evaluateApplication` for full runs; `evaluateTargetedRules` for correction-linked rules only.
- Operations analytics: all three operations APIs independently require an active `OPERATIONS_DIRECTOR`; case-list responses omit applicant names and document-level data. The dashboard's age bands are analytical, derived from case/stage workflow timestamps and are not official SLA claims.

## Current verification caveats

See `current-state.md` for the latest command results. PostgreSQL availability is required by integration/E2E paths; the current sandbox also prevents Vitest's esbuild config loader from traversing a parent directory.
