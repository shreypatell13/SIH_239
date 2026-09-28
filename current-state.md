# Live Project State — TribalScholar AI

**Project:** TribalScholar AI (SIH Problem Statement 26239)
**Last updated:** 2026-09-29

## Current status

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2J Operations Control Tower & Bottleneck Analytics is **COMPLETED & VERIFIED**; Phase 2K has not started.
- **Last stable commit:** `ade3013 feat(phase-2j): implement operations control tower analytics`
- **Working tree:** Contains uncommitted Phase 2I/2J work and verification updates. Do not reset or discard it.
- **Schema:** PostgreSQL schema with 13 models and 13 enums on port `5433` (DB: `tribalscholar_db`). No schema change was needed for Phase 2J.

## Verification on 2026-09-29

- **PostgreSQL Database:** UTF-8 cluster initialized and running on port `5433`. Seeded with all 4 demo personas, 3 schemes (NFST, NOS, ST-OBC), 4 versions, 2 submitted applications, 2 case dossiers, 1 deficiency, and 5 documents.
- `npm run type-check`: **PASS** (0 errors).
- `npm run lint`: **PASS** (0 warnings or errors).
- `npm run format:check`: **PASS** (100% Prettier compliant).
- `npm run build`: **PASS** (Next.js production build succeeded cleanly; 25/25 routes generated).
- `npm test` (Vitest): **PASS** (**18/18 test suites, 173/173 tests passing** cleanly).
- `npm run test:e2e` (Playwright): **PASS** (**56/56 E2E tests passing** across Chromium).

## Phase state

- **2A–2G:** **COMPLETED & VERIFIED**.
- **2H:** **COMPLETED & VERIFIED** (Deficiency management, applicant resolution workflow, targeted recheck).
- **2I:** **COMPLETED & VERIFIED** (Officer review workspace, split-screen PDF evidence viewer, bounding boxes, decision desk, transition endpoints).
- **2J:** **COMPLETED & VERIFIED** (Operations Control Tower, live database-backed analytics, 9-stage distribution, deterministic aging cohorts, explainable bottleneck diagnosis, deficiency heatmaps, officer workload, scheme operations summaries, PII-minimized drill-down, and direct Phase 2I case deep-linking).
- **2K–2M:** **NOT STARTED**.

## Phase 2J Highlights

- **Access Control:** Server-side RBAC restricted strictly to `OPERATIONS_DIRECTOR` with layout-level and route-level protection.
- **Data Model:** Zero mock analytics; queries aggregate live `CaseDossier`, `Application`, `Deficiency`, `Scheme`, and `User` models via `OperationsAnalyticsRepository`.
- **Aging & Stage Dwell:** Deterministic age calculation using standard cohorts (`0–2d`, `3–7d`, `8–14d`, `15+d`) and stage dwell durations.
- **Bottlenecks:** Rule-based bottleneck detection based on empirical backlog thresholds and dwell duration triggers.
- **Drill-Down Drawer:** Real-time filterable drawer allowing directors to inspect cases matching specific criteria and jump directly to the Phase 2I Officer Workspace (`/officer/cases/[id]`).

