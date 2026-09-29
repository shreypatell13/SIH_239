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

All verification suites pass cleanly against the live PostgreSQL instance on port 5433:

- Vitest: 22/22 test suites, 214/214 tests passing
- Playwright: 63/63 E2E tests passing
- Type-check, ESLint, Prettier, Next.js build: 100% PASS
