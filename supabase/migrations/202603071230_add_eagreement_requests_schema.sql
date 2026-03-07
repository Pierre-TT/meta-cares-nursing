create table if not exists public.eagreement_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  belrai_assessment_id uuid references public.belrai_assessments (id) on delete set null,
  had_episode_id uuid references public.had_episodes (id) on delete set null,
  created_by_profile_id uuid references public.profiles (id) on delete set null,
  reviewed_by_profile_id uuid references public.profiles (id) on delete set null,
  care_type text not null,
  nomenclature text not null,
  katz_category public.katz_category,
  prescriber_name text not null default '',
  start_at date not null,
  end_at date not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
  mycarenet_reference text,
  rejection_reason text,
  required_attachments jsonb not null default '[]'::jsonb,
  supporting_context jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint eagreement_requests_period_check check (end_at >= start_at)
);

create index if not exists eagreement_requests_patient_id_created_at_idx
  on public.eagreement_requests (patient_id, created_at desc);
create index if not exists eagreement_requests_status_end_at_idx
  on public.eagreement_requests (status, end_at);
create index if not exists eagreement_requests_had_episode_id_idx
  on public.eagreement_requests (had_episode_id);
create index if not exists eagreement_requests_belrai_assessment_id_idx
  on public.eagreement_requests (belrai_assessment_id);

drop trigger if exists set_eagreement_requests_updated_at on public.eagreement_requests;
create trigger set_eagreement_requests_updated_at
  before update on public.eagreement_requests
  for each row execute procedure public.set_updated_at();

alter table public.eagreement_requests enable row level security;

drop policy if exists "eagreement_requests_select_staff_billing_or_owner" on public.eagreement_requests;
create policy "eagreement_requests_select_staff_billing_or_owner"
on public.eagreement_requests
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
  or public.is_patient_owner(patient_id)
);

drop policy if exists "eagreement_requests_manage_staff_and_billing" on public.eagreement_requests;
create policy "eagreement_requests_manage_staff_and_billing"
on public.eagreement_requests
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
);

insert into public.eagreement_requests (
  id,
  patient_id,
  belrai_assessment_id,
  had_episode_id,
  created_by_profile_id,
  reviewed_by_profile_id,
  care_type,
  nomenclature,
  katz_category,
  prescriber_name,
  start_at,
  end_at,
  status,
  mycarenet_reference,
  rejection_reason,
  required_attachments,
  supporting_context,
  submitted_at,
  decided_at
)
values
  (
    '99000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    null,
    '90000000-0000-0000-0000-000000000001',
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    (select id from public.profiles where role in ('billing_office', 'admin') order by created_at, id limit 1),
    'Soins infirmiers forfaitaires',
    'Art. 8 §1 — Forfait B',
    'B',
    'Dr. Van den Berg',
    '2026-01-01',
    '2026-06-30',
    'approved',
    'MN-2026-100001',
    null,
    '["Prescription médicale signée","BelRAI Screener ou Échelle de Katz","Plan de soins infirmiers"]'::jsonb,
    '{"consentStatus":"active","therapeuticLinkStatus":"ok","source":"seed","hadReference":"HAD-OPAT-001"}'::jsonb,
    '2025-12-27T15:40:00+01:00',
    '2025-12-29T09:05:00+01:00'
  ),
  (
    '99000000-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    null,
    null,
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    null,
    'Soins de plaies',
    'Art. 8 §1,3° — Soins de plaies complexes',
    'Cd',
    'Dr. Peeters',
    '2026-03-07',
    '2026-06-07',
    'pending',
    null,
    null,
    '["Prescription médicale signée","Évaluation de plaie","Plan de soins infirmiers"]'::jsonb,
    '{"consentStatus":"renewal","therapeuticLinkStatus":"ok","source":"seed","woundTracking":"active"}'::jsonb,
    '2026-03-07T08:10:00+01:00',
    null
  ),
  (
    '99000000-0000-0000-0000-000000000003',
    '44444444-4444-4444-4444-444444444444',
    null,
    null,
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    (select id from public.profiles where role in ('billing_office', 'admin') order by created_at, id limit 1),
    'Soins infirmiers forfaitaires',
    'Art. 8 §1 — Forfait A',
    'A',
    'Dr. Dupont',
    '2025-04-01',
    '2026-03-31',
    'approved',
    'MN-2025-330031',
    null,
    '["Prescription médicale signée","BelRAI Screener ou Échelle de Katz","Plan de soins infirmiers"]'::jsonb,
    '{"consentStatus":"active","therapeuticLinkStatus":"review","source":"seed"}'::jsonb,
    '2025-03-20T11:00:00+01:00',
    '2025-03-22T09:18:00+01:00'
  ),
  (
    '99000000-0000-0000-0000-000000000004',
    '55555555-5555-5555-5555-555555555555',
    null,
    null,
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    (select id from public.profiles where role in ('billing_office', 'admin') order by created_at, id limit 1),
    'Soins infirmiers forfaitaires',
    'Art. 8 §1 — Forfait à confirmer',
    'O',
    'Dr. Renard',
    '2026-03-01',
    '2026-08-31',
    'rejected',
    null,
    'Consentement eHealth absent et lien thérapeutique bloqué.',
    '["Prescription médicale signée","BelRAI Screener ou Échelle de Katz","Plan de soins infirmiers"]'::jsonb,
    '{"consentStatus":"missing","therapeuticLinkStatus":"blocked","source":"seed"}'::jsonb,
    '2026-03-02T10:45:00+01:00',
    '2026-03-03T08:30:00+01:00'
  )
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  belrai_assessment_id = excluded.belrai_assessment_id,
  had_episode_id = excluded.had_episode_id,
  created_by_profile_id = excluded.created_by_profile_id,
  reviewed_by_profile_id = excluded.reviewed_by_profile_id,
  care_type = excluded.care_type,
  nomenclature = excluded.nomenclature,
  katz_category = excluded.katz_category,
  prescriber_name = excluded.prescriber_name,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  status = excluded.status,
  mycarenet_reference = excluded.mycarenet_reference,
  rejection_reason = excluded.rejection_reason,
  required_attachments = excluded.required_attachments,
  supporting_context = excluded.supporting_context,
  submitted_at = excluded.submitted_at,
  decided_at = excluded.decided_at,
  updated_at = timezone('utc', now());
