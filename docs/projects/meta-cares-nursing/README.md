# Meta Cares Nursing – Project Dossier

## Mission
Deliver a production-grade cockpit for Belgian home-nursing operations: care coordination, BelRAI assessments, wound follow-up, consent/audit tracing, hourly pilot billing, and eHealth connector surfaces (Vitalink, MyCareNet, eHealthBox, IAM).

## Product Pillars
1. **Clinical Workflows** – BelRAI, wound tracking, HAD episodes, patient messaging, visit planning.
2. **Billing & Compliance** – Hourly pilot billing summaries, eAgreement manager, consent registry, audit logging.
3. **Operations & Security** – Admin platform dashboards (incidents, RGPD, certificates, feature flags, UEBA), coordinator AI helpers.
4. **Patient / Family Portal** – ETA, reminders, secure conversations (currently demo-only behind mock flag).

## Tech Stack
- **Frontend**: Vite + React 19 + TypeScript, TanStack Router/Query, Framer Motion, Lucide.
- **Backend**: Supabase Postgres/Auth/Storage + Edge Functions (BelRAI repair, eAgreement, billing, etc.).
- **Design System**: custom components in `src/design-system` (Card, Badge, AnimatedPage, GradientHeader, etc.).
- **State/Data**: Zustand stores, Supabase client wrappers, `lib/platformData.ts` snapshot models.

## Environments
| Env | URL | Supabase project | Notes |
| --- | --- | --- | --- |
| Local | `npm run dev` | `supabase/migrations` applied to local docker or remote dev | `VITE_ENABLE_HEALTHCARE_MOCKS=true` by default |
| Staging | `staging.meta-cares-nursing.local` | **TODO** add project ID | Use real connectors but limited data; mocks disabled |
| Production | `app.meta-cares.healthcare` | **TODO** add project ID | All mocks must be off; connectors approved |

## Feature Flags
- `VITE_ENABLE_HEALTHCARE_MOCKS` (default true in dev, false in prod). Controls demo-only UIs: AI schedule optimizer, smart alert center, eHealthBox, nurse billing MyCareNet surfaces, NFC eID demo, patient chat.

## Compliance / Gaps
- Welcome Pack audit doc: `docs/welcome-pack-compliance-audit.md` (2026-03-09).
- Outstanding: real connectors (Vitalink/eHealthBox/MyCareNet), Supabase schema drift repairs, onboarding dossier + connector runbooks (see `connectors.md`).

## Directory Map
```
src/
  pages/        → route-level surfaces (nurse/admin/patient)
  components/   → shared widgets (AI helpers, alerts)
  lib/          → Supabase helpers, mock fallbacks, env flags
  stores/       → Zustand stores (auth, patient, coordinator)
supabase/
  migrations/   → schema + repair migrations
  functions/    → edge functions (BelRAI, eAgreement, etc.)
docs/
  welcome-pack-compliance-audit.md
  projects/meta-cares-nursing/* (this dossier)
```

## Ownership
- **Product**: Meta Cares Platform Team
- **Tech Lead**: _TBD_
- **Ops**: Supabase project + eHealth connectors admin
- **Compliance**: Provide onboarding evidence + connector approvals before go-live.
