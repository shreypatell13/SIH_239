# TribalScholar AI local demo

TribalScholar AI is a synthetic scholarship case-management demo. PFMS, DigiLocker, NSP, and MoTA providers run in **MOCK / DEMO** mode; they do not connect to government systems.

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

Open [http://localhost:3000](http://localhost:3000). Seeded sample PDFs are written under the ignored `uploads/documents/` storage root so protected preview routes work.

## Demo logins

These synthetic local-only accounts are created by `npm run prisma:seed`:

| Persona              | Email                                | Demo password        |
| -------------------- | ------------------------------------ | -------------------- |
| Applicant            | `ramesh.meena@example.tribal.gov.in` | `Demo@Applicant2026` |
| Verification Officer | `priya.sharma@tribal.gov.in`         | `Demo@Officer2026`   |
| Scheme Admin         | `rajesh.verma@tribal.gov.in`         | `Demo@Admin2026`     |
| Operations Director  | `sunita.rao@tribal.gov.in`           | `Demo@Director2026`  |

Do not reuse these demo passwords outside the local synthetic environment.

## Suggested walkthrough

1. Sign in as the applicant. Review schemes, resume the seeded NFST draft, and view the submitted NOS case and its explainable income-document deficiency.
2. Upload a synthetic PDF as correction evidence. Targeted processing runs; evidence that does not support resolution remains open for officer review.
3. Sign in as the Verification Officer. Open the assigned NOS case, inspect its evidence and timeline, then resolve or continue review with an auditable human action.
4. Sign in as the Operations Director. Review the database-backed control tower, bottleneck triggers, officer workload, deficiencies, and case drill-down.
5. Sign in as the Scheme Admin to inspect generic scheme configuration. As an officer, open `/post-selection` to review the synthetic scholar, renewal cycles, and simulated disbursements.
6. Review the integration status card. Each external provider is explicitly marked MOCK / DEMO.

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
