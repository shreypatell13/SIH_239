# Development Roadmap & Sub-Phases — TribalScholar AI

**System:** TribalScholar AI (SIH Problem Statement 26239)  
**Roadmap Scope:** Phase 1 Design through Phase 2 Engineering  
**Document Status:** Baseline Approved (Phase 2 Step 1)

---

## Roadmap Overview & Progress Matrix

| Phase / Sub-Phase    | Focus Area                                                    | Status        | Verified Acceptance                                                                                                                                                              |
| :------------------- | :------------------------------------------------------------ | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1**          | Problem Understanding, Field Research & Solution Architecture | **COMPLETED** | System thesis, lifecycle model, and requirements defined                                                                                                                         |
| **Phase 2 — Step 1** | Project Context & Persistent Agent Memory                     | **COMPLETED** | 6 persistent context files created; Git repository initialized                                                                                                                   |
| **Phase 2A**         | Engineering Foundation & Monorepo Tooling                     | **COMPLETED** | Verified: Next.js 14, Prisma, Postgres Docker, Vitest (10/10), ESLint, Prettier                                                                                                  |
| **Phase 2B**         | Database Schemas & Domain Models                              | **COMPLETED** | Verified: 13 models, 13 enums, migration SQL, repositories, Vitest (18/18)                                                                                                       |
| **Phase 2C**         | Authentication & Role-Based Access Control (RBAC)             | **COMPLETED** | Verified: NextAuth v4 credentials, server-authoritative RBAC, unit (31/31), E2E (11/11)                                                                                          |
| **Phase 2D**         | Scheme Studio & Declarative Configuration Engine              | **COMPLETED** | Verified: Typed DSLs, Zod & Semantic validators, Scheme Studio UI, supersession, Vitest (52/52), Playwright (21/21)                                                              |
| **Phase 2E**         | Applicant Dynamic Application Flow & Checklist                | **COMPLETED** | Verified: Dynamic form wizard, document checklist, readiness engine, early dossier, Vitest (65/65), Playwright (26/26)                                                           |
| **Phase 2F**         | Document Intelligence & Multilingual OCR Pipeline             | **COMPLETED** | Verified: Tesseract.js multilingual OCR, field extractors, confidence model, sweep job, Vitest (83/83), Playwright (32/32)                                                       |
| **Phase 2G**         | Deterministic Rules & Verification Engine                     | **COMPLETED** | Verified: 11 DSL operators, ST relaxation, ambiguity routing, consistency engine, Vitest (104/104), Playwright (37/37)                                                           |
| **Phase 2I**         | Officer Case Review Workspace & Split-Screen Evidence         | **COMPLETED** | Verified: Split-screen workspace, bounding boxes, decision desk, Vitest (15/15), Playwright (7/7)                                                                                |
| **Phase 2J**         | Operations Control Tower & Bottleneck Analytics               | **COMPLETED** | Verified: Live DB analytics, bottleneck detection, drill-down, Vitest (18/18 files, 173/173 tests), Playwright (56/56)                                                           |
| **Phase 2K**         | Post-Selection Management & Renewal Workflows                 | **COMPLETED** | Verified: Scholar registry, multi-year renewals, mock PFMS disbursements, Vitest (20/20 files, 185/185 tests), Playwright (60/60)                                                |
| **Phase 2L**         | Integration Adapters & Security Hardening                     | **COMPLETED** | Verified: DigiLocker/PFMS/NSP/MoTA adapters, security headers, storage traversal guards, Vitest (22/22, 214 tests), Playwright (63/63)                                           |
| **Phase 2M**         | End-to-End Testing, Seed Data & Demo Readiness                | **COMPLETED** | 66/66 browser tests and 215/215 unit tests pass; both connected lifecycle journeys, fresh disposable database setup, demo rehearsal, and synthetic certificate fixtures verified |

---

## Detailed Sub-Phase Specifications

### Phase 1: Problem Research & Architectural Blueprint

- **Goal:** Analyze the scholarship/fellowship lifecycle for Scheduled Tribe applicants, study NFST and NOS scheme guidelines, and define an exception-driven case-orchestration platform.
- **Status:** Completed prior to Phase 2.

---

### Phase 2 — Step 1: Project Context & Persistent Agent Memory

- **Goal:** Establish a permanent, cross-agent context repository at root so different coding agents (Antigravity, Codex, etc.) can safely collaborate without context drift.
- **Major Deliverables:** `.cursorrules`, `PRD.md`, `architecture.md`, `design.md`, `phases.md`, `current-state.md`, Git initialization.
- **Status:** **COMPLETED** (Verified).

---

### Phase 2A: Engineering Foundation & Monorepo Tooling

- **Goal:** Set up the core development environment, project directory structure, TypeScript strict configuration, locked package dependencies, linting/formatting standards, Vitest test runner, and Docker Compose for PostgreSQL.
- **Major Features:**
  - Full-stack project structure using Next.js 14+ (App Router), React, and TypeScript Strict Mode.
  - Tailwind CSS (v3) and shadcn/ui component scaffolding.
  - ESLint, Prettier (with `prettier-plugin-tailwindcss`), and strict tsconfig.
  - Vitest configuration with sample unit test execution.
  - Docker Compose configuration (`docker-compose.yml`) for local PostgreSQL 15.
  - Environment variable validation with `.env.example`.
- **Dependencies:** Phase 2 Step 1 context established; Architecture Lock completed.
- **Acceptance Criteria:**
  - `npm run dev` launches the Next.js development server cleanly without errors.
  - `npm run test` executes a baseline test suite in Vitest.
  - Zero TypeScript compile or lint errors.
  - `docker-compose.yml` provides a reproducible PostgreSQL 15 service.
- **Status:** **COMPLETED** (Verified: Dev server, production build, Vitest 10/10 tests, ESLint, Prettier, Prisma push to PostgreSQL container on port 5433, all role routes returning 200).

---

### Phase 2B: Database Schemas & Domain Models (Prisma ORM)

- **Goal:** Provision relational database models in PostgreSQL using Prisma ORM migrations to model the full case-management domain.
- **Major Features:**
  - Prisma Schema (`prisma/schema.prisma`): 13 models (`User`, `ApplicantProfile`, `Scheme`, `SchemeVersion`, `Application`, `CaseDossier`, `Document`, `ExtractedField`, `RuleResult`, `Deficiency`, `AuditLog`, `PostSelectionRecord`, `SystemHealth`) and 13 enums (`UserRole`, `CaseStage`, `CaseState`, `ResponsibleActor`, `ApplicationStatus`, `DocumentType`, `ProcessingStatus`, `RuleOutcome`, `DeficiencyType`, `DeficiencyStatus`, `RecheckStatus`, `DisbursementStatus`, `ExtractorType`).
  - Canonical role rename: `VERIFICATION_OFFICER`, `SCHEME_ADMIN`, `OPERATIONS_DIRECTOR` (with `APPLICANT` preserved).
  - Versioning strategy: SchemeVersion immutability for applications; Document versions with `isLatestVersion` for upload audit history.
  - SQL migration generated in `prisma/migrations/20260928000000_phase_2b_domain/migration.sql`.
  - Repository layer under `src/server/repositories/` (`UserRepository`, `ApplicantRepository`, `SchemeRepository`, `CaseRepository`, `DocumentRepository`, `DeficiencyRepository`, `AuditRepository`).
  - Seed script in `prisma/seed.ts` covering demo personas, NFST, NOS, and initial version configurations.
  - Vitest test suite updated: 18 unit tests across 5 test suites.
- **Dependencies:** Phase 2A.
- **Acceptance Criteria:**
  - Database migration SQL generated cleanly.
  - Seed script created for relational integrity and demo schemas.
  - Unit tests confirm schema constraints, versioning, and RBAC contracts (18/18 tests pass).
- **Status:** **COMPLETED** (Verified)

---

### Phase 2C: Authentication & Role-Based Access Control (RBAC)

- **Goal:** Implement secure authentication and server-side RBAC for the four primary system actors.
- **Major Features:**
  - NextAuth.js v4 implementation with Credentials provider and JWT session strategy.
  - Role management: `APPLICANT`, `VERIFICATION_OFFICER`, `SCHEME_ADMIN`, `OPERATIONS_DIRECTOR`.
  - Secure bcrypt password hashing (cost factor 12) for all user credentials.
  - Server-authoritative layout guards with custom 403 Forbidden UI.
  - Edge-compatible route middleware protecting page groups against unauthenticated requests.
  - Protected API routes enforcing server-authoritative 401/403 responses.
  - One-click demo persona quick login for all 4 roles executing the normal NextAuth credentials pipeline.
  - Live session header indicators (`SessionNavUser`) and dynamic user identity display.
- **Dependencies:** Phase 2B.
- **Acceptance Criteria:**
  - Users can authenticate with credentials according to their server-assigned role.
  - Unauthorized access to officer, admin, or management routes is strictly blocked with HTTP 403 Forbidden UI.
  - Unauthenticated access to protected pages redirects to `/login`.
  - API routes return 401/403 JSON instead of HTML redirects.
  - Automated unit tests (31/31) and Playwright E2E tests (11/11) verify all RBAC boundaries.
- **Status:** **COMPLETED** (Verified)

---

### Phase 2D: Scheme Studio & Declarative Configuration Engine

- **Goal:** Enable declarative creation, editing, and versioning of scholarship schemes without hardcoded code changes.
- **Major Features:**
  - Strongly typed declarative DSLs for Form Schemas, Document Matrix, Eligibility Rules DSL, Workflow/SLA Config, and Selection/Quotas.
  - Two-layer validation engine: Structural (Zod) + Semantic (Business Rule integrity, duplicate ID detection, cross-section dependency verification).
  - Version immutability & atomic supersession via PostgreSQL transactions with comprehensive audit logging.
  - Admin Scheme Studio UI (`/admin/schemes`) featuring multi-tab visual configuration builder, validation inspector, and live JSON explorer.
  - Public scheme explorer APIs (`/api/schemes`, `/api/schemes/[code]/active`) providing clean summaries without internal threshold leakage.
- **Dependencies:** Phase 2B, Phase 2C.
- **Acceptance Criteria:**
  - Scheme definitions for NFST and NOS stored and retrieved from the database via Prisma ORM.
  - Schema updates generate new immutable version records while preserving previous version states.
  - Automated test coverage: 52 Vitest unit tests passing across 7 suites; 21 Playwright E2E tests passing.
- **Status:** **COMPLETED** (Verified)

---

### Phase 2E: Applicant Dynamic Application Flow & Checklist

- **Goal:** Provide a seamless, dynamic application journey for ST students applying for NFST or NOS with early dossier linkage and explainable status tracking.
- **Major Features:**
  - Candidate profile management with pre-fill capability (`/applicant/profile`).
  - Scheme comparison explorer and interactive 3-question eligibility pre-screener (`/applicant/schemes/[code]`).
  - Multi-step dynamic form wizard (`/applicant/applications/[id]`) with live auto-save and conditional visibility evaluation.
  - Document checklist matrix (`/applicant/applications/[id]/documents`) with client & server pre-flight validation, versioned document storage, and inline preview.
  - Pre-submission readiness engine (`/applicant/applications/[id]/readiness`) calculating blocking deficiencies and submission readiness score.
  - Atomic draft creation with early `CaseDossier` (CaseStage.DRAFT) and sequential tracking numbers (`APP-` & `CASE-`).
  - Explainable Case Status timeline tracker (`/applicant/applications/[id]/status`) presenting the 5-component transparent status model.
  - Atomic submission and withdrawal lifecycle with immutable audit logging.
- **Dependencies:** Phase 2C, Phase 2D.
- **Acceptance Criteria:**
  - Dynamic renderer consumes declarative FormSchema & DocumentRequirements without scheme hardcoding.
  - Candidate can create drafts, fill fields, upload certificates, verify readiness, and submit atomically.
  - Case state transitions to `SUBMITTED` / `CaseStage.INTAKE` with sequential case ID and audit log entry.
  - Automated test coverage: 65 Vitest unit tests passing across 8 suites; 26 Playwright E2E tests passing.
- **Status:** **COMPLETED** (Verified)

---

### Phase 2F: Document Intelligence & Multilingual OCR Pipeline

- **Goal:** Automate document classification, text extraction, key-value normalization, and cross-document consistency checks.
- **Major Features:**
  - Document classifier identifying certificate types (`DocumentClassifier`).
  - Multilingual OCR pipeline (Tesseract.js) extracting text and bounding box coordinates.
  - Key-value entity extraction for 6 certificate types (Caste, Income, Passport, Admission Offer, Degree Transcript, Research Proposal).
  - Background asynchronous sweep runner (`ocr-sweep.ts`) with retry backoff.
- **Dependencies:** Phase 2B, Phase 2E.
- **Acceptance Criteria:**
  - Uploaded sample certificates are accurately classified.
  - Extracted fields return structured JSON with confidence scores and page coordinates.
  - Cross-document discrepancies are flagged as review items, not fraud.
- **Status:** **COMPLETED** (Verified: Vitest 83/83, Playwright 32/32)

---

### Phase 2G: Deterministic Rules & Verification Engine

- **Goal:** Build the pure deterministic rule evaluation engine that checks scheme eligibility criteria against extracted evidence and form data.
- **Major Features:**
  - Pure deterministic evaluation of all 11 DSL operators without dynamic code execution or LLM dependencies.
  - Pinned `SchemeVersion` immutability enforcement.
  - ST category threshold relaxation engine (e.g. +5 years for age limit).
  - Ambiguity and low-confidence detection (confidence < 0.50 yields AMBIGUOUS, never FAIL).
  - Cross-document consistency verification (Unicode NFKC, honorific stripping, token Levenshtein similarity).
  - Interactive officer evaluation card component with explainable metrics.
- **Dependencies:** Phase 2D, Phase 2F.
- **Acceptance Criteria:**
  - Engine evaluates an application deterministically and outputs structured assessments (`ELIGIBLE_ASSESSED`, `NOT_ELIGIBLE_ASSESSED`, `REVIEW_REQUIRED`).
  - Rule results and evaluation runs persist in database with immutable audit logs.
  - Automated test coverage: 104 Vitest unit tests and 37 Playwright E2E tests passing.
- **Status:** **COMPLETED** (Verified)

---

### Phase 2H: Deficiency Management & Targeted Recheck Engine

- **Goal:** Implement the complete `Detect → Explain → Correct → Recheck → Resolve` innovation loop.
- **Major Features:**
  - Structured deficiency issuance with plain-English, non-accusatory explanations and deadlines.
  - Applicant remediation workspace allowing replacement document uploads and written clarifications.
  - Targeted recheck engine that extracts replacement documents and re-evaluates only affected rules.
  - Automated resolution clearance when corrected documents meet criteria, returning dossiers to `OFFICER_REVIEW`.
  - Officer manual resolution, waiver, and reopening with mandatory audit remarks.
- **Dependencies:** Phase 2E, Phase 2G.
- **Acceptance Criteria:**
  - Deficiencies issued by rules or officers appear with clear explainability on the applicant portal.
  - Applicant can resubmit the specific document or clarification; system re-evaluates and updates case state.
  - Automated test coverage: 120 Vitest unit tests and 43 Playwright E2E tests passing.
- **Status:** **IMPLEMENTED; REMEDIATION VERIFICATION INCOMPLETE** (2026-09-29: type-check, lint, format, and build pass; Vitest is blocked by sandbox access denial and database-backed E2E cannot use PostgreSQL at `localhost:5433`). Historical completion evidence above predates this remediation pass.

---

### Phase 2I: Officer Case Review Workspace & Split-Screen Evidence

- **Goal:** Deliver an ergonomic, high-throughput case review console for verification officers.
- **Major Features:**
  - Prioritized worklist sorted by SLA urgency and scheme.
  - Split-screen review UI (application fields + automated findings on left; high-res PDF viewer with bounding box evidence overlays on right).
  - One-click structured deficiency generator with pre-built templates.
  - Decision desk: Approve, Request Deficiency, Reject with mandatory audit remarks.
- **Dependencies:** Phase 2G, Phase 2H.
- **Acceptance Criteria:**
  - Officer can inspect evidence bounding boxes over actual uploaded documents.
  - Officer can record official decisions with state transitions and immutable audit logs.
- **Status:** **COMPLETED** (Verified: Split-screen workspace, document bounding boxes, decision desk, stage transitions, 15/15 Vitest tests, 7/7 Playwright tests).

---

### Phase 2J: Operations Control Tower & Bottleneck Analytics

- **Goal:** Provide authorized management users with a database-backed operational view of case stages, age, workload, deficiencies, and explainable bottleneck triggers.
- **Major Features:**
  - Operations Director-only overview, bottleneck, and paginated case-list APIs.
  - Database-backed KPI summary, current stage distribution, analytical aging buckets, and stage dwell calculations.
  - Deterministic bottleneck triggers with measured inputs, thresholds, explanations, and case-list drill-downs.
  - Officer workload and generic scheme summaries, without officer performance scoring.
  - Deficiency grouping by scheme/type/document with open/resolved counts and affected-case totals.
  - PII-minimized case-list drill-down with stage, state, age, assignment, deficiency, and category filters.
- **Dependencies:** Phase 2I.
- **Acceptance Criteria:**
  - Type-check, lint, formatting, and production build pass.
  - Database-backed role, analytics, drill-down, and Phase 2I regression tests pass in an environment with the configured PostgreSQL seed data.
- **Status:** **COMPLETED** (Verified: 100% database-backed analytics, 18/18 Vitest test suites / 173 tests passing, 56/56 Playwright E2E tests passing, Next.js production build passing).

---

### Phase 2K: Post-Selection Management & Renewal Workflows

- **Goal:** Support selected scholars through multi-year fellowship tracking and renewals.
- **Major Features:**
  - Selected scholar master registry for NFST and NOS awardees with searchable/filterable listings.
  - Periodic academic progress report submission portal with supervisor recommendations and marksheets.
  - Authoritative human officer adjudication desk for renewals (Approve, Deficiency, Reject) with transactional audit trail.
  - Multi-year disbursement installment schedule with simulated PFMS credit tracking and synthetic reference generation.
  - Comprehensive 5-tab scholar detail workspace with profile, renewal history, disbursement breakdown, uploaded documents, and full audit logs.
- **Dependencies:** Phase 2I, Phase 2J.
- **Acceptance Criteria:**
  - Selected applicant transitions into a verified Scholar record with multi-year tenure.
  - Scholar can upload progress reports; officers can adjudicate fellowship continuation.
  - Installment disbursements can be updated with simulated PFMS credit states and transaction IDs.
  - Server-authoritative RBAC guarantees strict tenant and role separation.
  - All unit/integration (185/185) and E2E (60/60) test suites pass cleanly against live database.
- **Status:** **COMPLETED** (Verified: Scholar registry, multi-year renewals, mock PFMS disbursements, Vitest 20/20 files / 185 tests, Playwright 60/60 tests).

---

### Phase 2L: Integration Adapters & Security Hardening

- **Goal:** Implement robust adapter interfaces for external government systems and enforce production-grade security standards.
- **Major Features:**
  - Decoupled typed adapter interfaces (`IDigiLockerAdapter`, `IPfmsAdapter`, `INspAdapter`, `IMotaAdapter`) and deterministic mock implementations with simulation hooks for timeout/unavailable/malformed errors.
  - Centralized `IntegrationRegistry` and protected health check API (`/api/integrations/health`) with responsive UI status indicators in the Operations Control Tower.
  - Hardened HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP) in `next.config.mjs`.
  - Storage path traversal containment (`LocalStorageAdapter.resolveSafePath`) strictly preventing directory escape.
  - PII masking and sanitized audit logging (`security-sanitizer.ts`) scrubbing Aadhaar numbers, bank accounts, tokens, and database credentials from logs and error messages.
- **Dependencies:** Phase 2I, Phase 2J, Phase 2K.
- **Acceptance Criteria:**
  - External adapters return realistic synthetic verification/disbursement states without breaking when offline.
  - Storage adapter rejects path traversal attempts.
  - Security headers are properly applied across routes.
  - All automated test suites pass cleanly (Vitest 22/22 suites, 214 tests; Playwright 63/63 tests).
- **Status:** **COMPLETED** (Verified: DigiLocker/PFMS/NSP/MoTA adapters, security headers, storage traversal guards, Vitest 22/22 files / 214 tests, Playwright 63/63 tests).

---

### Phase 2M: End-to-End Testing, Seed Data & Demo Readiness

- **Goal:** Polish the system with realistic synthetic ST applicant personas, execute end-to-end tests, and prepare seamless hackathon demonstration flows.
- **Major Features:**
  - Idempotent synthetic demo seed for all four existing roles, NFST/NOS, application/case records, deficiency, officer assignment, scholar renewals, and mock disbursements.
  - Stable mock integration identifiers, protected seeded PDF preview, and applicant correction/recheck/manual resolution E2E coverage.
  - Root `README.md` documents PostgreSQL, migrations, seed, app startup, personas, walkthrough, and reset commands.
- **Dependencies:** Phase 2A through Phase 2L.
- **Acceptance Criteria:**
  - Type-check, lint, formatting, schema validation, production build, unit/integration, and Playwright suites pass.
  - Seed can be re-run and restores demo-owned records without deleting unrelated scheme history.
  - A complete browser journey from application submission through OCR/eligibility/decision and post-selection renewal/disbursement is exercised.
  - Realistic synthetic certificate examples and a timed full demo rehearsal are provided.
- **Status:** **COMPLETED & VERIFIED** (2026-09-29). Fresh disposable PostgreSQL database migration/seed/reset, production application startup, persona login/main routes, type-check, lint, format, Prisma validation, build (31 routes), Vitest (22 files/215 tests), and Playwright (66/66) passed. Two connected browser journeys cover applicant submission/OCR/decision and seeded scholar renewal/disbursement/audit. The seed now contains visibly marked synthetic certificate-style PDFs. Timed active browser rehearsal was approximately 16 seconds. Government providers remain MOCK/DEMO. The existing native PostgreSQL service was already running and was not cold-restarted; Docker startup was not exercised.
