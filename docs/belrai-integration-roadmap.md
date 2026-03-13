# BelRAI Integration Roadmap

## Objective

Position Meta Cares as a BelRAI-native workflow layer for nurses, coordinators, patients, and administrators without overclaiming official BelRAI interoperability before the connector and homologation work are complete.

## Product Principles

- Treat Meta Cares as `BelRAI Prep` until the official BelRAI web service is connected and validated.
- Keep the official BelRAI result as the authoritative shared record when transmission is available.
- Adapt the experience by user type instead of exposing the same screener everywhere.
- Never expose patient-facing raw draft answers; only shared, simplified results.
- Make multidisciplinary coordination visible, not nurse-only.

## Current Foundation

- Nurse preparation flow already exists with local draft persistence, evidence links, CAP derivation, and care-plan suggestions.
- Supabase schema already supports templates, participants, reports, scores, CAPs, and sync jobs.
- Coordinator and patient portals already have enough routing and dashboard structure to surface BelRAI-specific views.

## Priority Backlog

### Phase 1: Honest Product Framing

- Rename all user-facing `BelRAI Twin` wording to `BelRAI Prep`.
- Make every nurse screen explicit about local preparation versus official transmission.
- Gate patient views behind a shared-result state instead of exposing drafts.

### Phase 2: User-Type Experiences

- Nurse: keep evidence-driven prefill, offline capture, CAP drafting, and care-plan generation.
- Patient: ship a MyBelRAI-style citizen page with simplified scales, CAPs, timing of availability, and privacy guardrails.
- Coordinator: add a BelRAI operations surface for due dates, queue health, blocked syncs, and multidisciplinary follow-up.
- Admin: add BelRAI governance panels for template versions, connector health, consent, TherLink/COT readiness, and homologation progress.

### Phase 3: Data Model Split

- Introduce separate concepts for `prep_assessment` and `official_assessment`.
- Keep local evidence, explanations, and nurse notes attached to the prep layer.
- Persist official identifiers, timestamps, and returned scales/CAPs from the BelRAI service separately.
- Track template lineage and instrument family explicitly instead of hardcoding one HC screener key.

### Phase 4: Instrument Coverage

- Support instrument selection by context: HC, LTCF, PC, AC, MH/CMH, BelRAI Screener, Palliative Screener, and social supplement.
- Add template import and version rollout workflows so UI sections are driven by registered BelRAI templates rather than static code.
- Flag version drift when local prep content no longer matches the latest registered template.

### Phase 5: Official Interoperability

- Implement the BelRAI web-service connector with secure credential handling, audit logs, and retry logic.
- Receive official scales, CAPs, and status transitions from the authoritative service instead of deriving them only locally.
- Add homologation tracking, sandbox/production separation, and traceability for every transmission.

## Delivery Sequence

1. Keep shipping `BelRAI Prep` UX improvements in the app.
2. Expand coordinator and patient experiences around the existing draft/sync data.
3. Replace hardcoded instrument definitions with template-driven rendering.
4. Connect the official service and move shared outputs to the authoritative source.
5. Add admin governance and homologation tooling once the connector is stable.

## Success Criteria

- Nurses see clear prep guidance without confusing the local draft with the official record.
- Patients see only shared, simplified BelRAI results.
- Coordinators can manage queue health, due dates, and blockers from one place.
- Administrators can prove version governance, security posture, and connector readiness.
- Official BelRAI results can eventually supersede local-derived scores without breaking current workflows.
