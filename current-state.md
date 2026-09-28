# Live Project State — TribalScholar AI

**Project:** TribalScholar AI (SIH Problem Statement 26239)
**Last updated:** 2026-09-29

## Current status

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2I remediation; Phase 2J work already exists in the working tree and remains out of scope for this pass.
- **Last stable commit:** `703b582 feat(phase-2h): implement deficiency management and targeted recheck workflow`
- **Working tree:** Contains existing uncommitted Phase 2I/2J work plus remediation changes. Do not reset or discard it.
- **Schema:** No schema change was needed for this remediation.

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
- **2J:** Existing working-tree work is preserved and was not extended as part of this task.

## Known limitations

- PostgreSQL was unavailable at `localhost:5433` during build/E2E verification.
- Vitest could not start under the current filesystem sandbox.
- `pdftoppm` must be installed or `PDF_TO_PPM_PATH` configured for scanned-PDF rasterization; OCR accuracy and coordinates depend on the provider and are not guaranteed.
- This remediation is not a production security certification.
