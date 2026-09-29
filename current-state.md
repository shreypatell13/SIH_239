# Live Project State — TribalScholar AI

**Project:** TribalScholar AI (SIH Problem Statement 26239)
**Last updated:** 2026-09-29

## Current status

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2M End-to-End Testing, Seed Data & Demo Readiness is **PARTIAL**.
- **Last stable commit:** Phase 2L baseline `7a56ac8`; Phase 2M commit recorded in Git after completion.
- **Working tree:** Phase 2M committed; verify `git status` for final cleanliness.
- **Schema:** PostgreSQL 17.10 on port `5433` (DB: `tribalscholar_db`); Prisma schema with 17 models and 19 enums; five checked-in migrations.

## Verification on 2026-09-29

- **PostgreSQL Database:** PostgreSQL 17.10 reachable on `localhost:5433`; Prisma migration history reports five migrations and schema up to date. Live schema was already present; migration metadata was reconciled, and an isolated shadow-database diff confirmed checked-in migrations reproduce the Prisma schema.
- `npm run type-check`: **PASS** (0 errors).
- `npm run lint`: **PASS** (0 warnings or errors).
- `npm run format:check`: **PASS** (100% Prettier compliant).
- `npm run build`: **PASS** (Next.js production build succeeded; 31/31 static pages/routes generated; webpack emitted non-fatal cache snapshot warnings).
- `npm test` (Vitest): **PASS** (**22/22 test files, 215/215 tests passing**).
- `npm run test:e2e` (Playwright): **PASS** (**64/64 E2E tests passing** across Chromium).
- `npm run prisma:seed`: **PASS**, repeated and run again after E2E to restore demo fixtures.
- `npx prisma validate` and `npx prisma migrate status`: **PASS**; schema valid and migration status up to date.
- Docker startup from a fresh environment: **NOT VERIFIABLE**; the local PostgreSQL 17 service was used and Docker startup was not exercised.

## Phase state

- **2A–2G:** **COMPLETED & VERIFIED**.
- **2H:** **COMPLETED & VERIFIED** (Deficiency management, applicant resolution workflow, targeted recheck).
- **2I:** **COMPLETED & VERIFIED** (Officer review workspace, split-screen PDF evidence viewer, bounding boxes, decision desk, transition endpoints).
- **2J:** **COMPLETED & VERIFIED** (Operations Control Tower, live database-backed analytics, 9-stage distribution, deterministic aging cohorts, explainable bottleneck diagnosis, deficiency heatmaps, officer workload, scheme operations summaries, PII-minimized drill-down, and direct Phase 2I case deep-linking).
- **2K:** **COMPLETED & VERIFIED** (Post-Selection Scholar Master Registry, Annual Renewal Workflows, Progress Report Submission, Authoritative Officer Adjudication, Mock PFMS Disbursement Milestones, Post-Selection Management Console `/post-selection` and Scholar Drill-Down Workspace `/post-selection/[id]`).
- **2L:** **COMPLETED & VERIFIED** (Integration Adapters for DigiLocker, PFMS, NSP, and MoTA; Safe Mock/Demo Providers; Integration Health & Status API `/api/integrations/health`; Security Hardening: Security Headers, Storage Path Traversal Prevention, PII/Audit Redaction, Magic-Byte File Validation).
- **2M:** **PARTIAL**. Seed reliability, schema/migration reconciliation, local startup/reset documentation, deterministic mock IDs, and 64 browser tests are complete. The browser suite does not yet prove the full lifecycle as a continuous journey: applicant application submission through OCR/eligibility, selected-case transition through applicant renewal submission and officer adjudication/disbursement, and a reusable complete demo rehearsal are not covered end-to-end. Seed evidence uses a generic synthetic PDF, not realistic certificate samples.

## Phase 2L Highlights

- **Integration Adapter Boundaries:** Cleanly typed, decoupled adapter interfaces (`IDigiLockerAdapter`, `IPfmsAdapter`, `INspAdapter`, `IMotaAdapter`) and deterministic mock implementations with simulation triggers for timeouts, outages, and malformed payloads.
- **Integration Registry & Health API:** Centralized `IntegrationRegistry` and protected `GET /api/integrations/health` endpoint returning sanitized health status across all adapters without leaking credentials or internal URLs.
- **Security Hardening & Headers:** Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and CSP headers in `next.config.mjs`.
- **Storage & Path Traversal Containment:** Hardened `LocalStorageAdapter` with `resolveSafePath` ensuring strict directory containment and blocking path traversal attempts.
- **PII Masking & Sanitized Auditing:** Centralized `security-sanitizer.ts` masking Aadhaar numbers (`XXXX-XXXX-1234`), bank accounts (`XXXX-XXXX-4921`), and redacting secrets/passwords/tokens from audit payloads and errors.

## Phase 2M Results

- **Seed personas:** Applicant, Verification Officer, Scheme Admin, and Operations Director, reusing the existing demo identities. Seed data includes NFST/NOS schemes, draft/submitted applications, case records, five synthetic documents, one explainable open deficiency, assigned officer, one scholar, renewal cycles, and mock disbursements.
- **Determinism/idempotence:** Seed uses stable timestamps/IDs, preserves valid seeded password hashes, writes synthetic PDFs to the configured local storage, updates fixed seed audit rows, and avoids deleting user-created scheme versions. Repeated seed execution succeeded.
- **E2E coverage:** 64/64 pass, including applicant dashboard/form save-resume, role and API authorization, deficiency issue/correction/targeted recheck/manual resolution, protected document preview, officer evidence review and transition, operations KPI/bottleneck/drill-down, integration status/security headers, scholar registry/detail, and scheme studio.
- **Limits:** The complete lifecycle is not yet one E2E journey. Applicant final submission/OCR-to-decision and applicant renewal submission/officer renewal adjudication/disbursement are covered only in service/unit tests or dashboard reads, not as complete browser scenarios. The PDF asset is a generic synthetic sample rather than a realistic certificate. Docker Compose startup was not run; local native PostgreSQL 17 was used. Phase 2M therefore remains partial.
