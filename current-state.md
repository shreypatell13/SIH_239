# Live Project State — TribalScholar AI

**Project:** TribalScholar AI (SIH Problem Statement 26239)
**Last updated:** 2026-09-29

## Current status

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2M End-to-End Testing, Seed Data & Demo Readiness is **COMPLETE**.
- **Last stable commit:** Phase 2M final validation commit.
- **Working tree:** Clean after the Phase 2M final validation commit.
- **Schema:** PostgreSQL 17.10 on port `5433` (DB: `tribalscholar_db`); Prisma schema with 17 models and 19 enums; five checked-in migrations.

## Verification on 2026-09-29

- **PostgreSQL Database:** PostgreSQL 17.10 service was running and reachable on `localhost:5433`. Created a uniquely named disposable blank verification database, deployed all five checked-in migrations, and seeded it. The configured `tribalscholar_db` was not reset or modified. The already-running Windows PostgreSQL service was not stopped/restarted; Docker cold startup was not exercised.
- `npm run type-check`: **PASS** (0 errors).
- `npm run lint`: **PASS** (0 warnings or errors).
- `npm run format:check`: **PASS** (100% Prettier compliant).
- `npm run build`: **PASS** (Next.js production build succeeded; 31/31 static pages/routes generated; webpack emitted non-fatal cache snapshot warnings).
- `npm test` (Vitest): **PASS** (**22/22 test files, 215/215 tests passing**).
- `npm run test:e2e` (Playwright): **PASS** (**66/66 E2E tests passing** across Chromium, including two connected Phase 2M lifecycle scenarios).
- `npm run prisma:seed`: **PASS**, repeated and run again after E2E to restore demo fixtures.
- `npx prisma validate` and `npx prisma migrate status`: **PASS**; schema valid and migration status up to date.
- Fresh database setup: **PASS** using the documented local PostgreSQL service, fresh blank database, migration deployment, deterministic seed, production application startup, persona login, and reset/reseed. Cold-starting the already-running PostgreSQL Windows service and Docker startup were not exercised.
- Connected applicant journey: **PASS** in a single Playwright browser scenario from scheme selection and dynamic form through upload/OCR, submission, officer review, deficiency, correction/targeted recheck, final officer transition, audit, and management analytics.
- Connected post-selection journey: **PASS** in a single Playwright browser scenario from scholar registry/detail through applicant renewal submission, officer approval, simulated disbursement update, and audit.
- Timed rehearsal: **PASS**; the final walkthrough's two browser workflows completed in approximately **16 seconds of active browser interaction** (about 11 seconds applicant/management and 5 seconds renewal/disbursement/audit; excludes database/app startup and manual narration). No demo-blocking navigation, runtime, auth, record, or labeling issue remained.

## Phase state

- **2A–2G:** **COMPLETED & VERIFIED**.
- **2H:** **COMPLETED & VERIFIED** (Deficiency management, applicant resolution workflow, targeted recheck).
- **2I:** **COMPLETED & VERIFIED** (Officer review workspace, split-screen PDF evidence viewer, bounding boxes, decision desk, transition endpoints).
- **2J:** **COMPLETED & VERIFIED** (Operations Control Tower, live database-backed analytics, 9-stage distribution, deterministic aging cohorts, explainable bottleneck diagnosis, deficiency heatmaps, officer workload, scheme operations summaries, PII-minimized drill-down, and direct Phase 2I case deep-linking).
- **2K:** **COMPLETED & VERIFIED** (Post-Selection Scholar Master Registry, Annual Renewal Workflows, Progress Report Submission, Authoritative Officer Adjudication, Mock PFMS Disbursement Milestones, Post-Selection Management Console `/post-selection` and Scholar Drill-Down Workspace `/post-selection/[id]`).
- **2L:** **COMPLETED & VERIFIED** (Integration Adapters for DigiLocker, PFMS, NSP, and MoTA; Safe Mock/Demo Providers; Integration Health & Status API `/api/integrations/health`; Security Hardening: Security Headers, Storage Path Traversal Prevention, PII/Audit Redaction, Magic-Byte File Validation).
- **2M:** **COMPLETED & VERIFIED**. Two connected browser lifecycle journeys, fresh disposable database migration/seed/startup, demo persona login/routes, timed walkthrough, deterministic synthetic certificate fixtures, and the complete 215-test + 66-test regression suites pass. Government integrations remain MOCK/DEMO only. Docker cold startup and stopping/restarting the already-running native PostgreSQL service were outside this validation.

## Phase 2L Highlights

- **Integration Adapter Boundaries:** Cleanly typed, decoupled adapter interfaces (`IDigiLockerAdapter`, `IPfmsAdapter`, `INspAdapter`, `IMotaAdapter`) and deterministic mock implementations with simulation triggers for timeouts, outages, and malformed payloads.
- **Integration Registry & Health API:** Centralized `IntegrationRegistry` and protected `GET /api/integrations/health` endpoint returning sanitized health status across all adapters without leaking credentials or internal URLs.
- **Security Hardening & Headers:** Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and CSP headers in `next.config.mjs`.
- **Storage & Path Traversal Containment:** Hardened `LocalStorageAdapter` with `resolveSafePath` ensuring strict directory containment and blocking path traversal attempts.
- **PII Masking & Sanitized Auditing:** Centralized `security-sanitizer.ts` masking Aadhaar numbers (`XXXX-XXXX-1234`), bank accounts (`XXXX-XXXX-4921`), and redacting secrets/passwords/tokens from audit payloads and errors.

## Phase 2M Results

- **Seed personas:** Applicant, Verification Officer, Scheme Admin, and Operations Director, reusing the existing demo identities. Seed data includes NFST/NOS schemes, draft/submitted applications, case records, synthetic documents, one explainable open deficiency, assigned officer, one scholar, renewal cycles, and mock disbursements.
- **Determinism/idempotence:** Seed uses stable timestamps/IDs, preserves valid seeded password hashes, writes synthetic PDFs to the configured local storage, updates fixed seed audit rows, and avoids deleting user-created scheme versions. Repeated seed execution succeeded.
- **Complete browser scenarios:** Applicant starts from the NFST scheme explorer and consumes persisted state at each subsequent step: dynamic form save, four synthetic PDF uploads, OCR sweep/extraction, eligibility/verification, submission, officer review, deficiency issuance, applicant replacement evidence, targeted recheck, officer decision, audit timeline, and management analytics. Separately, the seeded NOS scholar is opened from the registry, receives a submitted cycle-2 renewal, officer approval, a PAID simulated disbursement, and persisted audit events.
- **Fresh environment/demo:** A uniquely named blank disposable PostgreSQL database was migrated and seeded; the app started with the production server; seeded personas and main routes loaded; deterministic reset/reseed succeeded. Final walkthrough order: Applicant → Verification → Deficiency/Recheck → Officer Decision → Management Analytics → Scholar Registry → Renewal → Disbursement → Audit. Approximately 16 seconds active browser interaction; no blocking issue.
- **Synthetic documents:** Replaced generic seed attachments with deterministic, clearly fake certificate-style PDF fixtures (caste certificate, income certificate, degree transcript, admission offer, research proposal, passport). They are prominently marked DEMO ONLY and contain no real personal documents or government marks.
- **Limits:** Government service providers (PFMS, DigiLocker, NSP, MoTA) remain MOCK/DEMO only. The native PostgreSQL service was already running and was not cold-restarted; Docker startup was not exercised. The actual configured user database was not reset or altered.
