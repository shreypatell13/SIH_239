import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting TribalScholar AI Phase 2D database seed...");

  // ==========================================
  // 1. SYSTEM HEALTH RECORD
  // ==========================================
  await prisma.systemHealth.upsert({
    where: { id: "health_baseline_001" },
    update: { status: "OPERATIONAL", checkedAt: new Date() },
    create: {
      id: "health_baseline_001",
      checkName: "PostgreSQL Database Engine",
      status: "OPERATIONAL",
      checkedAt: new Date(),
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
    const passwordHash = bcrypt.hashSync(u.password, 12);
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

  // Clean up any test-published subsequent versions so canonical v1 is active
  await prisma.schemeVersion.deleteMany({
    where: {
      schemeId: nfstScheme.id,
      versionNumber: { gt: 1 },
    },
  });

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

  // Clean up any test-published subsequent versions so canonical v1 is active
  await prisma.schemeVersion.deleteMany({
    where: {
      schemeId: nosScheme.id,
      versionNumber: { gt: 1 },
    },
  });

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
      applicantProfileId_schemeVersionId: {
        applicantProfileId: "prof_demo_applicant_001",
        schemeVersionId: "sch_ver_nfst_2025_1",
      },
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
    },
    create: {
      id: "case_demo_nfst_001",
      applicationId: nfstApp.id,
      caseNumber: "CASE-NFST-2026-000101",
      currentStage: "DRAFT",
      currentState: "PENDING",
      responsibleActor: "APPLICANT",
      nextAction: "Complete the application form and upload required documents.",
    },
  });

  // Application 2: NOS Submitted Application with SUBMITTED CaseDossier
  const nosApp = await prisma.application.upsert({
    where: {
      applicantProfileId_schemeVersionId: {
        applicantProfileId: "prof_demo_applicant_001",
        schemeVersionId: "sch_ver_nos_2025_1",
      },
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
      nextAction: "Automated verification underway.",
    },
    create: {
      id: "case_demo_nos_001",
      applicationId: nosApp.id,
      caseNumber: "CASE-NOS-2026-000201",
      currentStage: "SUBMITTED",
      currentState: "PENDING",
      responsibleActor: "SYSTEM",
      nextAction: "Automated verification underway.",
    },
  });

  // Seed sample documents attached to the NOS case
  const sampleDocs = [
    {
      id: "doc_demo_nos_caste_001",
      documentType: "CASTE_CERTIFICATE" as const,
      originalFilename: "Ramesh_ST_Certificate_Rajasthan.pdf",
      storagePath: "case_demo_nos_001/CASTE_CERTIFICATE/sample_caste.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1048576,
    },
    {
      id: "doc_demo_nos_income_001",
      documentType: "INCOME_CERTIFICATE" as const,
      originalFilename: "Income_Certificate_FY25_26.pdf",
      storagePath: "case_demo_nos_001/INCOME_CERTIFICATE/sample_income.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 819200,
    },
    {
      id: "doc_demo_nos_passport_001",
      documentType: "PASSPORT" as const,
      originalFilename: "Indian_Passport_Ramesh_Z9876543.pdf",
      storagePath: "case_demo_nos_001/PASSPORT/sample_passport.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 2097152,
    },
    {
      id: "doc_demo_nos_offer_001",
      documentType: "ADMISSION_OFFER_LETTER" as const,
      originalFilename: "Oxford_Unconditional_Offer_Letter.pdf",
      storagePath: "case_demo_nos_001/ADMISSION_OFFER_LETTER/sample_offer.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1572864,
    },
    {
      id: "doc_demo_nos_degree_001",
      documentType: "DEGREE_TRANSCRIPT" as const,
      originalFilename: "MSc_Physics_Consolidated_Marksheet.pdf",
      storagePath: "case_demo_nos_001/DEGREE_TRANSCRIPT/sample_transcript.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1258291,
    },
  ];

  for (const doc of sampleDocs) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: {
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
        fileSizeBytes: doc.fileSizeBytes,
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
        completedAt: new Date(),
      },
      create: {
        documentId: doc.id,
        status: "COMPLETED",
        attemptCount: 1,
        maxAttempts: 3,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
  }

  // Seed realistic ExtractedFields for demo case verification
  const demoFields = [
    // Caste Certificate Fields
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "applicantName",
      rawValue: "RAMESH KUMAR MEENA",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.95,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "fatherName",
      rawValue: "RAMESHWAR MEENA",
      normalizedValue: "RAMESHWAR MEENA",
      confidenceScore: 0.92,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "casteCategory",
      rawValue: "Scheduled Tribe",
      normalizedValue: "ST",
      confidenceScore: 0.96,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "KEYWORD_PROXIMITY",
    },
    {
      documentId: "doc_demo_nos_caste_001",
      fieldKey: "tribeName",
      rawValue: "Meena",
      normalizedValue: "MEENA",
      confidenceScore: 0.94,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    // Income Certificate Fields
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "applicantName",
      rawValue: "RAMESH KUMAR MEENA",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.95,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "annualFamilyIncome",
      rawValue: "Rs. 4,50,000/-",
      normalizedValue: "450000",
      confidenceScore: 0.93,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    {
      documentId: "doc_demo_nos_income_001",
      fieldKey: "financialYear",
      rawValue: "2023-2024",
      normalizedValue: "2023-2024",
      confidenceScore: 0.9,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    // Passport Fields
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "passportNumber",
      rawValue: "Z9876543",
      normalizedValue: "Z9876543",
      confidenceScore: 0.98,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "MRZ",
    },
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "applicantName",
      rawValue: "RAMESH KUMAR MEENA",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.96,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    {
      documentId: "doc_demo_nos_passport_001",
      fieldKey: "nationality",
      rawValue: "INDIAN",
      normalizedValue: "INDIAN",
      confidenceScore: 0.99,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "KEYWORD_PROXIMITY",
    },
    // Offer Letter Fields
    {
      documentId: "doc_demo_nos_offer_001",
      fieldKey: "applicantName",
      rawValue: "RAMESH KUMAR MEENA",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.92,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    {
      documentId: "doc_demo_nos_offer_001",
      fieldKey: "institutionName",
      rawValue: "University of Oxford",
      normalizedValue: "UNIVERSITY OF OXFORD",
      confidenceScore: 0.95,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "KEYWORD_PROXIMITY",
    },
    // Degree Transcript Fields
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "applicantName",
      rawValue: "RAMESH KUMAR MEENA",
      normalizedValue: "RAMESH KUMAR MEENA",
      confidenceScore: 0.94,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "universityName",
      rawValue: "University of Delhi",
      normalizedValue: "UNIVERSITY OF DELHI",
      confidenceScore: 0.93,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "KEYWORD_PROXIMITY",
    },
    {
      documentId: "doc_demo_nos_degree_001",
      fieldKey: "percentageMarks",
      rawValue: "74.28 %",
      normalizedValue: "74.28",
      confidenceScore: 0.95,
      extractorProvider: "tesseract-js",
      extractorVersion: "5.1.1",
      extractionMethod: "REGEX",
    },
  ];

  await prisma.extractedField.deleteMany({
    where: { documentId: { in: sampleDocs.map((d) => d.id) } },
  });

  for (const f of demoFields) {
    await prisma.extractedField.create({
      data: {
        documentId: f.documentId,
        fieldKey: f.fieldKey,
        rawValue: f.rawValue,
        normalizedValue: f.normalizedValue,
        confidenceScore: f.confidenceScore,
        pageNumber: 1,
        extractorProvider: f.extractorProvider,
        extractorVersion: f.extractorVersion,
        extractionMethod: f.extractionMethod,
        extractedBy: "AI",
      },
    });
  }

  // Audit log for NOS submission
  await prisma.auditLog.create({
    data: {
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
