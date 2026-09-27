# Product Requirements Document (PRD) — TribalScholar AI

**Problem Statement 26239:** AI-Enabled Scholarship and Fellowship Management System for Scheduled Tribes  
**Product Title:** TribalScholar AI  
**Core Product:** Intelligent Scholarship Case Orchestration Platform  
**Document Status:** Baseline Approved (Phase 2 Step 1)

---

## 1. Executive Summary & Core Thesis

### 1.1 The Challenge

Managing scholarships and fellowships for Scheduled Tribe (ST) students across India entails handling heterogeneous schemes (e.g., NFST for domestic doctoral studies, NOS for higher education abroad), diverse applicant backgrounds, complex multi-page documentary evidence, linguistic variations in official certificates, and multi-tier verification procedures. Traditional portals suffer from brittle hardcoded forms, opaque "rejection" notices without actionable remedies, high administrative backlog, delayed disbursements, and lack of operational transparency.

### 1.2 The Core Thesis

**Configurable, Evidence-Aware, Exception-Driven Scholarship Case Orchestration.**

- **Configurable:** Schemes, eligibility rules, document matrices, and workflows must be defined declaratively without rewriting code.
- **Evidence-Aware:** Verification is grounded in extracted, visual, and textually linked documentary evidence, not black-box guesses.
- **Exception-Driven:** Routine compliant applications flow smoothly, while ambiguous cases or deficiencies are highlighted with exact explanations and directed to structured resolution queues.

### 1.3 Product Purpose

A unified, configurable, and secure scholarship and fellowship case-management platform that governs the entire lifecycle—from policy definition, application submission, and document ingestion through automated verification, deficiency resolution, human-in-the-loop adjudication, selection, and post-selection grant tracking.

---

## 2. Core Lifecycle & Innovation Loop

### 2.1 The End-to-End Case Lifecycle

```
Policy → Application → Evidence → Rules → Exceptions → Resolution → Human Review → Workflow → Operations
```

1. **Policy:** Declarative scheme definition via Scheme Studio (eligibility parameters, quotas, required proofs, deadlines).
2. **Application:** Dynamic, scheme-specific portal guiding ST applicants through structured data entry and pre-flight validation.
3. **Evidence:** Multilingual document ingestion, OCR, classification, and field-level evidence anchoring.
4. **Rules:** Deterministic evaluation of mandatory conditions (age, income ceiling, caste validity, academic credentials).
5. **Exceptions:** Automated triage of mismatches, incomplete submissions, or ambiguous data into distinct exception categories.
6. **Resolution:** Actionable, human-readable deficiency issuance allowing applicants to correct specific items.
7. **Human Review:** Dedicated verification officer workspace with split-screen evidence inspection and decision logging.
8. **Workflow:** Deterministic state machine governing approvals, committee reviews, sanctions, and merit listings.
9. **Operations:** Control Tower analytics monitoring processing bottlenecks, officer turnaround times, and scheme-level trends.

### 2.2 The Core Innovation Loop

```
Detect → Explain → Correct → Recheck → Resolve
```

- **Detect:** Automated extraction and rules engines flag missing fields, certificate expiry, or cross-document spelling variances.
- **Explain:** The system translates the finding into an explainable deficiency in clear language (e.g., _"Income Certificate issued for FY 2023-24; scheme requires validity for FY 2025-26"_).
- **Correct:** The applicant receives a dedicated, self-service correction link to address only the flagged deficiency without restarting the entire application.
- **Recheck:** Targeted recheck engine re-evaluates only the affected document and rule dependencies, keeping previously validated checks cached.
- **Resolve:** The exception is cleared automatically or forwarded to the officer with a resolved badge.

---

## 3. The Five Product Pillars

### Pillar 1: Scheme Intelligence

- Declarative Scheme Studio: Configure scheme metadata, quota allocations, financial components (stipend, tuition, contingency, travel allowance).
- Dynamic Form Generator: Render scheme-specific application schemas dynamically.
- Document Matrix Configuration: Define mandatory, conditional, and optional documents with allowed file formats, page limits, and validity criteria.

### Pillar 2: Case Intelligence

- Case-Centric Dossier: Every application is an auditable, living case entity aggregating demographic profile, uploaded artifacts, extracted entities, rule evaluations, and communication history.
- State Machine Workflow: Clear status transitions from `DRAFT`, `SUBMITTED`, `IN_VERIFICATION`, `DEFICIENT`, `RESUBMITTED`, `OFFICER_REVIEW`, `RECOMMENDED`, `SANCTIONED`, to `REJECTED`.
- Explainable Case Status: No bare status flags. Every state provides:
  - **Stage:** Current workflow checkpoint (e.g., _Document Verification_)
  - **State:** Operational status (e.g., _Action Required_)
  - **Blocker:** Exact obstacle (e.g., _Caste Certificate issuing authority seal is obscured_)
  - **Responsible Actor:** Who must act next (e.g., _Applicant_)
  - **Next Action:** Clear next step (e.g., _Upload clear scan of Caste Certificate page 1_)

### Pillar 3: Verification Intelligence

- Multilingual OCR & Classification: Identify document types (Caste Certificate, Income Certificate, Degree Transcript, Admission Offer Letter, Passport).
- Field Extraction & Normalization: Extract key parameters (Applicant Name, Father/Mother Name, Date of Birth, Caste Category/Tribe, Issuing Authority, Certificate Date, Annual Family Income).
- Cross-Document Consistency Checking: Perform entity resolution and phonetic/fuzzy matching across documents (e.g., minor surname spelling differences between Aadhaar and Degree certificate) to highlight variances without falsely branding applicants as fraudulent.
- Evidence-Linked Verification Cards: Highlight exact bounding boxes and text snippets on source PDFs/images corresponding to extracted parameters.

### Pillar 4: Resolution Intelligence

- Actionable Deficiency Management: Officers and automated engines generate structured deficiencies categorized by severity (Warning, Clarification, Mandatory Defect).
- Applicant Self-Service Resolution: Dedicated interface where students can upload rectified documents, provide clarifying statements, or request extensions.
- Targeted Recheck: Executes isolated re-evaluation on updated assets, preserving verified states for untouched documents.

### Pillar 5: Operations Intelligence

- Operations Control Tower: Unified dashboard for executive leadership and ministry supervisors.
- Bottleneck Identification: Visual funnel identifying where applications stall (e.g., verification desk, committee review, applicant deficiency response).
- Officer Workload Balancing: Queues sorted by SLA urgency, scheme priority, and officer caseload.
- Recurring Deficiency Analytics: Pinpoint systemic user confusion (e.g., high failure rates on specific state income certificate formats) to inform scheme policy and form guidance.

---

## 4. Key Feature Matrix

| Feature Area              | Capabilities & Requirements                                                                                                                                                                                                                                                  |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Applicant Experience**  | Secure onboarding, scheme eligibility pre-screener, dynamic multi-step form, pre-flight readiness checklist, drag-and-drop document upload with format & size validation, live timeline, explainable deficiency remediation workspace.                                       |
| **Document Intelligence** | Document classification, multilingual OCR, key-value pair extraction, bounding box localization, cross-document alignment, confidence scoring.                                                                                                                               |
| **Rules Engine**          | Declarative evaluation of income caps, age limits, academic score cutoffs, institution tier eligibility, ST certificate validity, family quota limits.                                                                                                                       |
| **Officer Workspace**     | Prioritized work queue, side-by-side split screen (application data vs. document viewer with evidence overlays), automated rule findings checklist, one-click deficiency issuance with templates, decision desk (Approve / Deficient / Reject) with mandatory audit remarks. |
| **Scheme Studio**         | Scheme creation, version control, dynamic field definition, document rules builder, validation rule logic editor, workflow milestone builder.                                                                                                                                |
| **Operations Tower**      | High-level KPIs (throughput, turnaround time, pending deficiencies, clearance rates), stage-wise drop-off analytics, officer performance metrics, exportable audit and compliance reports.                                                                                   |
| **Post-Selection**        | Scholar master profile, annual/semester progress report submission, supervisor recommendation upload, fellowship extension/renewal workflows, mock disbursement tracking.                                                                                                    |

---

## 5. Demonstration Schemes

The prototype will implement and demonstrate two flagship Ministry of Tribal Affairs schemes:

1. **NFST — National Fellowship for Higher Education of ST Students:**
   - **Target:** ST scholars pursuing M.Phil / Ph.D. degrees in Indian universities and institutions.
   - **Key Parameters:** ST Category confirmation, UGC/CSIR-NET or national entrance qualifying status, university admission letter, research supervisor details, annual progress milestone tracking.
2. **NOS — National Overseas Scholarship for ST Students:**
   - **Target:** ST candidates selected for Master’s level and Ph.D. courses abroad in reputed accredited institutions.
   - **Key Parameters:** ST Category confirmation, annual family income ceiling (e.g., ≤ ₹8.00 Lakh per annum), valid Passport, unconditional admission offer from top-ranked foreign institution (QS/THE ranking verification), minimum undergraduate academic percentage (e.g., ≥ 60%).

---

## 6. System Boundaries & Grounding Principles

1. **Assistive AI Boundary:**
   - AI models assist with text extraction, classification, consistency calculations, discrepancy detection, and draft explanations.
   - AI NEVER autonomously rejects or sanctions an application. Consequential decisions are reserved exclusively for authorized officers.
2. **External Integrations Grounding:**
   - No unsupported claims of live connections to government backends (PFMS, DigiLocker, National Scholarship Portal, UIDAI).
   - All external touchpoints must use clean adapter interfaces with high-fidelity mock/synthetic implementations for demo purposes.
3. **Data Privacy & Synthetic Grounding:**
   - No real student Aadhaar numbers, private certificates, or biometric data.
   - All sample records, certificates, and test cases must use synthetic/fictitious data clearly designated as demonstration assets.
4. **Metric Integrity:**
   - Performance metrics (e.g., OCR accuracy percentages, processing time reduction) will not be cited as empirical facts unless measured in reproducible benchmarks.
