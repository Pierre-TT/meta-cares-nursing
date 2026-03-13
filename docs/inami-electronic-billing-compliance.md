# INAMI Electronic Billing Compliance

Last reviewed: 2026-03-10

## Official sources checked

- INAMI electronic billing overview:
  https://www.inami.fgov.be/fr/professionnels/info-pour-tous/facturer-electroniquement
- INAMI nurse workflow update for MyCareNet:
  https://www.inami.fgov.be/fr/professionnels/sante/infirmiers-et-aides-soignants/facturation
- INAMI patient identity verification for nurses:
  https://www.inami.fgov.be/fr/professionnels/sante/infirmiers-et-aides-soignants/verifier-l-identite-du-patient
- INAMI justificatif document workflow:
  https://www.inami.fgov.be/fr/professionnels/sante/infirmiers-et-aides-soignants/remettre-le-document-justificatif-au-patient
- MyCareNet rollout for nurses:
  https://fra.mycarenet.be/rollout
- MyCareNet nurse package page:
  https://www.mycarenet.be/fr/logiciels/infirmieres

## Requirements mapped into the app

1. Third-party billing must flow via MyCareNet.
   Implemented in billing queue, eFact batches, corrections, and admin MyCareNet oversight screens.

2. The software package / connector / certificate chain must stay approved.
   Implemented as explicit readiness controls on admin MyCareNet and certificate pages, plus batch send guardrails.

3. Paper attestations are not sent in the MyCareNet nurse flow, but prescriptions must remain archived for 5 years.
   Implemented as archive controls and send blockers in the billing queue, eFact batches, and patient account views.

4. The patient must receive a justificatif document quickly and at the latest within 28 days after billing.
   Implemented as due-date tracking in patient accounts and batch readiness warnings.

5. Identity verification must be traced for each patient contact, including fallback reason.
   Implemented in the patient identification flow, replayed in the active visit screen, and queued into the server-side audit log when the authenticated app is online.

6. Medico-administrative notifications and eAgreement prerequisites must be visible before sending.
   Implemented in queue / batch compliance states and rejection guidance.

## Remaining external blockers

- Browser-only NFC is still not a legal high-assurance substitute for a native approved card-reading workflow.
- Real production compliance still depends on the actual approved MyCareNet package, homologation status, and certificate lifecycle of the deployed environment.
- Identity traces now also feed the central audit log when the app is online, but a production deployment should still harden retention, reporting, and offline resynchronisation of this evidence.
