# Technical Architecture — TribalScholar AI

**System:** TribalScholar AI (SIH Problem Statement 26239)  
**Architecture Style:** Modular Case-Centric Service Architecture  
**Status:** Target Architecture Specification (Phase 2 Step 1)

---

## 1. High-Level Architecture Overview

TribalScholar AI is structured around an event-aware, case-centric orchestrator that decouples user interfaces, workflow states, declarative rule engines, and document intelligence services.

```
       +-----------------------------------------------------------------+
       |                          Client Layer                           |
       |  Applicant Portal | Officer Workspace | Scheme Studio | Tower   |
       +-----------------------------------------------------------------+
                                       |
                                       v  (HTTPS / REST / JSON)
       +-----------------------------------------------------------------+
       |                        Backend API Layer                        |
       |         Auth & RBAC | API Gateway | Input Validation            |
       +-----------------------------------------------------------------+
                                       |
                                       v
       +-----------------------------------------------------------------+
       |                     Case & Workflow Engine                      |
       |      State Machine | Case Dossier Orchestrator | SLA Tracker    |
       +-----------------------------------------------------------------+
                         /                             \
                        v                               v
       +--------------------------------+   +----------------------------+
       |     Rules / Config Engine      |   |   AI / Document Service    |
       | - Dynamic Schemas (Scheme JSON)|   | - OCR & Text Extraction    |
       | - Deterministic Rule Evaluator |   | - Classification           |
       | - Eligibility Validation       |   | - Key-Value Entity Extr.   |
       +--------------------------------+   | - Cross-Doc Consistency    |
                        \                   +----------------------------+
                         \                                |
                          \                               v
                           \                 +---------------------------+
                            \--------------->|    Evidence & Findings    |
                                             +---------------------------+
                                                          |
                                                          v
       +-----------------------------------------------------------------+
       |                        Persistence Tier                         |
       |   PostgreSQL Database   |   Document Storage   |  Audit Trail   |
       |  (Relational Entities)  |    (Encrypted Blobs) |  (Append-Only) |
       +-----------------------------------------------------------------+
                                       |
                                       v
       +-----------------------------------------------------------------+
       |                  External System Adapters (Mock)                |
       |   DigiLocker Adapter    |   PFMS Adapter    |   NSP Adapter     |
       +-----------------------------------------------------------------+
```

---

## 2. Core Architectural Principles

1. **Case-Centric Architecture:**
   - Every scholarship application is encapsulated in a unified, stateful Case Dossier.
   - The case aggregates applicant demographics, submitted documents, OCR tokens, extracted entities, deterministic rule results, AI-assisted finding cards, officer review logs, and deficiency notices.

2. **Configurable Scheme Logic (Declarative Policy):**
   - No scheme rules or document mandates are hardcoded in application logic.
   - Scheme configurations specify dynamic form fields, required document types, validity rules, and eligibility logic via structured schema definitions (JSON Schema / declarative rulesets).

3. **Evidence-Linked Verification:**
   - Extracted data points are anchored to visual and textual coordinates (page number, bounding box polygon, snippet text).
   - The UI overlays verification evidence directly on the document viewer so human officers can confirm source truth in seconds.

4. **Exception-Driven Workflow:**
   - Compliant cases advance through streamlined checkpoints.
   - Ambiguities, expired documents, or field mismatches trigger isolated exception states, generating structured deficiency tickets rather than unrecoverable rejections.

5. **Human-in-the-Loop (HITL) Adjudication:**
   - Automated components generate findings, risk scores, and recommendation summaries.
   - Approvals, conditional approvals, formal deficiencies, and rejections strictly require an authenticated officer's digital confirmation and audit reasoning.

6. **Explainable Status Model:**
   - Every case maintains a machine- and human-readable composite status:
     `{ stage: string, state: string, blocker: string | null, responsible_actor: string, next_action: string }`.

7. **Adapter-Based External Integrations:**
   - External dependencies (DigiLocker verification, PFMS grant disbursement, National Scholarship Portal de-duplication) are isolated behind strict adapter interfaces.
   - Stubs and synthetic mock services simulate external API responses during development and demonstrations.

8. **Security, Least Privilege & Tamper-Evident Auditability:**
   - Server-enforced Role-Based Access Control (RBAC).
   - Document files are stored securely with pre-signed ephemeral access URLs.
   - All state transitions, officer decisions, and automated evaluations write to an append-only, immutable audit table.

---

## 3. Component Responsibilities

### 3.1 Client Layer (Web Application)

- **Applicant Portal:** Scheme explorer, eligibility pre-check, dynamic form rendering, client-side pre-flight file validation, live status tracker, deficiency resolution console.
- **Officer Workspace:** Triage queue, split-screen case review interface (data fields on left, high-res PDF/image viewer with interactive evidence highlights on right), deficiency generator, decision recording desk.
- **Scheme Studio (Admin):** Form schema editor, document requirement builder, rule parameter configurator (income limits, academic score thresholds, quotas).
- **Operations Control Tower:** Real-time analytics, SLA tracking, processing pipeline bottlenecks, officer workload distribution, recurring deficiency heatmaps.

### 3.2 Backend API & Security Layer

- **API Gateway & Routing:** Clean RESTful endpoints organized by domain (`/api/v1/auth`, `/api/v1/schemes`, `/api/v1/applications`, `/api/v1/cases`, `/api/v1/documents`, `/api/v1/officer`, `/api/v1/analytics`).
- **Authentication & RBAC:** Session/JWT-based authentication with cryptographically signed tokens. Strict server-side middleware verifying user role (`APPLICANT`, `VERIFICATION_OFFICER`, `SCHEME_ADMIN`, `OPERATIONS_DIRECTOR`).
- **Input Validation:** Rigorous runtime schema validation (Zod / Pydantic) on every incoming payload before passing to business logic.

### 3.3 Case & Workflow Engine

- **State Machine:** Orchestrates valid state transitions (`DRAFT` → `SUBMITTED` → `AUTOMATED_CHECK` → `IN_OFFICER_REVIEW` → `DEFICIENT` → `RESUBMITTED` → `APPROVED` / `REJECTED`).
- **Targeted Recheck Dispatcher:** When an applicant resolves a specific deficiency, only invalid downstream checks are invalidated, preventing redundant re-processing.
- **SLA & Escalation Manager:** Tracks days in current stage against scheme-level SLAs and raises visual flags in the Control Tower.

### 3.4 Rules & Configuration Engine

- **Declarative Schema Evaluator:** Parses scheme JSON definitions and validates application form inputs against scheme parameters.
- **Deterministic Rule Runner:** Evaluates hard quantitative criteria:
  - Age calculation vs cutoff date
  - Annual family income vs scheme ceiling (e.g., ≤ ₹8 Lakhs for NOS)
  - Qualifying academic percentage vs minimum cutoff
  - Category verification (Scheduled Tribe certificate authenticity indicators)
  - Foreign university ranking tier checks (for NOS)

### 3.5 AI & Document Intelligence Service

- **Classification Pipeline:** Analyzes uploaded files and classifies them into expected document types.
- **OCR & Field Extraction:** Extracts key textual entities (applicant name, father's name, DOB, certificate number, issue date, issuing authority, income figure, university name).
- **Cross-Document Consistency Engine:** Executes phonetic (Soundex/Metaphone) and fuzzy string distance (Levenshtein/Jaro-Winkler) matching across certificates to detect spelling discrepancies (e.g., "Ramesh Kumar Meena" vs "Ramesh K. Meena") without categorizing non-standard transliterations as fraud.
- **Evidence Anchor Generator:** Records coordinate boxes `[x, y, width, height, page]` for each extracted field to enable visual evidence overlays in the officer viewer.

### 3.6 Persistence Tier

- **PostgreSQL Database:** Primary relational data store for structured entities:
  - `users`, `roles`, `schemes`, `applications`, `cases`, `documents`, `extracted_fields`, `rule_results`, `deficiencies`, `audit_events`.
- **Document / Blob Storage:** Secure file store (local filesystem abstraction or object storage) storing encrypted raw uploads and thumbnail previews.
- **Audit Log Engine:** Append-only log capturing `case_id`, `actor_id`, `actor_role`, `action_type`, `previous_state`, `new_state`, `payload_diff`, and `timestamp`.

---

## 4. Current vs Target Repository Architecture

- **Current Repository State:** Fresh workspace initialized in Phase 2 Step 1. Baseline persistent context files established.
- **Locked Engineering Stack (Phase 2A Architecture Lock):**
  - **Frontend Framework:** Next.js 14+ (App Router with React Server Components)
  - **Frontend Language:** TypeScript (Strict Mode)
  - **Styling System:** Tailwind CSS (v3)
  - **UI Component Strategy:** shadcn/ui architecture (Radix UI primitives + Lucide Icons)
  - **Backend / API Architecture:** Next.js Route Handlers (`src/app/api/...`) with decoupled Domain Services (`src/server/services/...`)
  - **Database:** PostgreSQL (v15+)
  - **ORM / Data Access Layer:** Prisma ORM (Locked: single declarative `schema.prisma`, type-safe client, built-in migrations, Prisma Studio)
  - **Validation:** Zod (runtime validation and TypeScript schema inference)
  - **Authentication / Session:** NextAuth.js (Auth.js) with JWT session strategy and role switcher for demo personas (`APPLICANT`, `VERIFICATION_OFFICER`, `SCHEME_ADMIN`, `OPERATIONS_DIRECTOR`)
  - **Testing Framework:** Vitest (unit and integration tests for rules, schemas, and case workflows)
  - **E2E Testing Framework:** Playwright (cross-role end-to-end workflow verification)
  - **Document / Blob Storage:** Local Filesystem Provider (`uploads/documents/`) backed by pluggable `IStorageAdapter` interface
  - **AI / Document Service:** Modular In-Process Document Service (`Tesseract.js` + `pdf-parse` + fuzzy phonetic entity matcher) with optional external LLM adapter interface
  - **Containerization / Dev Environment:** Docker Compose (for PostgreSQL 15) + Host Node.js (v20+ LTS)
  - **Linting & Formatting:** ESLint + Prettier (with `prettier-plugin-tailwindcss`)

---

## 5. Technology Selection Rationale & Tradeoffs

| Domain                   | Selected Technology                          | Selection Rationale                                                                                                                                               | Consequence / Tradeoff                                                                                     |
| :----------------------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Frontend Framework**   | **Next.js (App Router)**                     | Unifies server rendering for high-density dashboards, API route handlers, and client components for interactive document viewers in a single cohesive repository. | Requires clear client/server boundary discipline (`'use client'` vs server components).                    |
| **Language**             | **TypeScript (Strict)**                      | Provides end-to-end type safety across scheme schemas, case states, API contracts, and form inputs.                                                               | Strict typing requires explicit models for dynamic/polymorphic scheme payloads.                            |
| **Styling**              | **Tailwind CSS (v3)**                        | Utility-first styling enables rapid creation of dense, accessible government-tech tables, split-screen layouts, and visual status cards.                          | Large inline class lists in JSX; managed via encapsulated components and `clsx`/`tailwind-merge`.          |
| **UI Components**        | **shadcn/ui (Radix UI)**                     | Unstyled, accessible (WCAG 2.1 AA) primitives with full code ownership in `components/ui`. Ideal for complex drawers and split-screen viewers.                    | Components reside in the project codebase rather than an external package.                                 |
| **Backend API**          | **Next.js Route Handlers + Domain Services** | Eliminates polyrepo sync friction during fast SIH development while enforcing clean architectural separation in `src/server/services/`.                           | Must enforce strict domain boundaries so business logic does not leak into route handlers.                 |
| **Database**             | **PostgreSQL (v15+)**                        | Robust ACID relational integrity combined with powerful JSONB support for dynamic scheme schemas and dynamic form responses.                                      | Requires running a Postgres instance (managed via Docker Compose locally).                                 |
| **ORM Layer**            | **Prisma ORM**                               | Clear declarative `schema.prisma`, automatic type generation, bulletproof migrations, and built-in Prisma Studio for real-time data inspection.                   | Minor engine cold-start overhead compared to raw SQL query builders; fully acceptable for case management. |
| **Validation**           | **Zod**                                      | Deep integration with TypeScript (`z.infer`), runtime parsing on API inputs, and dynamic schema generation for Scheme Studio.                                     | Dynamic form schemas need careful recursive schema structures.                                             |
| **Auth & RBAC**          | **NextAuth.js (Auth.js) JWT**                | Fast, secure session handling with role claims in JWT. Includes a demo role switcher for seamless hackathon presentations.                                        | Stateless JWT tokens require token versioning or short expiry for immediate revocation.                    |
| **Testing**              | **Vitest**                                   | Blazing fast ESM-native test runner with Jest-compatible API. Perfect for unit testing deterministic rules and state machines.                                    | Uses jsdom for React component tests; browser DOM testing deferred to Playwright.                          |
| **E2E Testing**          | **Playwright**                               | Full browser automation with traces and screenshots to verify complex multi-role workflows (applicant upload → officer verify → deficiency resolve).              | Requires installing headless browser binaries in the development environment.                              |
| **Document Storage**     | **Local Filesystem + `IStorageAdapter`**     | 100% offline-capable, reliable file storage for local development and demos. Adapter abstraction allows zero-rewrite switch to S3/GCS later.                      | File assets stored locally in development; requires directory permissions and Git-ignoring.                |
| **Document AI**          | **Modular In-Process Service**               | Performs OCR, classification, and fuzzy phonetic matching locally without cloud dependencies. Pluggable adapter interface for optional vision LLMs.               | Complex handwritten regional language scripts require pre-processing or clear digital uploads.             |
| **Dev Environment**      | **Docker Compose (Postgres) + Node.js LTS**  | Zero-configuration database startup via Docker while preserving fast native Node.js hot-reloading for the application.                                            | Requires Docker Desktop / engine installed, with direct local PostgreSQL fallback connection support.      |
| **Linting & Code Style** | **ESLint + Prettier**                        | Enforces consistent formatting, automatic import cleanup, and strict code quality across all coding agents.                                                       | Strict rules reject implicit `any` types and require disciplined lint compliance.                          |
