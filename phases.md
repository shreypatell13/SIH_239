# Development Roadmap & Sub-Phases — TribalScholar AI

**System:** TribalScholar AI (SIH Problem Statement 26239)  
**Roadmap Scope:** Phase 1 Design through Phase 2 Engineering  
**Document Status:** Baseline Approved (Phase 2 Step 1)

---

## Roadmap Overview & Progress Matrix

| Phase / Sub-Phase    | Focus Area                                                    | Status        | Verified Acceptance                                                             |
| :------------------- | :------------------------------------------------------------ | :------------ | :------------------------------------------------------------------------------ |
| **Phase 1**          | Problem Understanding, Field Research & Solution Architecture | **COMPLETED** | System thesis, lifecycle model, and requirements defined                        |
| **Phase 2 — Step 1** | Project Context & Persistent Agent Memory                     | **COMPLETED** | 6 persistent context files created; Git repository initialized                  |
| **Phase 2A**         | Engineering Foundation & Monorepo Tooling                     | **COMPLETED** | Verified: Next.js 14, Prisma, Postgres Docker, Vitest (10/10), ESLint, Prettier |
| **Phase 2B**         | Database Schemas & Domain Models                              | **COMPLETED** | Verified: 13 models, 13 enums, migration SQL, repositories, Vitest (18/18)      |
| **Phase 2C**         | Authentication & Role-Based Access Control (RBAC)             | _PENDING_     | Dependent on 2B                                                                 |
| **Phase 2D**         | Scheme Studio & Declarative Configuration Engine              | _PENDING_     | Dependent on 2B, 2C                                                             |
| **Phase 2E**         | Applicant Dynamic Application Flow & Checklist                | _PENDING_     | Dependent on 2C, 2D                                                             |
| **Phase 2F**         | Document Intelligence & Multilingual OCR Pipeline             | _PENDING_     | Dependent on 2B, 2E                                                             |
| **Phase 2G**         | Deterministic Rules & Verification Engine                     | _PENDING_     | Dependent on 2D, 2F                                                             |
| **Phase 2H**         | Deficiency Management & Targeted Recheck Engine               | _PENDING_     | Dependent on 2E, 2G                                                             |
| **Phase 2I**         | Officer Case Review Workspace & Split-Screen Evidence         | _PENDING_     | Dependent on 2G, 2H                                                             |
| **Phase 2J**         | Operations Control Tower & Bottleneck Analytics               | _PENDING_     | Dependent on 2I                                                                 |
| **Phase 2K**         | Post-Selection Management & Renewal Workflows                 | _PENDING_     | Dependent on 2I                                                                 |
| **Phase 2L**         | Integration Adapters & Security Hardening                     | _PENDING_     | Dependent on 2I, 2J                                                             |
| **Phase 2M**         | End-to-End Testing, Seed Data & Demo Readiness                | _PENDING_     | Dependent on 2A–2L                                                              |

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
  - Declarative JSON schema models for **NFST** and **NOS**.
  - Dynamic field definitions (academic history, caste verification, income details, passport, foreign offer).
  - Document requirement matrices (file constraints, validity thresholds).
  - Admin Scheme Studio UI to inspect and manage scheme parameters.
- **Dependencies:** Phase 2B, Phase 2C.
- **Acceptance Criteria:**
  - Scheme definitions for NFST and NOS stored and retrieved from the database.
  - Schema updates generate new version records while preserving active application states.
- **Status:** _NOT STARTED_

---

### Phase 2E: Applicant Dynamic Application Flow & Checklist

- **Goal:** Provide a seamless, dynamic application journey for ST students applying for NFST or NOS.
- **Major Features:**
  - Scheme comparison cards and 3-question eligibility pre-screener.
  - Dynamic form wizard rendered from scheme JSON schema.
  - Document checklist with drag-and-drop upload and client-side pre-flight checks.
  - Readiness indicator score summarizing completeness.
  - Application draft saving, final submission, and explainable status tracker.
- **Dependencies:** Phase 2C, Phase 2D.
- **Acceptance Criteria:**
  - An applicant can select NFST or NOS, fill in all dynamic fields, upload required certificates, and submit.
  - Case state transitions to `SUBMITTED` with a generated Case ID and audit log entry.
- **Status:** _NOT STARTED_

---

### Phase 2F: Document Intelligence & Multilingual OCR Pipeline

- **Goal:** Automate document classification, text extraction, key-value normalization, and cross-document consistency checks.
- **Major Features:**
  - Document classifier identifying certificate types.
  - Multilingual OCR pipeline extracting text and bounding box coordinates.
  - Key-value entity extraction (Name, DOB, Caste, Income, Roll No, University).
  - Cross-document entity matcher (phonetic/fuzzy matching across certificates to spot discrepancies).
- **Dependencies:** Phase 2B, Phase 2E.
- **Acceptance Criteria:**
  - Uploaded sample certificates are accurately classified.
  - Extracted fields return structured JSON with page coordinates and confidence scores.
  - Cross-document discrepancies (e.g., minor name spelling differences) are flagged as review items, not fraud.
- **Status:** _NOT STARTED_

---

### Phase 2G: Deterministic Rules & Verification Engine

- **Goal:** Build the rule evaluation engine that checks deterministic eligibility criteria against extracted evidence and form data.
- **Major Features:**
  - Rule evaluation for age limits (with ST relaxation), income ceilings (≤ ₹8 Lakhs for NOS), minimum percentage, caste certificate authenticity indicators.
  - Synthesis of deterministic rules + AI extraction confidence into an aggregated verification report.
  - Creation of visual evidence cards anchoring extracted values to document pages.
- **Dependencies:** Phase 2D, Phase 2F.
- **Acceptance Criteria:**
  - Engine evaluates an application and outputs structured findings (Pass, Deficient, Ambiguous).
  - Evidence cards store coordinates for visual rendering in the officer workspace.
- **Status:** _NOT STARTED_

---

### Phase 2H: Deficiency Management & Targeted Recheck Engine

- **Goal:** Implement the complete `Detect → Explain → Correct → Recheck → Resolve` innovation loop.
- **Major Features:**
  - Structured deficiency issuance with clear explanations and deadlines.
  - Applicant remediation workspace allowing re-upload of specific flagged documents.
  - Targeted recheck engine that evaluates only updated documents and dependent rules.
  - Automated resolution clearance when corrected documents meet criteria.
- **Dependencies:** Phase 2E, Phase 2G.
- **Acceptance Criteria:**
  - Deficiencies issued by rules or officers appear with clear explainability on the applicant portal.
  - Applicant can resubmit the specific document; system re-evaluates only that document and updates case state.
- **Status:** _NOT STARTED_

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
- **Status:** _NOT STARTED_

---

### Phase 2J: Operations Control Tower & Bottleneck Analytics

- **Goal:** Provide senior leadership with complete operational observability over scheme health and processing pipelines.
- **Major Features:**
  - High-level KPI summary cards (applications, clearance rate, average TAT, active deficiencies).
  - Funnel analysis highlighting stage-wise bottlenecks.
  - Officer workload and productivity tracking.
  - Recurring deficiency heatmap categorized by scheme and state/region.
- **Dependencies:** Phase 2I.
- **Acceptance Criteria:**
  - Control Tower aggregates live database metrics into clear, responsive charts and tables.
  - Bottlenecks and recurring deficiency patterns are immediately identifiable.
- **Status:** _NOT STARTED_

---

### Phase 2K: Post-Selection Management & Renewal Workflows

- **Goal:** Support selected scholars through multi-year fellowship tracking and renewals.
- **Major Features:**
  - Selected scholar master registry for NFST and NOS awardees.
  - Periodic academic progress report submission portal.
  - Supervisor recommendation verification.
  - Disbursement milestone tracking with simulated PFMS credit status.
- **Dependencies:** Phase 2I.
- **Acceptance Criteria:**
  - Selected applicant transitions into a verified Scholar record.
  - Scholar can upload progress reports; officers can approve fellowship continuation.
- **Status:** _NOT STARTED_

---

### Phase 2L: Integration Adapters & Security Hardening

- **Goal:** Implement robust adapter interfaces for external government systems and enforce production-grade security standards.
- **Major Features:**
  - DigiLocker adapter (mocked with realistic document verification payloads).
  - PFMS adapter (mocked with payment sanction and DBT disbursement records).
  - NSP adapter (mocked with deduplication checks).
  - Rate limiting, CSP headers, sanitized inputs, encrypted storage abstractions.
  - Comprehensive audit trail integrity verification.
- **Dependencies:** Phase 2I, Phase 2J.
- **Acceptance Criteria:**
  - External adapters return realistic synthetic verification/disbursement states without breaking when offline.
  - Security audit passes without high-severity vulnerabilities.
- **Status:** _NOT STARTED_

---

### Phase 2M: End-to-End Testing, Seed Data & Demo Readiness

- **Goal:** Polish the system with realistic synthetic ST applicant personas, execute end-to-end tests, and prepare seamless hackathon demonstration flows.
- **Major Features:**
  - Comprehensive synthetic dataset with realistic ST applicant personas for NFST and NOS (compliant, deficient, edge-case personas).
  - Realistic mock certificates (Caste, Income, University Admission, Passport).
  - Automated end-to-end test suite verifying the complete innovation loop.
  - Live demo walkthrough script covering Applicant, Officer, Scheme Studio, and Control Tower roles.
- **Dependencies:** Phase 2A through Phase 2L.
- **Acceptance Criteria:**
  - All automated tests pass cleanly.
  - A complete demo journey from application to approval and post-selection executes smoothly in under 5 minutes.
- **Status:** _NOT STARTED_
