# Supabase Repair Runbook

Use this when the live Supabase project drifts from the checked-in schema (BelRAI, wound, hourly pilot, consent, audit tables, etc.).

1. **Gather access**
   - Supabase project ref: `TBD` (ask platform team).
   - Service role key stored in 1Password vault `Meta Cares / Supabase`.
   - Install Supabase CLI (`supabase --version`).

2. **Create `.env.local` with service key**
```bash
export SUPABASE_ACCESS_TOKEN="<personal access token>"
export SUPABASE_DB_PASSWORD="<database password>"
```

3. **Pull production schema snapshot (optional)**
```bash
supabase db pull --project-ref <project-ref> --schema public > backup-$(date +%Y%m%d).sql
```

4. **Replay repair migrations**
The following migrations are idempotent and safe to run repeatedly:
- `supabase/migrations/20260215_repair_belrai_schema.sql`
- `supabase/migrations/20260215_repair_wound_assessments.sql`
- `supabase/migrations/20260215_repair_eagreement.sql`
- `supabase/migrations/20260215_repair_hourly_pilot.sql`
- `supabase/migrations/20260215_repair_consent_audit.sql`

Apply in order:
```bash
supabase db reset --db-url $SUPABASE_DB_URL --file supabase/migrations/<file>.sql
```
(Replace with `psql` if you prefer: `psql $SUPABASE_DB_URL -f supabase/migrations/<file>.sql`)

5. **Verify objects exist**
Run the verification query bundle (`supabase/repair_verifications.sql`) to confirm:
```sql
SELECT to_regclass('public.belrai_assessments');
SELECT to_regclass('public.wound_assessments');
SELECT to_regclass('public.eagreement_requests');
SELECT to_regclass('public.visit_hourly_billing_summaries');
SELECT to_regclass('public.data_access_logs');
```
Each should return the table name.

6. **Audit RLS**
After schema repair, run `supabase/scripts/verify_rls.sql` (or manual checks) to ensure RLS policies exist for new tables.

7. **Log completion**
Update `docs/projects/meta-cares-nursing/supabase-repair-runbook.md` with date, operator, migrations applied, verification output.
