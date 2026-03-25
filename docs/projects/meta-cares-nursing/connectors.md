# Connector Runbook

## Vitalink (BelRAI, medication, vaccination)
- **Status:** UI + Supabase schema ready; connector still mocked.
- **Steps to enable:**
  1. Finalize Vitalink API onboarding + certificates (see eHealth Welcome Pack dossier).
  2. Implement Vitalink client inside `src/lib/belraiSupabase.ts` replacing `mockPatients` fallback.
  3. Deploy Supabase Edge Function for BelRAI ingestion (template already present under `supabase/functions`).
  4. Store credentials/certs in secure vault (1Password) and load via Supabase secrets.
  5. Smoke-test streaming BelRAI data and enforce audit logging via `data_access_logs`.

## MyCareNet / eFact
- **Status:** Billing UI + hourly pilot schema in place, but eFact send/receive flows mocked.
- **Steps:**
  1. Replay Supabase repair migrations for `eagreement_requests`, `visit_hourly_billing_summaries`, etc.
  2. Build MyCareNet Edge Function (queue + status updates) and call from `BillingPage` once flag disabled.
  3. Map nomenclature codes + validations to real API responses; fail closed when rejection occurs.

## eHealthBox Messaging
- **Status:** `EHealthBoxPage` uses `mockInbox`; flagged off in production.
- **Steps:**
  1. Acquire eHealthBox credentials + configure IAM certificates.
  2. Build Supabase Edge Function to proxy eHealthBox SOAP endpoints; store tokens in Supabase secrets.
  3. Replace `mockInbox`/`mockSent` with TanStack Query hook hitting Edge Function.

## IAM & Certificates
- **Status:** Admin UI surfaces certificate banners but data is static.
- **Steps:**
  1. Maintain certificate inventory + IAM connector records in Supabase tables (`connectors`, `certificates`).
  2. Feed them via scheduled job pulling from secrets store / PKI.

## NFC eID
- **Status:** demo `mockNfcRead()` only. Real integration requires WebAuthn/NFC reader bridge + compliance review.

## Audit & Consent
- Schema exists (`consents`, `data_access_logs`), ensure Supabase RLS policies enforced + connectors log to audit table.

---
**Reminder:** Document every connector onboarding (contact at eHealth, approval IDs, certificate fingerprints) inside this file once real integrations go live.
