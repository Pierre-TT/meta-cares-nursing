# Welcome Pack compliance audit

Audit date: 2026-03-09

Document reviewed:

- `C:\Users\taham\Downloads\Welcome-Pack.pdf`

Official web sources reviewed:

- `https://www.ehealth.fgov.be/ehealthplatform/fr/service-ehealth`
- `https://www.ehealth.fgov.be/ehealthplatform/fr/service-ehealthbox`
- `https://www.ehealth.fgov.be/ehealthplatform/fr/service-iam`
- `https://www.ehealth.fgov.be/ehealthplatform/fr/business-continuity-plan`
- `https://www.mycarenet.be/fr/logiciels/infirmieres`
- `https://www.vitalink.be/`
- `https://www.belrai.org/`

## Requirement summary from the Welcome Pack

The Welcome Pack is not only a technical integration checklist. It also requires project and governance evidence from the software partner.

Key obligations identified in the document and validated against official service pages:

- The partner must study the Welcome Pack before project kickoff.
- Each new integration requires a unique project dossier and planning.
- eHealth must be contacted for any new project or scope extension.
- Access to eHealth services is limited to approved legal purposes and declared usage.
- Some projects require additional approval or sector-committee handling.
- Technical documentation, continuity planning, and connector readiness are expected.
- Identity, certificates, auditability, and consent handling are core compliance themes.

## Codebase findings

### Areas that are structurally present

- Role-based application shell and protected routes are implemented.
- Supabase-backed patient, visit, and care workflows exist.
- The codebase includes modules for BelRAI, eAgreement, wound assessment, consent history, and hourly pilot billing.
- The application already models audit logging and pseudonymisation helpers in Supabase.

### Areas that were not aligned with the live project

The live Supabase project reported migration history for multiple healthcare modules, but the corresponding tables were missing in production. The missing schema included:

- `belrai_assessments` and related BelRAI tables
- `wound_assessments`
- `eagreement_requests`
- `visit_hourly_billing_summaries` and related pilot billing tables
- `data_access_logs`
- `ehealth_consent_sync_logs`

This is a schema drift issue, not just a UI issue. The missing objects need to be replayed safely in the live Supabase project with new repair migrations instead of trusting the broken migration history.

### Areas still using mock or fallback behavior

The following screens or modules still rely on mock data, static examples, or local fallback behavior instead of official connectors:

- nurse Vitalink page
- nurse eHealthBox page
- nurse eFact page
- admin MyCareNet page
- nurse NFC identity flow
- parts of planning, billing, messaging, and security dashboards
- consent sync flows that can fall back to local data when the connector is absent

These areas do not satisfy production Welcome Pack expectations for approved live services.

### Operational gaps that remain after code repair

- No formal eHealth onboarding evidence is stored in the repo.
- No approval dossier, sector approval record, or connector runbook is present.
- No deployed Supabase Edge Functions were found in the live project.
- The live project had only nurse and patient profiles; no real admin, coordinator, or billing identities existed.
- Supabase Auth leaked-password protection is disabled.

## Repo changes made during this audit

- Replaced the boilerplate README with project and compliance-aware documentation.
- Added browser autocomplete hints to auth forms.
- Added a real favicon reference.
- Fixed current lint issues in the repo.
- Replayed idempotent Supabase repair migrations for the missing healthcare schema modules.

## Requirement verdict

### Meets or partially meets

- Clinical domain coverage in the UI and data model
- Role-based access structure
- Consent and audit concepts in the architecture
- Local schema support for BelRAI, wound tracking, eAgreement, and hourly pilot billing

### Does not yet meet

- Proof of official production integration for eHealth services
- Connector-level compliance for MyCareNet, Vitalink, eHealthBox, IAM, certificates, and related services
- Complete replacement of mock healthcare-facing workflows
- Full production security posture and operational readiness evidence

## Recommended next actions

- Replace each mocked healthcare connector surface with a real integration or hide it behind an explicit non-production flag.
- Keep the live Supabase schema in lockstep with the checked-in migrations.
- Provision real privileged accounts and test the admin, coordination, and billing paths end to end.
- Enable leaked-password protection in Supabase Auth.
- Add a project dossier, architecture note, service inventory, and rollout plan aligned with the Welcome Pack.
- Document exactly which Belgian healthcare services are in scope and which remain out of scope.
