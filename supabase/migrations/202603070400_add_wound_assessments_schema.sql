create table if not exists public.wound_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  visit_id uuid references public.visits (id) on delete set null,
  had_episode_id uuid references public.had_episodes (id) on delete set null,
  recorded_by_profile_id uuid references public.profiles (id) on delete set null,
  wound_label text not null default '',
  wound_type text not null default 'Autre',
  zone_id text not null,
  length_cm numeric(6, 2),
  width_cm numeric(6, 2),
  depth_cm numeric(6, 2),
  exudate_level text not null default 'moderate'
    check (exudate_level in ('none', 'mild', 'moderate', 'heavy')),
  tissue_type text not null default 'granulation'
    check (tissue_type in ('granulation', 'slough', 'necrosis', 'epithelialization', 'mixed', 'other')),
  pain integer,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wound_assessments_dimension_check check (
    (length_cm is null or length_cm >= 0)
    and (width_cm is null or width_cm >= 0)
    and (depth_cm is null or depth_cm >= 0)
  ),
  constraint wound_assessments_pain_check check (pain is null or (pain >= 0 and pain <= 10))
);

create index if not exists wound_assessments_patient_id_recorded_at_idx
  on public.wound_assessments (patient_id, recorded_at desc);
create index if not exists wound_assessments_visit_id_idx
  on public.wound_assessments (visit_id);
create index if not exists wound_assessments_had_episode_id_idx
  on public.wound_assessments (had_episode_id);

drop trigger if exists set_wound_assessments_updated_at on public.wound_assessments;
create trigger set_wound_assessments_updated_at
  before update on public.wound_assessments
  for each row execute procedure public.set_updated_at();

alter table public.wound_assessments enable row level security;

drop policy if exists "wound_assessments_select_staff_billing_or_owner" on public.wound_assessments;
create policy "wound_assessments_select_staff_billing_or_owner"
on public.wound_assessments
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
  or public.is_patient_owner(patient_id)
);

drop policy if exists "wound_assessments_manage_staff" on public.wound_assessments;
create policy "wound_assessments_manage_staff"
on public.wound_assessments
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

insert into public.wound_assessments (
  id,
  patient_id,
  visit_id,
  had_episode_id,
  recorded_by_profile_id,
  wound_label,
  wound_type,
  zone_id,
  length_cm,
  width_cm,
  depth_cm,
  exudate_level,
  tissue_type,
  pain,
  notes,
  metadata,
  recorded_at
)
values
  (
    '98000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    null,
    '90000000-0000-0000-0000-000000000001',
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    'Ulcère veineux jambe gauche',
    'Ulcère veineux',
    'leg-l',
    3.80,
    2.60,
    0.80,
    'heavy',
    'slough',
    4,
    'Bords inflammatoires, exsudat abondant mais lit propre après irrigation.',
    '{"classification":"ulcere_veineux","review":"historique_seed"}'::jsonb,
    '2026-02-25T10:30:00+01:00'
  ),
  (
    '98000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    null,
    '90000000-0000-0000-0000-000000000001',
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    'Ulcère veineux jambe gauche',
    'Ulcère veineux',
    'leg-l',
    3.50,
    2.40,
    0.60,
    'heavy',
    'mixed',
    3,
    'Réduction légère de la profondeur, bourgeonnement débutant.',
    '{"classification":"ulcere_veineux","review":"historique_seed"}'::jsonb,
    '2026-03-01T10:30:00+01:00'
  ),
  (
    '98000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '90000000-0000-0000-0000-000000000001',
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    'Ulcère veineux jambe gauche',
    'Ulcère veineux',
    'leg-l',
    3.20,
    2.10,
    0.50,
    'moderate',
    'granulation',
    2,
    'Amélioration clinique, exsudat modéré, pansement bien toléré.',
    '{"classification":"ulcere_veineux","review":"historique_seed"}'::jsonb,
    '2026-03-06T11:00:00+01:00'
  ),
  (
    '98000000-0000-0000-0000-000000000004',
    '33333333-3333-3333-3333-333333333333',
    null,
    null,
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    'Plaie sacrum stade III',
    'Escarre (pression)',
    'sacrum',
    4.50,
    3.20,
    0.90,
    'moderate',
    'slough',
    5,
    'Plaie profonde avec fibrine partielle, décharge à renforcer.',
    '{"classification":"escarre","review":"historique_seed"}'::jsonb,
    '2026-03-02T09:15:00+01:00'
  ),
  (
    '98000000-0000-0000-0000-000000000005',
    '33333333-3333-3333-3333-333333333333',
    null,
    null,
    (select id from public.profiles where role = 'nurse' order by created_at, id limit 1),
    'Plaie sacrum stade III',
    'Escarre (pression)',
    'sacrum',
    4.10,
    2.90,
    0.70,
    'mild',
    'granulation',
    3,
    'Bourgeonnement plus net, exsudat diminué après adaptation du pansement.',
    '{"classification":"escarre","review":"historique_seed"}'::jsonb,
    '2026-03-05T09:15:00+01:00'
  )
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  visit_id = excluded.visit_id,
  had_episode_id = excluded.had_episode_id,
  recorded_by_profile_id = excluded.recorded_by_profile_id,
  wound_label = excluded.wound_label,
  wound_type = excluded.wound_type,
  zone_id = excluded.zone_id,
  length_cm = excluded.length_cm,
  width_cm = excluded.width_cm,
  depth_cm = excluded.depth_cm,
  exudate_level = excluded.exudate_level,
  tissue_type = excluded.tissue_type,
  pain = excluded.pain,
  notes = excluded.notes,
  metadata = excluded.metadata,
  recorded_at = excluded.recorded_at,
  updated_at = timezone('utc', now());
