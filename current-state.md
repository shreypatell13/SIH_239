# Live Project State — TribalScholar AI

**Project:** TribalScholar AI (SIH Problem Statement 26239)
**Last updated:** 2026-09-29

## Current status

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2L Integration Adapters & Security Hardening is **COMPLETED & VERIFIED**; Phase 2M has not started.
- **Last stable commit:** `00534cf feat(phase-2k): implement post-selection renewal workflows`
- **Working tree:** Phase 2L completed.
- **Schema:** PostgreSQL schema with 15 models and 16 enums on port `5433` (DB: `tribalscholar_db`).

## Verification on 2026-09-29

- **PostgreSQL Database:** UTF-8 cluster running on port `5433`. Seeded with demo personas, schemes, applications, case dossiers, post-selection scholar records, multi-year annual renewals, and simulated PFMS disbursement records.
- `npm run type-check`: **PASS** (0 errors).
- `npm run lint`: **PASS** (0 warnings or errors).
- `npm run format:check`: **PASS** (100% Prettier compliant).
- `npm run build`: **PASS** (Next.js production build succeeded cleanly; 31/31 routes generated).
- `npm test` (Vitest): **PASS** (**22/22 test suites, 214/214 tests passing** cleanly).
- `npm run test:e2e` (Playwright): **PASS** (**63/63 E2E tests passing** across Chromium).

## Phase state

- **2A–2G:** **COMPLETED & VERIFIED**.
- **2H:** **COMPLETED & VERIFIED** (Deficiency management, applicant resolution workflow, targeted recheck).
- **2I:** **COMPLETED & VERIFIED** (Officer review workspace, split-screen PDF evidence viewer, bounding boxes, decision desk, transition endpoints).
- **2J:** **COMPLETED & VERIFIED** (Operations Control Tower, live database-backed analytics, 9-stage distribution, deterministic aging cohorts, explainable bottleneck diagnosis, deficiency heatmaps, officer workload, scheme operations summaries, PII-minimized drill-down, and direct Phase 2I case deep-linking).
- **2K:** **COMPLETED & VERIFIED** (Post-Selection Scholar Master Registry, Annual Renewal Workflows, Progress Report Submission, Authoritative Officer Adjudication, Mock PFMS Disbursement Milestones, Post-Selection Management Console `/post-selection` and Scholar Drill-Down Workspace `/post-selection/[id]`).
- **2L:** **COMPLETED & VERIFIED** (Integration Adapters for DigiLocker, PFMS, NSP, and MoTA; Safe Mock/Demo Providers; Integration Health & Status API `/api/integrations/health`; Security Hardening: Security Headers, Storage Path Traversal Prevention, PII/Audit Redaction, Magic-Byte File Validation).
- **2M:** **NOT STARTED**.

## Phase 2L Highlights

- **Integration Adapter Boundaries:** Cleanly typed, decoupled adapter interfaces (`IDigiLockerAdapter`, `IPfmsAdapter`, `INspAdapter`, `IMotaAdapter`) and deterministic mock implementations with simulation triggers for timeouts, outages, and malformed payloads.
- **Integration Registry & Health API:** Centralized `IntegrationRegistry` and protected `GET /api/integrations/health` endpoint returning sanitized health status across all adapters without leaking credentials or internal URLs.
- **Security Hardening & Headers:** Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and CSP headers in `next.config.mjs`.
- **Storage & Path Traversal Containment:** Hardened `LocalStorageAdapter` with `resolveSafePath` ensuring strict directory containment and blocking path traversal attempts.
- **PII Masking & Sanitized Auditing:** Centralized `security-sanitizer.ts` masking Aadhaar numbers (`XXXX-XXXX-1234`), bank accounts (`XXXX-XXXX-4921`), and redacting secrets/passwords/tokens from audit payloads and errors.
