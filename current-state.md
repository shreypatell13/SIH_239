# Live Project State — TribalScholar AI

**Project:** TribalScholar AI (SIH Problem Statement 26239)
**Last updated:** 2026-09-29

## Current status

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2J Operations Control Tower implementation; Phase 2K has not started.
- **Last stable commit:** `d70d7b1 feat(phase-2j): implement operations control tower analytics` (Phase 2J remains partial pending database-backed verification.)
- **Working tree:** Contains existing uncommitted Phase 2I/2J work plus remediation changes. Do not reset or discard it.
- **Schema:** No schema change was needed for Phase 2J.

## Remediation implemented

- Central case authorization now guards document preview, officer case detail/actions, and sensitive service operations; officer assignment is enforced atomically and queue search remains ANDed with scope.
- Applicants can upload a replacement document against an open deficiency on a submitted application. The upload is scoped to the owning applicant and requirement, validates MIME/size/signature, versions the document, and records provenance/audit history.
- Targeted correction rechecks select configured rules related to the changed document/fields and evaluate deficiency-specific evidence. Rule metadata supports `dependsOnFields` and `dependsOnDocumentTypes`; missing mappings remain officer-review cases.
- Officer stage decisions are server-derived, authorized, state-validated, and audited transactionally. There is no AI approval/rejection path.
- Scanned PDFs with no usable text are rasterized page-by-page for OCR, with a page cap, timeout, temporary-file cleanup, and honest nullable bounding boxes.
- The internal OCR sweep fails closed when its secret is not configured. Unused legacy hardcoded rule/workflow services were removed.

## Verification on 2026-09-29

- `npm run type-check`: PASS.
- `npm run lint`: PASS, no warnings or errors.
- `npm run format:check`: PASS.
- `npm run build`: PASS (Next build exit code 0); static generation logged inability to connect to PostgreSQL at `localhost:5433`.
- `npm test`: NOT VERIFIABLE. Vitest/esbuild could not traverse `../../..` due sandbox access denial while loading `vitest.config.ts`.
- `npm run test:e2e`: NOT VERIFIABLE. The run was stopped after the initial database-backed tests repeatedly failed because seeded PostgreSQL at `localhost:5433` is unavailable; unauthenticated middleware guard checks did pass before the failures.
- No test suite is represented as passing unless it completed successfully in this environment.

## Phase state

- **2A–2G:** Historical phase records remain in `phases.md`; this remediation pass did not re-run their full acceptance suites.
- **2H:** Remediation implemented; database-dependent and unit-suite verification remains limited by the environment.
- **2I:** Existing workspace code plus decision/scope remediation is present; database-backed acceptance remains unverified.
- **2J:** Database-backed operations dashboard, protected APIs, deterministic aging/bottleneck analytics, scheme and officer summaries, and paginated case-level drill-down are implemented. Status is PARTIAL because database-backed integration/E2E checks could not be verified in this environment.

## Phase 2J verification on 2026-09-29

- `npm run type-check`: PASS.
- `npm run lint`: PASS, no warnings or errors.
- `npm run format:check`: PASS.
- `npm run build`: PASS; Next.js compiled and generated all pages. Static generation logged PostgreSQL connection failures at `localhost:5433`.
- `npm test`: NOT VERIFIABLE; Vitest/esbuild was denied access while traversing `../../..` to load `vitest.config.ts`.
- `npm run test:e2e`: NOT VERIFIABLE as a complete suite; the initial unrelated applicant-flow cases failed and the suite was stopped after failures. Focused Phase 2J E2E: unauthenticated API checks passed; role login/dashboard checks failed because seeded demo credentials were rejected while PostgreSQL was unavailable.
- PostgreSQL TCP check at `localhost:5433`: unavailable.
- No Prisma schema or migration changes were made.

## Known limitations

- PostgreSQL was unavailable at `localhost:5433` during build/E2E verification, so database-backed analytics and seeded-role flows remain unverified.
- Vitest could not start under the current filesystem sandbox.
- `pdftoppm` must be installed or `PDF_TO_PPM_PATH` configured for scanned-PDF rasterization; OCR accuracy and coordinates depend on the provider and are not guaranteed.
- This remediation is not a production security certification.
