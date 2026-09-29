# Live Project State — TribalScholar AI

**Project:** TribalScholar AI (SIH Problem Statement 26239)
**Last updated:** 2026-09-29

## Current status

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2K Post-Selection Management & Renewal Workflows is **COMPLETED & VERIFIED**; Phase 2L has not started.
- **Last stable commit:** `b594cf7 fix(phase-2j): verify operations control tower and full e2e suite against postgres`
- **Working tree:** Phase 2K completed.
- **Schema:** PostgreSQL schema with 15 models and 16 enums on port `5433` (DB: `tribalscholar_db`). Models added: `ScholarRenewal`, `DisbursementRecord`; enums added: `RenewalStatus`, `ScholarStatus`, `DisbursementRecordStatus`.

## Verification on 2026-09-29

- **PostgreSQL Database:** UTF-8 cluster running on port `5433`. Seeded with demo personas, schemes, applications, case dossiers, post-selection scholar records, multi-year annual renewals, and simulated PFMS disbursement records.
- `npm run type-check`: **PASS** (0 errors).
- `npm run lint`: **PASS** (0 warnings or errors).
- `npm run format:check`: **PASS** (100% Prettier compliant).
- `npm run build`: **PASS** (Next.js production build succeeded cleanly; 30/30 routes generated).
- `npm test` (Vitest): **PASS** (**20/20 test suites, 185/185 tests passing** cleanly).
- `npm run test:e2e` (Playwright): **PASS** (**60/60 E2E tests passing** across Chromium).

## Phase state

- **2A–2G:** **COMPLETED & VERIFIED**.
- **2H:** **COMPLETED & VERIFIED** (Deficiency management, applicant resolution workflow, targeted recheck).
- **2I:** **COMPLETED & VERIFIED** (Officer review workspace, split-screen PDF evidence viewer, bounding boxes, decision desk, transition endpoints).
- **2J:** **COMPLETED & VERIFIED** (Operations Control Tower, live database-backed analytics, 9-stage distribution, deterministic aging cohorts, explainable bottleneck diagnosis, deficiency heatmaps, officer workload, scheme operations summaries, PII-minimized drill-down, and direct Phase 2I case deep-linking).
- **2K:** **COMPLETED & VERIFIED** (Post-Selection Scholar Master Registry, Annual Renewal Workflows, Progress Report Submission, Authoritative Officer Adjudication, Mock PFMS Disbursement Milestones, Post-Selection Management Console `/post-selection` and Scholar Drill-Down Workspace `/post-selection/[id]`).
- **2L–2M:** **NOT STARTED**.

## Phase 2K Highlights

- **Scholar Master Registry:** Seamless conversion/enrollment of awarded scholarship cases into active post-selection scholar records (`PostSelectionRecord`), retaining relational links to `CaseDossier`, `ApplicantProfile`, and `SchemeVersion`.
- **Annual Renewal Workflow:** Multi-year cycle tracking (`UPCOMING`, `SUBMITTED`, `UNDER_REVIEW`, `DEFICIENT`, `APPROVED`, `REJECTED`, `COMPLETED`) with scholar progress reporting and supervisor endorsements.
- **Authoritative Review Desk:** Human officer verification is strictly authoritative; zero autonomous AI approvals. Supports Approve, Deficiency, and Reject with mandatory audit remarks.
- **Simulated PFMS DBT:** Multi-installment grant tracking with synthetic batch references, payment status (`PAID`, `PROCESSING`, `PENDING`, `HELD`), and timestamped disbursement logs.
- **Console & Workspace:** Accessible at `/post-selection` and `/post-selection/[id]` with real-time KPI aggregations, filterable registry, renewals desk, disbursement management, and full audit trail.
