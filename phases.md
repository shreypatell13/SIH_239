# Development Roadmap & Sub-Phases — TribalScholar AI

**System:** TribalScholar AI (SIH Problem Statement 26239)  
**Roadmap Scope:** Phase 1 Design through Phase 2 Engineering  
**Document Status:** Baseline Approved (Phase 2 Step 1)  

---

## Roadmap Overview & Progress Matrix

| Phase / Sub-Phase | Focus Area | Status | Verified Acceptance |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Problem Understanding, Field Research & Solution Architecture | **COMPLETED** | System thesis, lifecycle model, and requirements defined |
| **Phase 2 — Step 1** | Project Context & Persistent Agent Memory | **COMPLETED** | 6 persistent context files created; Git repository initialized |
| **Phase 2A** | Engineering Foundation & Monorepo Tooling | *PENDING* | Ready to start |
| **Phase 2B** | Database Schemas & Domain Models | *PENDING* | Dependent on 2A |
| **Phase 2C** | Authentication & Role-Based Access Control (RBAC) | *PENDING* | Dependent on 2B |
| **Phase 2D** | Scheme Studio & Declarative Configuration Engine | *PENDING* | Dependent on 2B, 2C |
| **Phase 2E** | Applicant Dynamic Application Flow & Checklist | *PENDING* | Dependent on 2C, 2D |
| **Phase 2F** | Document Intelligence & Multilingual OCR Pipeline | *PENDING* | Dependent on 2B, 2E |
| **Phase 2G** | Deterministic Rules & Verification Engine | *PENDING* | Dependent on 2D, 2F |
| **Phase 2H** | Deficiency Management & Targeted Recheck Engine | *PENDING* | Dependent on 2E, 2G |
| **Phase 2I** | Officer Case Review Workspace & Split-Screen Evidence | *PENDING* | Dependent on 2G, 2H |
| **Phase 2J** | Operations Control Tower & Bottleneck Analytics | *PENDING* | Dependent on 2I |
| **Phase 2K** | Post-Selection Management & Renewal Workflows | *PENDING* | Dependent on 2I |
| **Phase 2L** | Integration Adapters & Security Hardening | *PENDING* | Dependent on 2I, 2J |
| **Phase 2M** | End-to-End Testing, Seed Data & Demo Readiness | *PENDING* | Dependent on 2A–2L |

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
- **Goal:** Set up the core development environment, project directory structure, TypeScript configurations, package managers, linting/formatting standards, and base scripts.
- **Major Features:**
  - Modern full-stack project structure (app router, server actions/API endpoints, shared libs).
  - TypeScript strict configuration, ESLint, Prettier, Tailwind CSS setup.
  - Test runner framework (Vitest / Playwright).
  - Environment variable validation with `.env.example`.
- **Dependencies:** Phase 2 Step 1 context established.
- **Acceptance Criteria:**
  - `npm run dev` (or equivalent) launches frontend/backend cleanly without errors.
  - `npm run test` executes a baseline test suite.
  - Zero TypeScript compile or lint errors.
- **Status:** *NOT STARTED*

---

### Phase 2B: Database Schemas & Domain Models
- **Goal:** Provision relational database models in PostgreSQL using type-safe ORM migrations to model the full case-management domain.
- **Major Features:**
  - Models: `User`, `Role`, `Scheme`, `SchemeVersion`, `Application`, `CaseDossier`, `Document`, `ExtractedField`, `RuleResult`, `Deficiency`, `AuditLog`, `PostSelectionRecord`.
  - Database migrations and connection pool setup.
  - Repository / data access layer for CRUD operations.
- **Dependencies:** Phase 2A.
- **Acceptance Criteria:**
  - Database migrations apply cleanly.
  - Seed script verifies relational integrity across models.
  - Unit tests confirm schema constraints and relationships.
- **Status:** *NOT STARTED*

---

### Phase 2C: Authentication & Role-Based Access Control (RBAC)
- **Goal:** Implement secure authentication and server-side RBAC for the four primary system actors.
- **Major Features:**
  - Role management: `APPLICANT`, `VERIFICATION_OFFICER`, `SCHEME_ADMIN`, `OPERATIONS_DIRECTOR`.
  - Secure credential hashing, session/JWT generation, and refresh mechanisms.
  - Route guards and server-side authorization middleware.
  - Demo login switcher for effortless hackathon demonstration.
- **Dependencies:** Phase 2B.
- **Acceptance Criteria:**
  - Users can register and log in according to their assigned role.
  - Unauthorized access to officer or admin routes is strictly blocked with HTTP 403.
  - Automated tests verify RBAC boundary enforcement.
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*

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
- **Status:** *NOT STARTED*
