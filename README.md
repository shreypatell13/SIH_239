# TribalScholar AI local demo

TribalScholar AI is a synthetic scholarship case-management demo. PFMS, DigiLocker, NSP, and MoTA providers run in **MOCK / DEMO** mode; they do not connect to government systems.

Phase 2M final validation is complete. On 2026-09-29, both connected browser lifecycles passed, a newly created disposable PostgreSQL database migrated and seeded successfully, and the final regression run passed (215/215 Vitest tests and 66/66 Playwright tests). The existing configured database was not reset or modified. See `current-state.md` for detailed evidence and limitations.

## Requirements

- Node.js 20 or newer and npm.
- PostgreSQL 17 reachable at `localhost:5433`, either as a local Windows service or through Docker Compose. Use one server at a time on that port.
- The project-local `.env` file, which is ignored by Git.

## First-time setup

From PowerShell in the repository root:

```powershell
Copy-Item .env.example .env
npm ci
```

Edit `.env` and set a unique local `NEXTAUTH_SECRET`. The values in `.env.example` are development defaults only. Never commit `.env`.

Start one PostgreSQL 17 server:

```powershell
# Docker option (only if port 5433 is not already used by a local PostgreSQL service)
npm run docker:up

# Or use the already installed Windows service instead of Docker
Get-Service postgresql-x64-17
```

The database URL in `.env.example` points to `tribalscholar_db` on port `5433`. Apply the checked-in migrations, seed the synthetic personas and demo records, then start the app:

```powershell
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Clearly synthetic, certificate-style seed PDFs are written under the ignored `uploads/documents/` storage root so protected preview routes work. The fixtures are marked DEMO ONLY and contain fake values; no real personal documents are used.

## Demo logins

These synthetic local-only accounts are created by `npm run prisma:seed`:

| Persona              | Email                                | Demo password        |
| -------------------- | ------------------------------------ | -------------------- |
| Applicant            | `ramesh.meena@example.tribal.gov.in` | `Demo@Applicant2026` |
| Verification Officer | `priya.sharma@tribal.gov.in`         | `Demo@Officer2026`   |
| Scheme Admin         | `rajesh.verma@tribal.gov.in`         | `Demo@Admin2026`     |
| Operations Director  | `sunita.rao@tribal.gov.in`           | `Demo@Director2026`  |

Do not reuse these demo passwords outside the local synthetic environment.

## Verified final walkthrough

1. **Applicant:** Sign in, select NFST, complete the dynamic application, upload the synthetic certificate documents, review OCR/extraction and readiness, and submit.
2. **Verification:** Sign in as the Verification Officer, open the submitted case, review its uploaded evidence and extracted fields, and issue a documented deficiency.
3. **Deficiency/Recheck:** Return as the applicant, upload replacement evidence against the deficiency, and follow its targeted recheck result.
4. **Officer decision:** Return as the officer, inspect the recheck and timeline, then make the final human decision. The decision and actions appear in the audit trail.
5. **Management analytics:** Sign in as the Operations Director and review the control tower, bottleneck/aging views, workload, and case drill-down. The integrations card labels external providers MOCK / DEMO.
6. **Scholar registry:** Open `/post-selection`, locate seeded scholar Ramesh Meena (NOS), and inspect the scholar detail.
7. **Renewal:** Submit the seeded next-cycle renewal as the applicant, then review and approve it as an officer.
8. **Disbursement:** Update the next simulated installment to PAID and inspect the renewal and disbursement audit events.

The connected applicant flow and connected seeded-scholar flow are separate browser scenarios and were also executed independently against fresh deterministic seeds. The rehearsal took approximately 16 seconds of active browser interaction, excluding database/application startup and narration.

## Reset and reseed

To restore the seeded demo records without dropping the database:

```powershell
npm run prisma:seed
```

The seed resets known demo-owned records and files, preserves other scheme versions, uses stable IDs/timestamps, and does not append duplicate seed audit events. User-created audit history is retained.

To completely recreate the configured local database, including migrations and seed data:

```powershell
npx prisma migrate reset --force
```

**This drops all data in the database selected by `DATABASE_URL` and then runs the seed.** Use only for a disposable local demo database. Re-seed after the test suite if you want to restore the initial walkthrough state.

## Verification commands

Run the production build before Playwright because the Playwright web server starts `next start`:

```powershell
npm run type-check
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
```

Tests use the configured PostgreSQL database and may change demo records. Run `npm run prisma:seed` afterward to restore the walkthrough state.

## Phase 2M verification notes

- Fresh environment rehearsal: created a blank, isolated local PostgreSQL database, deployed all five migrations, seeded it, started the production application for Playwright, verified all four demo personas and main routes, and reset/reseeded it. The project's active `DATABASE_URL` determines which database is affected; inspect it before any reset. The configured `tribalscholar_db` was left untouched during validation.
- PostgreSQL was already running as a native Windows service. Its running status and database connectivity were verified; it was not stopped/restarted. Docker startup was not exercised.
- Final regression results: TypeScript type-check PASS; ESLint PASS; Prettier check PASS; Vitest 22/22 files and 215/215 tests PASS; production build PASS (31 static pages/routes generated); Playwright 66/66 PASS, including the two complete lifecycle journeys.
- Government integrations remain mocked. PFMS status/reference values and DigiLocker, NSP, and MoTA behavior are synthetic and do not contact government systems.
