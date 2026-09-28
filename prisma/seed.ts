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

  console.log("✅ Seed completed successfully with full Phase 2D Scheme Studio configurations!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
