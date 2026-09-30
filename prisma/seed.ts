import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { defaultStorage } from "../src/server/storage/local-storage.adapter";

const prisma = new PrismaClient();
const SEEDED_AT = new Date("2026-09-15T10:30:00.000Z");

async function main() {
  console.log("🌱 Starting TribalScholar AI Phase 2D database seed...");

  console.log("🧹 Clearing dynamic runtime demo data (audit logs, deficiencies, renewals, documents, cases, applications)...");
  await prisma.auditLog.deleteMany({});
  await prisma.scholarRenewal.deleteMany({});
  await prisma.postSelectionRecord.deleteMany({});
  await prisma.deficiency.deleteMany({});
  await prisma.ruleResult.deleteMany({});
  await prisma.extractedField.deleteMany({});
  await prisma.documentProcessingJob.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.caseDossier.deleteMany({});
  await prisma.application.deleteMany({});

  // ==========================================
  // 1. SYSTEM HEALTH RECORD
  // ==========================================
  await prisma.systemHealth.upsert({
    where: { id: "health_baseline_001" },
    update: { status: "OPERATIONAL", checkedAt: SEEDED_AT },
    create: {
      id: "health_baseline_001",
      checkName: "PostgreSQL Database Engine",
      status: "OPERATIONAL",
      checkedAt: SEEDED_AT,
    },
  });

  // ==========================================
  // 2. DEMO USERS & PERSONAS (Real bcrypt hashes, cost factor 12)
  // ==========================================
  const demoUsers = [
    {
      id: "usr_demo_applicant_001",
      email: "ramesh.meena@example.tribal.gov.in",
      name: "Ramesh Kumar Meena (Applicant)",
      role: "APPLICANT" as UserRole,
      password: "Demo@Applicant2026",
    },
    {
      id: "usr_demo_officer_001",
      email: "priya.sharma@tribal.gov.in",
      name: "Priya Sharma (Verification Officer)",
      role: "VERIFICATION_OFFICER" as UserRole,
      password: "Demo@Officer2026",
    },
    {
      id: "usr_demo_admin_001",
      email: "rajesh.verma@tribal.gov.in",
      name: "Rajesh Verma (Scheme Administrator)",
      role: "SCHEME_ADMIN" as UserRole,
      password: "Demo@Admin2026",
    },
    {
      id: "usr_demo_management_001",
      email: "sunita.rao@tribal.gov.in",
      name: "Dr. Sunita Rao (Operations Director)",
      role: "OPERATIONS_DIRECTOR" as UserRole,
      password: "Demo@Director2026",
    },
  ];

  for (const u of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: u.email },
      select: { passwordHash: true },
    });
    const passwordHash =
      existingUser?.passwordHash && bcrypt.compareSync(u.password, existingUser.passwordHash)
        ? existingUser.passwordHash
        : bcrypt.hashSync(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash, isActive: true },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        isActive: true,
      },
    });
  }

  // ==========================================
  // 3. APPLICANT PROFILE (Ramesh Kumar Meena)
  // ==========================================
  await prisma.applicantProfile.upsert({
    where: { userId: "usr_demo_applicant_001" },
    update: {
      category: "ST",
      stateDomicile: "Rajasthan",
      district: "Sawai Madhopur",
      mobile: "+91-9876543210",
      aadhaarLast4: "5678",
      academicQualification: "Master of Science (Physics)",
      institutionName: "University of Rajasthan, Jaipur",
      yearOfPassing: 2024,
      percentageObtained: 72.5,
      annualFamilyIncome: 450000.0,
      casteCertificateVerified: false,
    },
    create: {
      id: "prof_demo_applicant_001",
      userId: "usr_demo_applicant_001",
      dateOfBirth: new Date("1998-05-15"),
      gender: "Male",
      category: "ST",
      stateDomicile: "Rajasthan",
      district: "Sawai Madhopur",
      mobile: "+91-9876543210",
      aadhaarLast4: "5678",
      academicQualification: "Master of Science (Physics)",
      institutionName: "University of Rajasthan, Jaipur",
      yearOfPassing: 2024,
      percentageObtained: 72.5,
      annualFamilyIncome: 450000.0,
      casteCertificateVerified: false,
    },
  });

  // ==========================================
  // 4. SCHEME 1: NFST (National Fellowship for Scheduled Tribes)
  // ==========================================
  const nfstScheme = await prisma.scheme.upsert({
    where: { code: "NFST" },
    update: {
      name: "National Fellowship for Higher Education of ST Students (NFST)",
      description:
        "Provides financial assistance to Scheduled Tribe scholars pursuing regular and full-time M.Phil. and Ph.D. degrees in Indian universities and research institutions.",
      ministry: "Ministry of Tribal Affairs",
      isActive: true,
    },
    create: {
      id: "sch_nfst_001",
      code: "NFST",
      name: "National Fellowship for Higher Education of ST Students (NFST)",
      description:
        "Provides financial assistance to Scheduled Tribe scholars pursuing regular and full-time M.Phil. and Ph.D. degrees in Indian universities and research institutions.",
      ministry: "Ministry of Tribal Affairs",
      isActive: true,
    },
  });

  // NFST SchemeVersion v1 (Declarative Typed DSL)
  const nfstFormSchema = {
    version: "1.0",
    sections: [
      { id: "personal", title: "Personal & Demographic Details", order: 1 },
      { id: "academic", title: "Academic & Fellowship Enrollment", order: 2 },
      { id: "financial", title: "Financial & Domicile Information", order: 3 },
      { id: "declaration", title: "Applicant Declaration", order: 4 },
    ],
    fields: [
      {
        id: "fullName",
        label: "Full Name (as per Certificate)",
        type: "text",
        validation: { required: true, minLength: 2 },
        sectionId: "personal",
        order: 1,
      },
      {
        id: "dateOfBirth",
        label: "Date of Birth",
        type: "date",
        validation: { required: true },
        sectionId: "personal",
        order: 2,
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        validation: { required: true, allowedValues: ["Male", "Female", "Other"] },
        sectionId: "personal",
        order: 3,
      },
      {
        id: "stateDomicile",
        label: "State / UT of Domicile",
        type: "text",
        validation: { required: true },
        sectionId: "personal",
        order: 4,
      },
      {
        id: "casteCategory",
        label: "Caste / Tribe Category",
        type: "select",
        validation: { required: true, allowedValues: ["ST"] },
        sectionId: "personal",
        order: 5,
      },
      {
        id: "degreeType",
        label: "Enrolled Degree Level",
        type: "select",
        validation: { required: true, allowedValues: ["Ph.D.", "M.Phil."] },
        sectionId: "academic",
        order: 1,
      },
      {
        id: "universityName",
        label: "Admitting University / Institution",
        type: "text",
        validation: { required: true },
        sectionId: "academic",
        order: 2,
      },
      {
        id: "enrollmentNumber",
        label: "University Enrollment / Registration No.",
        type: "text",
        validation: { required: true },
        sectionId: "academic",
        order: 3,
      },
      {
        id: "supervisorName",
        label: "Research Supervisor / Guide Name",
        type: "text",
        validation: { required: true },
        sectionId: "academic",
        order: 4,
      },
      {
        id: "researchTopic",
        label: "Approved Research Topic / Subject Area",
        type: "textarea",
        validation: { required: true, minLength: 10 },
        sectionId: "academic",
        order: 5,
      },
      {
        id: "academicPercentage",
        label: "Post-Graduate Qualifying Marks (%)",
        type: "number",
        validation: { required: true, min: 0, max: 100 },
        sectionId: "academic",
        order: 6,
      },
      {
        id: "annualFamilyIncome",
        label: "Annual Family Income (INR)",
        type: "number",
        validation: { required: true, min: 0 },
        sectionId: "financial",
        order: 1,
      },
      {
        id: "selfDeclaration",
        label: "I hereby declare that all provided details and documents are authentic.",
        type: "boolean",
        validation: { required: true },
        sectionId: "declaration",
        order: 1,
      },
    ],
  };

  const nfstDocRequirements = {
    version: "1.0",
    requirements: [
      {
        id: "req_caste_cert",
        documentType: "CASTE_CERTIFICATE",
        label: "Scheduled Tribe Certificate",
        description: "Official ST Certificate issued by competent revenue authority.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
        maxFileSizeMb: 5,
        validityWindowMonths: 36,
        issuerCriteria: "Sub-Divisional Magistrate / Tehsildar / District Magistrate",
        requiresExtraction: true,
      },
      {
        id: "req_degree_transcript",
        documentType: "DEGREE_TRANSCRIPT",
        label: "Post-Graduate Degree Marksheet & Certificate",
        description: "Master's degree transcripts showing percentage/CGPA.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
        requiresExtraction: true,
      },
      {
        id: "req_admission_letter",
        documentType: "ADMISSION_OFFER_LETTER",
        label: "University Admission / Registration Letter",
        description: "Proof of regular and full-time M.Phil./Ph.D. registration.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
        validityWindowMonths: 18,
        requiresExtraction: true,
      },
      {
        id: "req_research_proposal",
        documentType: "RESEARCH_PROPOSAL",
        label: "Research Synopsis / Proposal",
        description: "Detailed research topic description signed by guide.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 10,
        requiresExtraction: false,
      },
    ],
  };

  const nfstEligibilityRules = {
    version: "1.0",
    rules: [
      {
        ruleKey: "ST_VERIFICATION",
        name: "ST Category Verification",
        description: "Applicant must belong to a recognized Scheduled Tribe category.",
        source: "FORM_DATA",
        sourceField: "casteCategory",
        operator: "EQUALS",
        threshold: "ST",
        failureMessage: "Candidate category must be verified as Scheduled Tribe (ST).",
        severity: "HARD_FAIL",
        isActive: true,
      },
      {
        ruleKey: "AGE_LIMIT",
        name: "Age Limit with ST Relaxation",
        description:
          "Age must be ≤ 36 years for Ph.D. fellowship (31 base + 5 years ST relaxation).",
        source: "COMPUTED",
        sourceField: "age",
        operator: "LESS_THAN_OR_EQUALS",
        threshold: 36,
        failureMessage:
          "Applicant age exceeds the maximum permissible limit of 36 years (inclusive of 5 years ST relaxation).",
        severity: "HARD_FAIL",
        stRelaxation: { addToThreshold: 5 },
        isActive: true,
      },
      {
        ruleKey: "ACADEMIC_MIN_SCORE",
        name: "Post-Graduate Minimum Marks",
        description: "Minimum 55% aggregate marks in Master's degree qualification.",
        source: "FORM_DATA",
        sourceField: "academicPercentage",
        operator: "GREATER_THAN_OR_EQUALS",
        threshold: 55,
        failureMessage:
          "Post-graduate aggregate score of {computedValue}% is below the required 55% cutoff.",
        severity: "HARD_FAIL",
        isActive: true,
      },
    ],
  };

  const nfstWorkflowConfig = {
    version: "1.0",
    stages: [
      {
        stageKey: "SUBMITTED",
        label: "Application Received",
        order: 1,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
      },
      {
        stageKey: "AUTOMATED_VERIFICATION",
        label: "Automated Evidence & Rule Check",
        order: 2,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
        autoAdvanceOnPass: true,
      },
      {
        stageKey: "OFFICER_REVIEW",
        label: "Verification Officer Desk",
        order: 3,
        slaDays: 5,
        assignableRoles: ["VERIFICATION_OFFICER"],
      },
      {
        stageKey: "SANCTIONED",
        label: "Sanction Issued",
        order: 4,
        slaDays: 3,
        assignableRoles: ["SCHEME_ADMIN"],
      },
    ],
    deficiencyResponseWindowDays: 14,
    maxResubmissionAttempts: 2,
    allowWithdrawal: true,
  };

  const nfstSelectionConfig = {
    version: "1.0",
    maxAwardees: 750,
    quotas: [
      { id: "q_jrf", label: "JRF Fellowship Allocation", percentage: 60 },
      { id: "q_srf", label: "SRF Fellowship Upgrade", percentage: 40 },
    ],
    financialComponents: [
      {
        id: "fc_jrf_stipend",
        label: "Monthly Fellowship Stipend (JRF)",
        amountInr: 31000,
        frequency: "MONTHLY",
        description: "Standard UGC JRF parity fellowship",
      },
      {
        id: "fc_contingency",
        label: "Annual Contingency Grant (Humanities & Social Sciences)",
        amountInr: 20500,
        frequency: "ANNUAL",
        description: "Annual research contingency allowance",
      },
    ],
    meritBasis: "ACADEMIC_SCORE",
    guidelinesNotes: "NFST fellowship awards are subject to verified UGC/CSIR parity standards.",
  };

  await prisma.schemeVersion.upsert({
    where: {
      schemeId_versionNumber: {
        schemeId: nfstScheme.id,
        versionNumber: 1,
      },
    },
    update: {
      isActive: true,
      effectiveTo: null,
      formSchema: nfstFormSchema,
      documentRequirements: nfstDocRequirements,
      eligibilityRules: nfstEligibilityRules,
      workflowConfig: nfstWorkflowConfig,
      selectionConfig: nfstSelectionConfig,
      applicationOpenDate: new Date("2025-04-01T00:00:00.000Z"),
      applicationDeadline: new Date("2026-10-31T23:59:59.000Z"),
    },
    create: {
      id: "sch_ver_nfst_2025_1",
      schemeId: nfstScheme.id,
      versionNumber: 1,
      effectiveFrom: new Date("2025-04-01"),
      effectiveTo: null,
      isActive: true,
      publishedById: "usr_demo_admin_001",
      formSchema: nfstFormSchema,
      documentRequirements: nfstDocRequirements,
      eligibilityRules: nfstEligibilityRules,
      workflowConfig: nfstWorkflowConfig,
      selectionConfig: nfstSelectionConfig,
      applicationOpenDate: new Date("2025-04-01T00:00:00.000Z"),
      applicationDeadline: new Date("2026-10-31T23:59:59.000Z"),
    },
  });

  // ==========================================
  // 5. SCHEME 2: NOS (National Overseas Scholarship)
  // ==========================================
  const nosScheme = await prisma.scheme.upsert({
    where: { code: "NOS" },
    update: {
      name: "National Overseas Scholarship for Scheduled Tribe Candidates (NOS)",
      description:
        "Facilitates low-income ST candidates to pursue higher studies abroad (Master level courses and Ph.D.) in top-ranked global universities.",
      ministry: "Ministry of Tribal Affairs",
      isActive: true,
    },
    create: {
      id: "sch_nos_001",
      code: "NOS",
      name: "National Overseas Scholarship for Scheduled Tribe Candidates (NOS)",
      description:
        "Facilitates low-income ST candidates to pursue higher studies abroad (Master level courses and Ph.D.) in top-ranked global universities.",
      ministry: "Ministry of Tribal Affairs",
      isActive: true,
    },
  });

  const nosFormSchema = {
    version: "1.0",
    sections: [
      { id: "personal", title: "Personal & Passport Information", order: 1 },
      { id: "overseas_academic", title: "Foreign University & Course Details", order: 2 },
      { id: "income_eligibility", title: "Family Income & Domicile", order: 3 },
      { id: "declaration", title: "Mandatory Undertaking", order: 4 },
    ],
    fields: [
      {
        id: "fullName",
        label: "Full Name (as in Indian Passport)",
        type: "text",
        validation: { required: true, minLength: 2 },
        sectionId: "personal",
        order: 1,
      },
      {
        id: "dateOfBirth",
        label: "Date of Birth",
        type: "date",
        validation: { required: true },
        sectionId: "personal",
        order: 2,
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        validation: { required: true, allowedValues: ["Male", "Female", "Other"] },
        sectionId: "personal",
        order: 3,
      },
      {
        id: "passportNumber",
        label: "Valid Indian Passport Number",
        type: "text",
        validation: {
          required: true,
          pattern: "^[A-Z][0-9]{7}$",
          patternMessage: "Must be a valid 8-character Indian passport format (e.g. Z1234567)",
        },
        sectionId: "personal",
        order: 4,
      },
      {
        id: "passportExpiryDate",
        label: "Passport Expiry Date",
        type: "date",
        validation: { required: true },
        sectionId: "personal",
        order: 5,
      },
      {
        id: "casteCategory",
        label: "Caste / Tribe Affiliation",
        type: "select",
        validation: { required: true, allowedValues: ["ST"] },
        sectionId: "personal",
        order: 6,
      },
      {
        id: "hostUniversity",
        label: "Admitting Foreign University Name",
        type: "text",
        validation: { required: true },
        sectionId: "overseas_academic",
        order: 1,
      },
      {
        id: "hostCountry",
        label: "Country of Study",
        type: "select",
        validation: {
          required: true,
          allowedValues: [
            "United States",
            "United Kingdom",
            "Germany",
            "Canada",
            "Australia",
            "Other",
          ],
        },
        sectionId: "overseas_academic",
        order: 2,
      },
      {
        id: "degreeLevel",
        label: "Degree Level Abroad",
        type: "select",
        validation: { required: true, allowedValues: ["Master Degree", "Ph.D."] },
        sectionId: "overseas_academic",
        order: 3,
      },
      {
        id: "courseStartDate",
        label: "Proposed Course Commencement Date",
        type: "date",
        validation: { required: true },
        sectionId: "overseas_academic",
        order: 4,
      },
      {
        id: "academicPercentage",
        label: "Qualifying Degree Marks / Percentage (%)",
        type: "number",
        validation: { required: true, min: 0, max: 100 },
        sectionId: "overseas_academic",
        order: 5,
      },
      {
        id: "annualFamilyIncome",
        label: "Total Annual Family Income (INR)",
        type: "number",
        validation: { required: true, min: 0 },
        sectionId: "income_eligibility",
        order: 1,
      },
      {
        id: "selfDeclaration",
        label:
          "I confirm that all financial declarations and foreign university admission proofs are genuine.",
        type: "boolean",
        validation: { required: true },
        sectionId: "declaration",
        order: 1,
      },
    ],
  };

  const nosDocRequirements = {
    version: "1.0",
    requirements: [
      {
        id: "req_caste_cert",
        documentType: "CASTE_CERTIFICATE",
        label: "Scheduled Tribe Certificate",
        description: "Official ST Certificate issued by competent authority.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
        maxFileSizeMb: 5,
        validityWindowMonths: 36,
        requiresExtraction: true,
      },
      {
        id: "req_income_cert",
        documentType: "INCOME_CERTIFICATE",
        label: "Annual Family Income Certificate",
        description:
          "Income certificate valid for current financial year issued by authorized revenue officer.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
        validityWindowMonths: 12,
        issuerCriteria: "Tehsildar / Sub-Divisional Magistrate / Revenue Officer",
        requiresExtraction: true,
      },
      {
        id: "req_passport",
        documentType: "PASSPORT",
        label: "Indian Passport (Front & Back Pages)",
        description:
          "Must be valid for at least 1 year beyond the proposed course commencement date.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
        requiresExtraction: true,
      },
      {
        id: "req_offer_letter",
        documentType: "ADMISSION_OFFER_LETTER",
        label: "Unconditional Admission Offer Letter (Foreign University)",
        description: "Official unconditional offer letter from top-ranked foreign institution.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
        requiresExtraction: true,
      },
      {
        id: "req_transcripts",
        documentType: "DEGREE_TRANSCRIPT",
        label: "Qualifying Degree Transcripts & Degree Certificate",
        description: "Bachelor's / Master's degree marksheets showing minimum 60% aggregate.",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
        requiresExtraction: true,
      },
    ],
  };

  const nosEligibilityRules = {
    version: "1.0",
    rules: [
      {
        ruleKey: "ST_VERIFICATION",
        name: "ST Category Verification",
        description: "Applicant must belong to a recognized Scheduled Tribe category.",
        source: "FORM_DATA",
        sourceField: "casteCategory",
        operator: "EQUALS",
        threshold: "ST",
        failureMessage: "Candidate category must be verified as Scheduled Tribe (ST).",
        severity: "HARD_FAIL",
        isActive: true,
      },
      {
        ruleKey: "INCOME_CEILING",
        name: "NOS Income Ceiling Verification",
        description: "Total annual family income must not exceed INR 8.00 Lakhs (800,000).",
        source: "FORM_DATA",
        sourceField: "annualFamilyIncome",
        operator: "LESS_THAN_OR_EQUALS",
        threshold: 800000,
        failureMessage:
          "Declared annual family income of INR {computedValue} exceeds the mandatory NOS ceiling of INR 8,00,000.",
        severity: "HARD_FAIL",
        isActive: true,
      },
      {
        ruleKey: "AGE_LIMIT",
        name: "NOS Maximum Age Limit",
        description: "Candidate must be 35 years or below on the 1st day of the application year.",
        source: "COMPUTED",
        sourceField: "age",
        operator: "LESS_THAN_OR_EQUALS",
        threshold: 35,
        failureMessage:
          "Candidate age of {computedValue} years exceeds the maximum age limit of 35 years for NOS.",
        severity: "HARD_FAIL",
        isActive: true,
      },
      {
        ruleKey: "ACADEMIC_MIN_SCORE",
        name: "NOS Qualifying Academic Percentage",
        description: "Candidate must possess minimum 60% aggregate in qualifying degree.",
        source: "FORM_DATA",
        sourceField: "academicPercentage",
        operator: "GREATER_THAN_OR_EQUALS",
        threshold: 60,
        failureMessage:
          "Qualifying academic percentage of {computedValue}% is below the mandatory 60% requirement for NOS.",
        severity: "HARD_FAIL",
        isActive: true,
      },
    ],
  };

  const nosWorkflowConfig = {
    version: "1.0",
    stages: [
      {
        stageKey: "SUBMITTED",
        label: "Application Received",
        order: 1,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
      },
      {
        stageKey: "AUTOMATED_VERIFICATION",
        label: "Automated Document Check",
        order: 2,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
        autoAdvanceOnPass: true,
      },
      {
        stageKey: "OFFICER_REVIEW",
        label: "Verification Officer Review",
        order: 3,
        slaDays: 7,
        assignableRoles: ["VERIFICATION_OFFICER"],
      },
      {
        stageKey: "COMMITTEE_SELECTION",
        label: "Inter-Ministerial Selection Committee",
        order: 4,
        slaDays: 14,
        assignableRoles: ["SCHEME_ADMIN"],
        requiresCommittee: true,
      },
      {
        stageKey: "SANCTIONED",
        label: "Sanction Issued",
        order: 5,
        slaDays: 3,
        assignableRoles: ["SCHEME_ADMIN"],
      },
    ],
    deficiencyResponseWindowDays: 14,
    maxResubmissionAttempts: 2,
    allowWithdrawal: true,
  };

  const nosSelectionConfig = {
    version: "1.0",
    maxAwardees: 100,
    quotas: [
      { id: "q_stem", label: "Engineering & Natural Sciences", percentage: 50 },
      { id: "q_humanities", label: "Social Sciences & Humanities", percentage: 30 },
      { id: "q_women", label: "Special Women ST Quota", percentage: 20 },
    ],
    financialComponents: [
      {
        id: "fc_living_allowance",
        label: "Annual Living & Maintenance Allowance (USD/GBP)",
        amountInr: 1540000,
        frequency: "ANNUAL",
        description: "Annual living allowance in foreign currency converted to INR equivalence",
      },
      {
        id: "fc_tuition",
        label: "Actual Tuition Fee Grant",
        amountInr: 2500000,
        frequency: "ANNUAL",
        description: "Direct university tuition payment reimbursement",
      },
      {
        id: "fc_airfare",
        label: "Economy Airfare (Return Journey)",
        amountInr: 150000,
        frequency: "ONE_TIME",
        description: "International travel allowance",
      },
    ],
    meritBasis: "COMPOSITE",
    guidelinesNotes:
      "Selection is strictly merit-ranked by Inter-Ministerial Committee based on QS ranking and academic marks.",
  };

  await prisma.schemeVersion.upsert({
    where: {
      schemeId_versionNumber: {
        schemeId: nosScheme.id,
        versionNumber: 1,
      },
    },
    update: {
      isActive: true,
      effectiveTo: null,
      formSchema: nosFormSchema,
      documentRequirements: nosDocRequirements,
      eligibilityRules: nosEligibilityRules,
      workflowConfig: nosWorkflowConfig,
      selectionConfig: nosSelectionConfig,
      applicationOpenDate: new Date("2025-04-01T00:00:00.000Z"),
      applicationDeadline: new Date("2026-09-30T23:59:59.000Z"),
    },
    create: {
      id: "sch_ver_nos_2025_1",
      schemeId: nosScheme.id,
      versionNumber: 1,
      effectiveFrom: new Date("2025-04-01"),
      effectiveTo: null,
      isActive: true,
      publishedById: "usr_demo_admin_001",
      formSchema: nosFormSchema,
      documentRequirements: nosDocRequirements,
      eligibilityRules: nosEligibilityRules,
      workflowConfig: nosWorkflowConfig,
      selectionConfig: nosSelectionConfig,
      applicationOpenDate: new Date("2025-04-01T00:00:00.000Z"),
      applicationDeadline: new Date("2026-09-30T23:59:59.000Z"),
    },
  });

  // ==========================================
  // 6. PHASE 2E DEMO APPLICATIONS & CASE DOSSIERS
  // ==========================================
  console.log("📄 Seeding Phase 2E synthetic demo applications...");

  // Application 1: NFST Draft Application with Early CaseDossier (DRAFT stage)
  const nfstApp = await prisma.application.upsert({
    where: {
      id: "app_demo_nfst_draft_001",
    },
    update: {
      status: "DRAFT",
      formData: {
        fullName: "Ramesh Kumar Meena",
        dateOfBirth: "1998-05-15",
        gender: "Male",
        stateDomicile: "Rajasthan",
        casteCategory: "ST",
        degreeType: "Ph.D.",
        universityName: "University of Rajasthan, Jaipur",
        annualFamilyIncome: 450000,
      },
    },
    create: {
      id: "app_demo_nfst_draft_001",
      applicationNumber: "APP-NFST-2026-000101",
      schemeVersionId: "sch_ver_nfst_2025_1",
      applicantProfileId: "prof_demo_applicant_001",
      submittedById: "usr_demo_applicant_001",
      status: "DRAFT",
      formData: {
        fullName: "Ramesh Kumar Meena",
        dateOfBirth: "1998-05-15",
        gender: "Male",
        stateDomicile: "Rajasthan",
        casteCategory: "ST",
        degreeType: "Ph.D.",
        universityName: "University of Rajasthan, Jaipur",
        annualFamilyIncome: 450000,
      },
    },
  });

  // Early CaseDossier for NFST Draft
  await prisma.caseDossier.upsert({
    where: { applicationId: nfstApp.id },
    update: {
      currentStage: "DRAFT",
      currentState: "PENDING",
      responsibleActor: "APPLICANT",
      nextAction: "Complete the application form and upload required documents.",
      blocker: null,
    },
    create: {
      id: "case_demo_nfst_001",
      applicationId: nfstApp.id,
      caseNumber: "CASE-NFST-2026-000101",
      currentStage: "DRAFT",
      currentState: "PENDING",
      responsibleActor: "APPLICANT",
      nextAction: "Complete the application form and upload required documents.",
      blocker: null,
    },
  });

  // Application 2: NOS Submitted Application with SUBMITTED CaseDossier
  const nosApp = await prisma.application.upsert({
    where: {
      id: "app_demo_nos_sub_001",
    },
    update: {
      status: "SUBMITTED",
      submittedAt: new Date("2026-09-15T10:30:00.000Z"),
      formData: {
        fullName: "Ramesh Kumar Meena",
        dateOfBirth: "1998-05-15",
        gender: "Male",
        passportNumber: "Z9876543",
        passportExpiryDate: "2032-12-31",
        casteCategory: "ST",
        hostUniversity: "University of Oxford",
        hostCountry: "United Kingdom",
        degreeLevel: "Ph.D.",
        courseStartDate: "2026-10-01",
        academicPercentage: 72.5,
        annualFamilyIncome: 450000,
        selfDeclaration: true,
      },
    },
    create: {
      id: "app_demo_nos_sub_001",
      applicationNumber: "APP-NOS-2026-000201",
      schemeVersionId: "sch_ver_nos_2025_1",
      applicantProfileId: "prof_demo_applicant_001",
      submittedById: "usr_demo_applicant_001",
      status: "SUBMITTED",
      submittedAt: new Date("2026-09-15T10:30:00.000Z"),
      formData: {
        fullName: "Ramesh Kumar Meena",
        dateOfBirth: "1998-05-15",
        gender: "Male",
        passportNumber: "Z9876543",
        passportExpiryDate: "2032-12-31",
        casteCategory: "ST",
        hostUniversity: "University of Oxford",
        hostCountry: "United Kingdom",
        degreeLevel: "Ph.D.",
        courseStartDate: "2026-10-01",
        academicPercentage: 72.5,
        annualFamilyIncome: 450000,
        selfDeclaration: true,
      },
    },
  });

  const nosCase = await prisma.caseDossier.upsert({
    where: { applicationId: nosApp.id },
    update: {
      currentStage: "SUBMITTED",
      currentState: "PENDING",
      responsibleActor: "SYSTEM",
      officerAssignedId: "usr_demo_officer_001",
      nextAction: "Automated verification underway.",
    },
    create: {
      id: "case_demo_nos_001",
      applicationId: nosApp.id,
      caseNumber: "CASE-NOS-2026-000201",
      currentStage: "SUBMITTED",
      currentState: "PENDING",
      responsibleActor: "SYSTEM",
      officerAssignedId: "usr_demo_officer_001",
      nextAction: "Automated verification underway.",
    },
  });

  // Seed sample documents attached to the NOS case
  const sampleDocs = [
    {
      id: "doc_demo_nos_caste_001",
      documentType: "CASTE_CERTIFICATE" as const,
      originalFilename: "DEMO_ST_Certificate_Synthetic.pdf",
      fixtureFilename: "demo-st-caste-certificate.pdf",
      storagePath: "case_demo_nos_001/CASTE_CERTIFICATE/sample_caste.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 0,
    },
    {
      id: "doc_demo_nos_income_001",
      documentType: "INCOME_CERTIFICATE" as const,
      originalFilename: "DEMO_Income_Certificate_Synthetic.pdf",
      fixtureFilename: "demo-income-certificate.pdf",
      storagePath: "case_demo_nos_001/INCOME_CERTIFICATE/sample_income.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 0,
    },
    {
      id: "doc_demo_nos_passport_001",
      documentType: "PASSPORT" as const,
      originalFilename: "DEMO_Passport_Synthetic.pdf",
      fixtureFilename: "demo-passport.pdf",
      storagePath: "case_demo_nos_001/PASSPORT/sample_passport.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 0,
    },
    {
      id: "doc_demo_nos_offer_001",
      documentType: "ADMISSION_OFFER_LETTER" as const,
      originalFilename: "DEMO_Admission_Offer_Synthetic.pdf",
      fixtureFilename: "demo-admission-offer.pdf",
      storagePath: "case_demo_nos_001/ADMISSION_OFFER_LETTER/sample_offer.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 0,
    },
    {
      id: "doc_demo_nos_degree_001",
      documentType: "DEGREE_TRANSCRIPT" as const,
      originalFilename: "DEMO_Degree_Transcript_Synthetic.pdf",
      fixtureFilename: "demo-degree-transcript.pdf",
      storagePath: "case_demo_nos_001/DEGREE_TRANSCRIPT/sample_transcript.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 0,
    },
  ];

  // Seed files into the same safe local-storage path used by document preview.
  const sampleFileSizes = new Map<string, number>();
  for (const doc of sampleDocs) {
    const samplePdfPath = path.resolve(process.cwd(), "tests/fixtures/documents", doc.fixtureFilename);
    const samplePdf = fs.readFileSync(samplePdfPath);
    sampleFileSizes.set(doc.id, samplePdf.length);
    await defaultStorage.upload(doc.storagePath, samplePdf, {
      originalName: doc.originalFilename,
      mimeType: doc.mimeType,
    });

    // Also upload rendered high-res PNG preview for pixel-perfect bounding box alignment
    const samplePngFilename = doc.fixtureFilename.replace(/\.pdf$/, ".png");
    const samplePngPath = path.resolve(process.cwd(), "tests/fixtures/documents", samplePngFilename);
    if (fs.existsSync(samplePngPath)) {
      const samplePng = fs.readFileSync(samplePngPath);
      const pngStoragePath = doc.storagePath.replace(/\.pdf$/, ".png");
      await defaultStorage.upload(pngStoragePath, samplePng, {
        originalName: doc.originalFilename.replace(/\.pdf$/, ".png"),
        mimeType: "image/png",
      });
    }
  }

  for (const doc of sampleDocs) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: {
        caseDossierId: nosCase.id,
        documentType: doc.documentType,
        originalFilename: doc.originalFilename,
        storagePath: doc.storagePath,
        mimeType: doc.mimeType,
        fileSizeBytes: sampleFileSizes.get(doc.id)!,
        uploadedById: "usr_demo_applicant_001",
        version: 1,
        isLatestVersion: true,
        processingStatus: "COMPLETED",
        classifiedAs: doc.documentType,
        classificationConfidence: 0.94,
        pageCount: 1,
      },
      create: {
        id: doc.id,
        caseDossierId: nosCase.id,
        documentType: doc.documentType,
        originalFilename: doc.originalFilename,
        storagePath: doc.storagePath,
        mimeType: doc.mimeType,
        fileSizeBytes: sampleFileSizes.get(doc.id)!,
        uploadedById: "usr_demo_applicant_001",
        version: 1,
        isLatestVersion: true,
        processingStatus: "COMPLETED",
        classifiedAs: doc.documentType,
        classificationConfidence: 0.94,
        pageCount: 1,
      },
    });

    // Seed processing job
    await prisma.documentProcessingJob.upsert({
      where: { documentId: doc.id },
      update: {
        status: "COMPLETED",
        attemptCount: 1,
        completedAt: SEEDED_AT,
      },
      create: {
        documentId: doc.id,
        status: "COMPLETED",
        attemptCount: 1,
        maxAttempts: 3,
        startedAt: SEEDED_AT,
        completedAt: SEEDED_AT,
      },
    });
  }

  // Seed realistic ExtractedFields with verified bounding box geometry for demo case verification
  const demoFields = [
    // 1. Caste Certificate Fields
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "tribeName",
      rawValue: "Demo Tribal Community",
      normalizedValue: "DEMO TRIBAL COMMUNITY",
      confidenceScore: 0.94,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.295,
      boundingBoxWidth: 0.32,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Community: Demo Tribal Community",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "REGEX",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "casteCategory",
      rawValue: "Scheduled Tribe (ST)",
      normalizedValue: "ST",
      confidenceScore: 0.96,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.345,
      boundingBoxWidth: 0.27,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Category: Scheduled Tribe (ST)",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "certificateNumber",
      rawValue: "DEMO-ST-0001",
      normalizedValue: "DEMO-ST-0001",
      confidenceScore: 0.98,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.395,
      boundingBoxWidth: 0.27,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Certificate No: DEMO-ST-0001",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "REGEX",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "issueDate",
      rawValue: "01/04/2026",
      normalizedValue: "2026-04-01",
      confidenceScore: 0.95,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.445,
      boundingBoxWidth: 0.21,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Issue Date: 01/04/2026",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "DATE_PARSER",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "issuingAuthority",
      rawValue: "Example Revenue Office",
      normalizedValue: "EXAMPLE REVENUE OFFICE",
      confidenceScore: 0.72,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.495,
      boundingBoxWidth: 0.37,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Issuing Authority: Example Revenue Office",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },

    // 2. Income Certificate Fields
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "annualFamilyIncome",
      rawValue: "INR 450,000 per annum",
      normalizedValue: "450000",
      confidenceScore: 0.93,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.295,
      boundingBoxWidth: 0.41,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Annual Family Income: INR 450,000 per annum",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "NUMERIC_CURRENCY",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "financialYear",
      rawValue: "2025-2026",
      normalizedValue: "2025-2026",
      confidenceScore: 0.91,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.345,
      boundingBoxWidth: 0.24,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Financial Year: 2025-2026",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "REGEX",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "certificateNumber",
      rawValue: "DEMO-INCOME-0001",
      normalizedValue: "DEMO-INCOME-0001",
      confidenceScore: 0.95,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.395,
      boundingBoxWidth: 0.32,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Certificate No: DEMO-INCOME-0001",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "REGEX",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "issueDate",
      rawValue: "01/04/2026",
      normalizedValue: "2026-04-01",
      confidenceScore: 0.94,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.445,
      boundingBoxWidth: 0.21,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Issue Date: 01/04/2026",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "DATE_PARSER",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "issuingAuthority",
      rawValue: "Example Revenue Office",
      normalizedValue: "EXAMPLE REVENUE OFFICE",
      confidenceScore: 0.45,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.495,
      boundingBoxWidth: 0.37,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Issuing Authority: Example Revenue Office",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },

    // 3. Passport Fields
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "applicantName",
      rawValue: "RAMESH KUMAR MEENA",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.96,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.280,
      boundingBoxWidth: 0.28,
      boundingBoxHeight: 0.080,
      sourceSnippet: "Surname: MEENA / Given Name: RAMESH KUMAR",
      extractorProvider: "mrz-ocr",
      extractorVersion: "2.1.0",
      extractionMethod: "MRZ_PARSER",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "passportNumber",
      rawValue: "D0000000",
      normalizedValue: "D0000000",
      confidenceScore: 0.98,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.380,
      boundingBoxWidth: 0.21,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Passport No: D0000000",
      extractorProvider: "mrz-ocr",
      extractorVersion: "2.1.0",
      extractionMethod: "MRZ_PARSER",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "nationality",
      rawValue: "INDIAN (SYNTHETIC)",
      normalizedValue: "INDIAN",
      confidenceScore: 0.99,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.430,
      boundingBoxWidth: 0.30,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Nationality: INDIAN (SYNTHETIC)",
      extractorProvider: "mrz-ocr",
      extractorVersion: "2.1.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "dateOfBirth",
      rawValue: "15/05/1998",
      normalizedValue: "1998-05-15",
      confidenceScore: 0.95,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.480,
      boundingBoxWidth: 0.22,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Date of Birth: 15/05/1998",
      extractorProvider: "mrz-ocr",
      extractorVersion: "2.1.0",
      extractionMethod: "DATE_PARSER",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "placeOfBirth",
      rawValue: "Demo District",
      normalizedValue: "DEMO DISTRICT",
      confidenceScore: 1.0,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.530,
      boundingBoxWidth: 0.25,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Place of Birth: Demo District",
      extractorProvider: "human-verified",
      extractorVersion: "1.0.0",
      extractionMethod: "MANUAL_VERIFICATION",
      extractedBy: "HUMAN_OVERRIDE",
    },

    // 4. Offer Letter Fields
    {
      documentId: "doc_demo_nos_offer_001",
      fieldKey: "applicantName",
      rawValue: "Ramesh Kumar Meena",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.92,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.230,
      boundingBoxWidth: 0.26,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Name: Ramesh Kumar Meena",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "REGEX",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_offer_001",
      fieldKey: "courseName",
      rawValue: "Ph.D. in Physics",
      normalizedValue: "Ph.D. in Physics",
      confidenceScore: 0.94,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.280,
      boundingBoxWidth: 0.31,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Offer of Admission: Ph.D. in Physics",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_offer_001",
      fieldKey: "institutionName",
      rawValue: "Example Research University",
      normalizedValue: "EXAMPLE RESEARCH UNIVERSITY",
      confidenceScore: 0.95,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.330,
      boundingBoxWidth: 0.35,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Institution: Example Research University",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_offer_001",
      fieldKey: "academicSession",
      rawValue: "2026-2027",
      normalizedValue: "2026-2027",
      confidenceScore: 0.91,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.430,
      boundingBoxWidth: 0.27,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Academic Session: 2026-2027",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },

    // 5. Degree Transcript Fields
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "applicantName",
      rawValue: "Ramesh Kumar Meena",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.94,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.230,
      boundingBoxWidth: 0.26,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Name: Ramesh Kumar Meena",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "REGEX",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "universityName",
      rawValue: "Example State University",
      normalizedValue: "EXAMPLE STATE UNIVERSITY",
      confidenceScore: 0.93,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.280,
      boundingBoxWidth: 0.31,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Institution: Example State University",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "programName",
      rawValue: "Master of Science in Physics",
      normalizedValue: "Master of Science in Physics",
      confidenceScore: 0.95,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.330,
      boundingBoxWidth: 0.33,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Program: Master of Science in Physics",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "KEYWORD_PROXIMITY",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "percentageMarks",
      rawValue: "74.28 percent",
      normalizedValue: "74.28",
      confidenceScore: 0.95,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.430,
      boundingBoxWidth: 0.23,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Semester 4: 74.28 percent",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "PERCENTAGE_PARSER",
      extractedBy: "AI",
    },
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "cgpa",
      rawValue: "7.43",
      normalizedValue: "7.43",
      confidenceScore: 0.96,
      boundingBoxX: 0.0908,
      boundingBoxY: 0.480,
      boundingBoxWidth: 0.33,
      boundingBoxHeight: 0.032,
      sourceSnippet: "Cumulative Grade Point Average: 7.43",
      extractorProvider: "tesseract-ocr",
      extractorVersion: "5.3.0",
      extractionMethod: "REGEX",
      extractedBy: "AI",
    },
  ];

  await prisma.extractedField.deleteMany({
    where: { documentId: { in: sampleDocs.map((d) => d.id) } },
  });

  for (const [index, f] of demoFields.entries()) {
    await prisma.extractedField.create({
      data: {
        id: `ext_demo_nos_${String(index + 1).padStart(3, "0")}`,
        documentId: f.documentId,
        fieldKey: f.fieldKey,
        rawValue: f.rawValue,
        normalizedValue: f.normalizedValue,
        confidenceScore: f.confidenceScore,
        pageNumber: 1,
        boundingBoxX: f.boundingBoxX,
        boundingBoxY: f.boundingBoxY,
        boundingBoxWidth: f.boundingBoxWidth,
        boundingBoxHeight: f.boundingBoxHeight,
        sourceSnippet: f.sourceSnippet,
        extractorProvider: f.extractorProvider,
        extractorVersion: f.extractorVersion,
        extractionMethod: f.extractionMethod,
        extractedBy: (f.extractedBy as "AI" | "HUMAN_OVERRIDE") || "AI",
        createdAt: SEEDED_AT,
      },
    });
  }

  // Reset one explainable synthetic deficiency so the applicant correction flow is demoable.
  const demoDeficiency = {
    id: "def_demo_nos_income_illegible_001",
    caseDossierId: nosCase.id,
    issuedById: "usr_demo_officer_001",
    documentType: "INCOME_CERTIFICATE" as const,
    deficiencyType: "DOCUMENT_ILLEGIBLE" as const,
    description:
      "The uploaded synthetic Income Certificate sample does not expose readable certificate evidence. Please provide a clearer document for officer review.",
    responseDeadline: new Date("2026-10-15T23:59:59.000Z"),
  };
  await prisma.deficiency.upsert({
    where: { id: demoDeficiency.id },
    update: {
      ...demoDeficiency,
      issuedAt: SEEDED_AT,
      status: "OPEN",
      resolvedAt: null,
      recheckStatus: null,
      recheckAt: null,
      officerResolutionRemark: null,
      applicantResponseText: null,
      applicantRespondedAt: null,
      targetDocumentId: "doc_demo_nos_income_001",
      ruleResultId: null,
    },
    create: {
      ...demoDeficiency,
      issuedAt: SEEDED_AT,
      targetDocumentId: "doc_demo_nos_income_001",
      status: "OPEN",
    },
  });

  await prisma.caseDossier.update({
    where: { id: nosCase.id },
    data: {
      currentStage: "DEFICIENCY_PENDING",
      currentState: "ACTION_REQUIRED",
      responsibleActor: "APPLICANT",
      blocker: "Income certificate evidence needs a clearer replacement.",
      nextAction: "Upload a clearer synthetic income certificate for targeted recheck.",
      deadline: demoDeficiency.responseDeadline,
    },
  });

  // Audit log for NOS submission
  await prisma.auditLog.upsert({
    where: { id: "audit_seed_nos_submission_001" },
    update: {
      caseDossierId: nosCase.id,
      actorId: "usr_demo_applicant_001",
      actorRole: "APPLICANT",
      actionType: "APPLICATION_SUBMITTED",
      previousState: "DRAFT",
      newState: "SUBMITTED",
      payload: {
        applicationNumber: nosApp.applicationNumber,
        caseNumber: nosCase.caseNumber,
        schemeCode: "NOS",
      },
    },
    create: {
      id: "audit_seed_nos_submission_001",
      createdAt: SEEDED_AT,
      caseDossierId: nosCase.id,
      actorId: "usr_demo_applicant_001",
      actorRole: "APPLICANT",
      actionType: "APPLICATION_SUBMITTED",
      previousState: "DRAFT",
      newState: "SUBMITTED",
      payload: {
        applicationNumber: nosApp.applicationNumber,
        caseNumber: nosCase.caseNumber,
        schemeCode: "NOS",
      },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "audit_seed_nos_income_deficiency_001" },
    update: {
      caseDossierId: nosCase.id,
      actorId: "usr_demo_officer_001",
      actorRole: "VERIFICATION_OFFICER",
      actionType: "DEFICIENCY_ISSUED",
      newState: "DEFICIENCY_PENDING",
      payload: {
        deficiencyId: demoDeficiency.id,
        deficiencyType: demoDeficiency.deficiencyType,
        documentType: demoDeficiency.documentType,
        synthetic: true,
      },
    },
    create: {
      id: "audit_seed_nos_income_deficiency_001",
      createdAt: SEEDED_AT,
      caseDossierId: nosCase.id,
      actorId: "usr_demo_officer_001",
      actorRole: "VERIFICATION_OFFICER",
      actionType: "DEFICIENCY_ISSUED",
      newState: "DEFICIENCY_PENDING",
      payload: {
        deficiencyId: demoDeficiency.id,
        deficiencyType: demoDeficiency.deficiencyType,
        documentType: demoDeficiency.documentType,
        synthetic: true,
      },
    },
  });

  // ==========================================
  // PHASE 2K: POST-SELECTION SCHOLAR REGISTRY SEED
  // ==========================================
  console.log("🎓 Seeding Phase 2K Post-Selection Scholar Registry & Renewal data...");
  const postSelectionRecord = await prisma.postSelectionRecord.upsert({
    where: { caseDossierId: nosCase.id },
    update: {
      awardedAmount: 3600000.0,
      scholarStatus: "ACTIVE",
      currentYear: 1,
      totalTenureYears: 3,
      researchInstitution: "University of Oxford, Department of Physics",
      supervisorName: "Prof. Alistair Finch",
      fellowshipType: "Doctoral Overseas Fellow (NOS)",
      disbursementStatus: "FIRST_INSTALLMENT",
      pfmsReferenceId: "PFMS-2026-NOS-009182",
      continuationApproved: true,
      remarks: "Awarded under NOS FY 2026 Scheduled Tribe Merit Quota.",
    },
    create: {
      id: "psr_demo_nos_001",
      caseDossierId: nosCase.id,
      applicantProfileId: "prof_demo_applicant_001",
      schemeVersionId: "sch_ver_nos_2025_1",
      awardedAmount: 3600000.0,
      tenureStartDate: new Date("2025-10-01"),
      tenureEndDate: new Date("2028-09-30"),
      researchInstitution: "University of Oxford, Department of Physics",
      supervisorName: "Prof. Alistair Finch",
      fellowshipType: "Doctoral Overseas Fellow (NOS)",
      disbursementStatus: "FIRST_INSTALLMENT",
      scholarStatus: "ACTIVE",
      currentYear: 1,
      totalTenureYears: 3,
      pfmsReferenceId: "PFMS-2026-NOS-009182",
      renewalDueDate: new Date("2026-10-01"),
      continuationApproved: true,
      remarks: "Awarded under NOS FY 2026 Scheduled Tribe Merit Quota.",
    },
  });

  // Seed Renewals
  await prisma.scholarRenewal.deleteMany({
    where: { postSelectionRecordId: postSelectionRecord.id },
  });

  await prisma.scholarRenewal.createMany({
    data: [
      {
        id: "ren_demo_nos_001",
        postSelectionRecordId: postSelectionRecord.id,
        renewalCycle: 1,
        academicYear: "2025-2026",
        status: "APPROVED",
        progressSummary:
          "Completed experimental coursework and preliminary spectroscopy calibration.",
        publicationsCount: 1,
        conferencesAttended: 1,
        supervisorRecommendation: "RECOMMENDED",
        supervisorRemarks: "Outstanding progress on quantum optics simulations.",
        submissionDate: new Date("2025-11-15"),
        reviewDate: new Date("2025-11-20"),
        officerRemarks: "Year 1 tenure continuation approved by Verification Officer.",
        reviewedById: "usr_demo_officer_001",
      },
      {
        id: "ren_demo_nos_002",
        postSelectionRecordId: postSelectionRecord.id,
        renewalCycle: 2,
        academicYear: "2026-2027",
        status: "UPCOMING",
      },
      {
        id: "ren_demo_nos_003",
        postSelectionRecordId: postSelectionRecord.id,
        renewalCycle: 3,
        academicYear: "2027-2028",
        status: "UPCOMING",
      },
    ],
  });

  // Seed Disbursements
  await prisma.disbursementRecord.deleteMany({
    where: { postSelectionRecordId: postSelectionRecord.id },
  });

  await prisma.disbursementRecord.createMany({
    data: [
      {
        id: "disb_demo_nos_001",
        postSelectionRecordId: postSelectionRecord.id,
        installmentNumber: 1,
        financialYear: "2025-2026",
        amount: 1200000.0,
        status: "PAID",
        pfmsReference: "PFMS-2025-NOS-009182",
        scheduledDate: new Date("2025-10-15"),
        disbursedAt: new Date("2025-10-20"),
        remarks: "Year 1 fellowship living & tuition grant disbursed.",
      },
      {
        id: "disb_demo_nos_002",
        postSelectionRecordId: postSelectionRecord.id,
        installmentNumber: 2,
        financialYear: "2026-2027",
        amount: 1200000.0,
        status: "PENDING",
        scheduledDate: new Date("2026-10-15"),
        remarks: "Year 2 fellowship grant contingent on Year 2 renewal approval.",
      },
      {
        id: "disb_demo_nos_003",
        postSelectionRecordId: postSelectionRecord.id,
        installmentNumber: 3,
        financialYear: "2027-2028",
        amount: 1200000.0,
        status: "PENDING",
        scheduledDate: new Date("2027-10-15"),
        remarks: "Year 3 final grant contingent on Year 3 renewal approval.",
      },
    ],
  });

  console.log(
    "✅ Seed completed successfully with full Phase 2E Application and Phase 2K Post-Selection configurations!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
