# Live Project State — TribalScholar AI

**System:** TribalScholar AI (SIH Problem Statement 26239)  
**Tracking Mode:** Persistent Cross-Agent Memory

---

- **Current phase:** Phase 2 (Actual Engineering)
- **Current sub-phase:** Phase 2B (Database Schemas & Domain Models)
- **Current task:** Domain schema authoring, migration, repositories, seed configuration, and unit tests
- **Status:** Phase 2B COMPLETED & VERIFIED; Ready for Phase 2C
- **Last stable commit:** `cec4e9e` ("phase-2b: implement database schemas and domain models")
- **Last completed work:** Comprehensive domain model implemented across 13 Prisma models and 13 enums; canonical role rename propagated (`VERIFICATION_OFFICER`, `SCHEME_ADMIN`, `OPERATIONS_DIRECTOR`, and `APPLICANT`); SQL migration generated under `prisma/migrations/20260928000000_phase_2b_domain/migration.sql`; complete repository layer established under `src/server/repositories/`; deterministic seed script authored in `prisma/seed.ts`; 18/18 Vitest unit tests passing across 5 suites; ESLint, Prettier, and TypeScript strict checks 100% clean.
- **Current working features:**
  - Full case-management relational schema in `prisma/schema.prisma` with 13 models and 13 enums
  - Clear separation of `User` (auth identity) and `ApplicantProfile` (ST demographics)
  - Explicit decoupling of `Application` (immutable submission event) and `CaseDossier` (mutable lifecycle orchestrator)
  - Declarative scheme versioning via `Scheme` & `SchemeVersion` with JSONB form schemas, document matrices, and eligibility rules
  - Historical document tracking via `Document` versioning (`version`, `isLatestVersion`)
  - Clear demarcation between AI findings (`ExtractedField.extractedBy = AI`) and authoritative human actions
  - Tamper-evident, append-only `AuditLog` model
  - Post-selection continuation record model `PostSelectionRecord`
  - Server-side repository pattern under `src/server/repositories/` (`UserRepository`, `ApplicantRepository`, `SchemeRepository`, `CaseRepository`, `DocumentRepository`, `DeficiencyRepository`, `AuditRepository`)
  - Deterministic demo seed script in `prisma/seed.ts` for NFST and NOS
  - Vitest test suite with 18 tests passing (including 8 new domain and schema contract tests)
  - Next.js production build (`npm run build`) compiling cleanly (10/10 static pages)
- **Current blockers:** PostgreSQL Docker container (`tribalscholar_postgres` on host port 5433) is currently offline because the Docker Desktop daemon is not running. Migration SQL (`20260928000000_phase_2b_domain/migration.sql`) and seed script (`prisma/seed.ts`) are ready to apply as soon as Docker Desktop is active.
- **Current errors:** None
- **Files recently changed:**
  - `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts`
  - `src/server/auth/roles.ts`, `src/server/auth/session.ts`
  - `src/server/repositories/**`
  - `src/app/**`, `src/components/layout/nav-shell.tsx`
  - `tests/unit/rbac.test.ts`, `tests/unit/domain.test.ts`
  - `phases.md`, `current-state.md`
- **Tests run:** Vitest (5 test files, 18 tests), ESLint (`next lint`), Prettier (`prettier --check .`), TypeScript check (`tsc --noEmit`), Next.js production build (`next build`)
- **Tests passing:** 18/18 Vitest unit tests, 0 lint errors, 0 format issues, 0 TypeScript errors, 10/10 static pages built
- **Tests failing:** 0
- **Database verification status:**
  - Migration generated: YES (`prisma/migrations/20260928000000_phase_2b_domain/migration.sql`)
  - Migration applied to live DB: NO (awaiting Docker Desktop start for container on port 5433)
  - Seed script ready: YES (`prisma/seed.ts`)
  - Constraint review: `@@unique([applicantProfileId, schemeVersionId])` CONFIRMED as correct domain model
- **Exact next step:** Start Docker Desktop / PostgreSQL container, apply migration with `npx prisma migrate dev`, run `npm run prisma:seed`, then proceed to Phase 2C
- **Last verified:** 2026-09-28 (Local System Time)
