# UI/UX & System Design — TribalScholar AI

**System:** TribalScholar AI (SIH Problem Statement 26239)  
**Document Status:** Baseline Approved (Phase 2 Step 1)  
**Design Standard:** Professional, Accessible Government-Tech Dashboard  

---

## 1. Design Philosophy & Visual Language

### 1.1 Core UX Principles
1. **Explainable Status Over Opaque Labels:**
   - Traditional portals state: *"Status: Deficient"*.
   - TribalScholar AI states:
     - **Stage:** Document Verification
     - **State:** Action Required
     - **Blocker:** Income Certificate issue date is older than the required 1-year cutoff (issued 14-Aug-2023).
     - **Responsible Actor:** Applicant
     - **Next Action:** Upload Income Certificate valid for FY 2025-26 before 15-Oct-2026.
2. **Assisted Human Decision-Making:**
   - Officers are empowered with split-screen side-by-side evidence inspection where extracted parameters are visually linked to source documents with colored bounding boxes.
3. **Frictionless Defect Remediation:**
   - Applicants are never sent back to step 1. They enter a targeted deficiency resolution view to fix only the flagged item.
4. **Data Density with Visual Clarity:**
   - Dashboards are engineered for high throughput. Officers and administrators need dense, structured information without unnecessary whitespace or decorative animations.

### 1.2 Visual Direction & Design Tokens
- **Theme:** Clean, modern, authoritative Gov-Tech aesthetic.
- **Color Palette:**
  - *Deep Navy / Slate (`#0f172a`, `#1e293b`):* Structural hierarchy, headers, navigation.
  - *Saffron / Ochre Accent (`#d97706`, `#b45309`):* Subtle national-tribal heritage cue, highlights, badges.
  - *Emerald Green (`#059669`, `#10b981`):* Verified states, passing rules, approvals.
  - *Amber / Ochre (`#d97706`, `#f59e0b`):* Deficiencies, ambiguities, pending officer reviews.
  - *Crimson / Rose (`#dc2626`, `#ef4444`):* Hard non-compliance, formal rejection, expired credentials.
  - *Muted Cool Grey (`#f8fafc`, `#f1f5f9`, `#e2e8f0`):* Background surfaces, card borders, dividers.
- **Typography:** Inter / system font stack; high legibility, tabular numbers (`tabular-nums`) for currency, dates, and certificate numbers.
- **Accessibility:** WCAG 2.1 AA compliant contrast ratios, full keyboard navigation support, distinct color + icon dual-encoding for all status badges.

---

## 2. Main User Areas & Screen Specifications

### 2.1 Applicant Experience
1. **Authentication & Profile:**
   - Clean login / registration with mobile/email OTP simulation.
   - Profile overview displaying basic demographic information, caste affiliation, and linked documents.
2. **Scheme Explorer & Pre-Screener:**
   - Interactive comparison cards for **NFST** and **NOS**.
   - 3-question eligibility check (Category = ST, Degree level, Income ceiling) providing instant eligibility confirmation before starting.
3. **Dynamic Application Form:**
   - Step-based wizard dynamically generated from scheme configuration schema.
   - Real-time client-side validation for form inputs (dates, income figures, roll numbers).
4. **Document Checklist & Pre-Flight Uploader:**
   - Interactive document checklist showing required vs optional items.
   - Drag-and-drop file upload with client-side verification (format: PDF/JPEG, size < 5MB).
   - "Readiness Indicator" score ring summarizing completion before final submission.
5. **Live Application Tracker & Timeline:**
   - Visual milestone tracker: `Application Submitted` → `Automated Ingestion` → `Verification Officer Review` → `Selection Committee` → `Sanction Order`.
   - Explainable case status card showing stage, actor, blocker, and next action.
6. **Deficiency Resolution Workspace:**
   - When an application is flagged, the applicant sees an alert banner on login.
   - Displays exact deficiency description, officer notes, and an upload dropzone for that specific document only.
   - One-click "Resubmit for Targeted Verification" button.

### 2.2 Officer Case Workspace
1. **Officer Triage Dashboard:**
   - Worklist filters: *Pending Review*, *Deficiencies Resubmitted*, *High Priority / SLA Risk*, *Approved*, *Rejected*.
   - Filter by scheme (**NFST** vs **NOS**), category, and assigned date.
2. **Split-Screen Case Dossier Review:**
   - **Left Pane (Applicant Data & Rule Findings):**
     - Applicant personal, academic, and financial summary.
     - Automated Rule Engine Results: Green checks for verified rules (e.g., ST Certificate parsed, Income ≤ ₹8L), Amber flags for discrepancies (e.g., name spelling variance: 92% similarity).
   - **Right Pane (High-Resolution Document & Evidence Viewer):**
     - Tabbed document viewer (Caste Certificate, Income Certificate, Offer Letter, Passport).
     - Visual bounding box highlights pinpointing exact lines where key fields were extracted.
     - Zoom, rotate, page navigation, and download tools.
3. **Deficiency Management Drawer:**
   - Allows officer to select one or more documents or data fields.
   - Choose from pre-configured deficiency templates (e.g., *"Blurry / illegible scan"*, *"Expired financial year"*, *"Authority seal missing"*) or type custom remarks.
   - Set applicant response window (e.g., 7 days).
4. **Human Decision Desk:**
   - Action buttons: `Approve & Forward to Committee`, `Issue Structured Deficiency`, `Reject Application`.
   - Mandatory remark entry for any rejection or deficiency to guarantee full auditability.

### 2.3 Admin / Scheme Studio
1. **Scheme Management Console:**
   - Overview of active schemes (**NFST**, **NOS**) with version indicators and active application counts.
2. **Dynamic Schema Configurator:**
   - Form field builder: Text, Number, Date, Select, File Upload.
   - Validation rules: Min/Max, Regex patterns, conditional visibility based on previous answers.
3. **Document Matrix Editor:**
   - Define required documents per scheme.
   - Set file constraints (allowed extensions, max size in MB, mandatory vs optional, expiry rules).
4. **Deterministic Rules & Eligibility Builder:**
   - Configure threshold parameters: Maximum family income, minimum qualifying marks (%), age limits with ST relaxation, recognized institution lists.
5. **Workflow & SLA Configurator:**
   - Define verification stages, assignable officer groups, review turnaround SLAs (e.g., 5 working days).

### 2.4 Management Operations Control Tower
1. **Executive KPI Dashboard:**
   - Total applications received, verified, deficient, approved, and rejected.
   - Average Turnaround Time (TAT) from submission to final decision.
   - Active backlog count and SLA breach warnings.
2. **Pipeline Bottleneck Visualizer:**
   - Funnel chart tracking application progression across each stage.
   - Pinpoints where cases accumulate (e.g., 42% waiting on applicant deficiency response).
3. **Officer Workload & Productivity Matrix:**
   - Caseload distribution across verification officers.
   - Processing speed, deficiency issuance rate, and resolution rate per officer.
4. **Recurring Deficiency Analytics:**
   - Heatmap / bar chart identifying the most common reasons for deficiencies across schemes and geographical regions (e.g., 68% of deficiencies in Scheme X stem from invalid income certificates).
   - Insights feed directly into Scheme Studio guidance updates.

### 2.5 Post-Selection Management
1. **Scholar Dossier & Continuation Record:**
   - Centralized view of selected awardees under NFST and NOS.
   - Fellowship tenure dates, awarded financial amounts, and assigned research institution/university.
2. **Milestone & Progress Tracking:**
   - Submission portal for periodic progress reports (half-yearly/annual).
   - Research supervisor assessment upload and verification.
3. **Mock Disbursement & Coordination Interface:**
   - Track installment release schedule (Tuition, Stipend/Contingency).
   - Simulated status tracking with PFMS (Direct Benefit Transfer - DBT) adapters.

---

## 3. Explainable Status Design Standard

Every status presentation in the system must conform to the following JSON structure and UI rendering:

```json
{
  "stage": "DOCUMENT_VERIFICATION",
  "state": "ACTION_REQUIRED",
  "blocker": "Annual income certificate issued on 12-Jul-2023 exceeds the 12-month validity window for FY 2025-26.",
  "responsible_actor": "APPLICANT",
  "next_action": "Upload a renewed Income Certificate issued on or after 01-Apr-2025.",
  "deadline": "2026-10-15T23:59:59Z"
}
```

### Visual Rendering:
```
+-----------------------------------------------------------------------------------+
|  [STAGE: Document Verification]   *   [STATE: Action Required]                   |
|                                                                                   |
|  Blocker: Income certificate issue date exceeds 12-month validity for FY 2025-26. |
|  Responsible Actor: Applicant (You)                                               |
|  Next Action: Upload renewed Income Certificate issued on or after 01-Apr-2025.   |
|  Resolution Deadline: 15-Oct-2026 (7 days remaining)                              |
|                                                                                   |
|  [Resolve Deficiency Now ->]                                                      |
+-----------------------------------------------------------------------------------+
```
