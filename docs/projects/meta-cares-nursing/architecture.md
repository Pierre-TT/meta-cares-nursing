# Architecture Overview

## Frontend
- **App shell** in `src/App.tsx` with TanStack Router, role-aware layouts (`layouts/` for Admin, Nurse, Patient, Coordinator).
- **Design system** components in `src/design-system/` used across dashboards.
- **State** handled via Zustand stores (`src/stores/*`) with Supabase session hydration in `src/lib/supabase.ts`.
- **Data fetching** via Supabase client + TanStack Query hooks (`src/hooks/*`). When connectors are not ready, hooks fall back to `mock*` datasets and are now gated by `featureFlags`.

## Backend / Supabase
- **Database**: Supabase Postgres with domain tables for BelRAI, wound assessments, eAgreement, hourly pilot billing, consent/audit logs.
- **Edge Functions**: located in `supabase/functions/` (examples: consent sync, billing repair, BelRAI ingestion).
- **Migrations**: `supabase/migrations/` includes schema definitions plus `*_repair.sql` scripts to replay missing modules.
- **RLS**: enforced on healthcare data tables; repair scripts must be run with service role.

## Modules
| Module | Location | Notes |
| --- | --- | --- |
| BelRAI & HAD | `src/lib/belraiSupabase.ts`, `supabase/migrations/*belrai*` | Fallback to mocked patients until Vitalink connector hooked up |
| Billing (hourly pilot) | `src/pages/billing/*`, `supabase/migrations/*hourly*` | eAgreement + pilot tables; UI currently mock-gated |
| Coordinator AI widgets | `src/components/coordinator/*` | Demo-only; now hidden in prod |
| eHealthBox & patient messaging | `src/pages/nurse/EHealthBoxPage.tsx`, `src/pages/patient/PatientMessagesPage.tsx` | Demo UI relying on `mockMessages` |
| NFC eID flow | `src/pages/nurse/NfcIdentifyPage.tsx`, `src/lib/eid.ts` | Uses `mockNfcRead()` placeholder |

## Feature Flags
`src/lib/featureFlags.ts` exposes `enableHealthcareMocks`, default true in dev, false in prod (controlled by `VITE_ENABLE_HEALTHCARE_MOCKS`).

## Observability
- No dedicated logging agent yet—should forward Supabase Edge Function logs to monitoring stack (TBD).
- Admin dashboards show compliance/security metrics sourced from Supabase tables.

## External Services
- Supabase (DB/Auth/Storage/Edge)
- eHealth connectors (Vitalink, MyCareNet, eHealthBox, IAM) – planned
- Belgian compliance (BelRAI, eFact) – data models ready, connectors pending.
