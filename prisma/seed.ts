import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting TribalScholar AI Phase 2B database seed...");

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
  // Pre-computed or generated bcrypt hashes with cost factor 12
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

  // NFST SchemeVersion v2025.1
  await prisma.schemeVersion.upsert({
    where: {
      schemeId_versionNumber: {
        schemeId: nfstScheme.id,
        versionNumber: 1,
      },
    },
    update: {
      isActive: true,
    },
    create: {
      id: "sch_ver_nfst_2025_1",
      schemeId: nfstScheme.id,
      versionNumber: 1,
      effectiveFrom: new Date("2025-04-01"),
      effectiveTo: null,
      isActive: true,
      publishedById: "usr_demo_admin_001",
      formSchema: {
        title: "NFST Fellowship Application (Demo Specification)",
        fields: [
          { name: "researchTopic", type: "text", label: "Proposed Research Topic", required: true },
          { name: "degreeType", type: "select", options: ["Ph.D.", "M.Phil."], required: true },
          {
            name: "universityName",
            type: "text",
            label: "Admitting University / Institute",
            required: true,
          },
          { name: "admissionDate", type: "date", label: "Date of Admission", required: true },
        ],
      },
      documentRequirements: {
        mandatoryDocuments: [
          {
            type: "CASTE_CERTIFICATE",
            label: "Scheduled Tribe Certificate",
            allowedMime: ["application/pdf", "image/jpeg"],
            maxBytes: 5242880,
          },
          {
            type: "DEGREE_TRANSCRIPT",
            label: "Post-Graduate Degree Marksheet / Certificate",
            allowedMime: ["application/pdf"],
            maxBytes: 5242880,
          },
          {
            type: "ADMISSION_OFFER_LETTER",
            label: "Proof of Admission / Registration",
            allowedMime: ["application/pdf"],
            maxBytes: 5242880,
          },
        ],
      },
      eligibilityRules: {
        maxAgeYears: 36, // 31 standard + 5 ST relaxation
        minQualifyingPercentage: 55.0,
        requiresStCategory: true,
        maxIncomeCeilingInr: null, // No explicit income ceiling for NFST merit fellowship
      },
      workflowConfig: {
        slaTargetDays: 5,
        stages: [
          "SUBMITTED",
          "AUTOMATED_VERIFICATION",
          "OFFICER_REVIEW",
          "COMMITTEE_SELECTION",
          "SANCTIONED",
        ],
      },
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

  // NOS SchemeVersion v2025.1
  await prisma.schemeVersion.upsert({
    where: {
      schemeId_versionNumber: {
        schemeId: nosScheme.id,
        versionNumber: 1,
      },
    },
    update: {
      isActive: true,
    },
    create: {
      id: "sch_ver_nos_2025_1",
      schemeId: nosScheme.id,
      versionNumber: 1,
      effectiveFrom: new Date("2025-04-01"),
      effectiveTo: null,
      isActive: true,
      publishedById: "usr_demo_admin_001",
      formSchema: {
        title: "NOS Overseas Scholarship Application (Demo Specification)",
        fields: [
          {
            name: "foreignUniversity",
            type: "text",
            label: "Foreign University Name",
            required: true,
          },
          { name: "countryOfStudy", type: "text", label: "Country of Study", required: true },
          { name: "courseName", type: "text", label: "Degree / Course Name", required: true },
          {
            name: "universityQsRank",
            type: "number",
            label: "QS World University Rank",
            required: true,
          },
          {
            name: "annualFamilyIncomeInr",
            type: "number",
            label: "Total Annual Family Income (INR)",
            required: true,
          },
        ],
      },
      documentRequirements: {
        mandatoryDocuments: [
          {
            type: "CASTE_CERTIFICATE",
            label: "Valid ST Certificate",
            allowedMime: ["application/pdf", "image/jpeg"],
            maxBytes: 5242880,
          },
          {
            type: "INCOME_CERTIFICATE",
            label: "Competent Authority Family Income Certificate",
            allowedMime: ["application/pdf"],
            maxBytes: 5242880,
          },
          {
            type: "ADMISSION_OFFER_LETTER",
            label: "Unconditional Admission Offer Letter",
            allowedMime: ["application/pdf"],
            maxBytes: 5242880,
          },
          {
            type: "PASSPORT",
            label: "Valid Indian Passport",
            allowedMime: ["application/pdf"],
            maxBytes: 5242880,
          },
        ],
      },
      eligibilityRules: {
        maxAgeYears: 35,
        minQualifyingPercentage: 60.0,
        maxIncomeCeilingInr: 800000.0, // INR 8 Lakhs ceiling
        maxForeignUniversityRank: 500, // Top 500 QS ranking
        requiresStCategory: true,
      },
      workflowConfig: {
        slaTargetDays: 7,
        stages: [
          "SUBMITTED",
          "AUTOMATED_VERIFICATION",
          "OFFICER_REVIEW",
          "COMMITTEE_SELECTION",
          "SANCTIONED",
        ],
      },
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
