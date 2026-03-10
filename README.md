# Meta Cares Nursing

Meta Cares Nursing is a Vite + React + Supabase application for Belgian home nursing operations. It includes nurse workflows, patient access, coordination, billing, consent tracking, BelRAI support, wound follow-up, and hourly pilot billing logic.

## Current status

This repository is not a production-ready eHealth integration package on its own.

The Welcome Pack audit completed on 2026-03-09 found that the codebase contains the right product areas, but production compliance still depends on:

- formal eHealth onboarding and approval evidence,
- sector-specific connector validation for MyCareNet, eHealthBox, IAM/certificates, Vitalink, and related services,
- removal of remaining mock or fallback behavior in several healthcare-facing screens,
- alignment between the checked-in Supabase schema and the live Supabase project.

The detailed audit is tracked in [docs/welcome-pack-compliance-audit.md](C:\Users\taham\meta-cares-nursing\docs\welcome-pack-compliance-audit.md).

## Stack

- React 19
- TypeScript
- Vite
- Supabase
- TanStack Query
- Framer Motion

## Local development

Install dependencies and run the app:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm test
npm run build
```

## Environment

The frontend expects Supabase credentials in local environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Auth, RLS, and most clinical workflows depend on a live Supabase project with the matching migrations applied.

## Compliance and healthcare scope

The Welcome Pack and official Belgian healthcare references require more than UI coverage. Production rollout needs:

- approved use of each eHealth service in scope,
- legal basis and sector-committee alignment where applicable,
- documented planning and technical architecture,
- auditable access controls and patient data governance,
- continuity arrangements and connector operations,
- validated identity and certificate handling.

This repository now includes a documented gap assessment, and the live Supabase project can be repaired with replayed module-specific migrations. The app still contains connector placeholders and mocked dashboards that must be replaced before claiming production compliance.
