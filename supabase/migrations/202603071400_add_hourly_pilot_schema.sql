create table if not exists public.pilot_billing_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  segment_type text not null
    check (segment_type in ('travel', 'direct', 'indirect')),
  applies_on_weekend boolean not null default false,
  home_hourly_rate numeric(10, 2) not null default 0,
  other_place_hourly_rate numeric(10, 2) not null default 0,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visit_location_events (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  recorded_at timestamptz not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters numeric(10, 2),
  source text not null default 'device'
    check (source in ('device', 'manual', 'system')),
  geofence_state text not null default 'unknown'
    check (geofence_state in ('inside', 'outside', 'unknown')),
  distance_to_patient_m numeric(10, 2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visit_time_segments (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  segment_type text not null
    check (segment_type in ('travel', 'direct', 'indirect')),
  source text not null default 'manual'
    check (source in ('geofence', 'manual', 'system')),
  place_of_service text not null default 'A'
    check (place_of_service in ('A', 'B', 'C')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_minutes numeric(10, 2) not null default 0
    check (duration_minutes >= 0),
  is_billable boolean not null default true,
  requires_manual_review boolean not null default false,
  is_corrected boolean not null default false,
  correction_reason text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint visit_time_segments_end_after_start check (ended_at >= started_at)
);

create table if not exists public.visit_hourly_billing_summaries (
  visit_id uuid primary key references public.visits (id) on delete cascade,
  place_of_service text not null default 'A'
    check (place_of_service in ('A', 'B', 'C')),
  total_travel_minutes numeric(10, 2) not null default 0,
  total_direct_minutes numeric(10, 2) not null default 0,
  total_indirect_minutes numeric(10, 2) not null default 0,
  total_billable_minutes numeric(10, 2) not null default 0,
  travel_amount numeric(10, 2) not null default 0,
  direct_amount numeric(10, 2) not null default 0,
  indirect_amount numeric(10, 2) not null default 0,
  hourly_amount numeric(10, 2) not null default 0,
  estimated_forfait_amount numeric(10, 2) not null default 0,
  delta_amount numeric(10, 2) not null default 0,
  indirect_ratio numeric(10, 4),
  geofencing_enabled boolean not null default false,
  geofencing_coverage_ratio numeric(10, 4),
  requires_manual_review boolean not null default false,
  review_reasons jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'validated', 'exported')),
  generated_at timestamptz not null default timezone('utc', now()),
  validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visit_hourly_billing_lines (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  segment_id uuid references public.visit_time_segments (id) on delete set null,
  code text not null references public.pilot_billing_catalog (code) on delete restrict,
  label text not null,
  segment_type text not null
    check (segment_type in ('travel', 'direct', 'indirect')),
  place_of_service text not null default 'A'
    check (place_of_service in ('A', 'B', 'C')),
  unit_minutes numeric(10, 2) not null default 0
    check (unit_minutes >= 0),
  hourly_rate numeric(10, 2) not null default 0,
  amount numeric(10, 2) not null default 0,
  is_weekend_or_holiday boolean not null default false,
  line_status text not null default 'draft'
    check (line_status in ('draft', 'validated', 'exported')),
  justification text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists visit_location_events_visit_id_recorded_at_idx
  on public.visit_location_events (visit_id, recorded_at);
create index if not exists visit_time_segments_visit_id_started_at_idx
  on public.visit_time_segments (visit_id, started_at);
create index if not exists visit_hourly_billing_lines_visit_id_idx
  on public.visit_hourly_billing_lines (visit_id);
create index if not exists visit_hourly_billing_lines_code_idx
  on public.visit_hourly_billing_lines (code);

drop trigger if exists set_pilot_billing_catalog_updated_at on public.pilot_billing_catalog;
create trigger set_pilot_billing_catalog_updated_at
  before update on public.pilot_billing_catalog
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_visit_time_segments_updated_at on public.visit_time_segments;
create trigger set_visit_time_segments_updated_at
  before update on public.visit_time_segments
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_visit_hourly_billing_summaries_updated_at on public.visit_hourly_billing_summaries;
create trigger set_visit_hourly_billing_summaries_updated_at
  before update on public.visit_hourly_billing_summaries
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_visit_hourly_billing_lines_updated_at on public.visit_hourly_billing_lines;
create trigger set_visit_hourly_billing_lines_updated_at
  before update on public.visit_hourly_billing_lines
  for each row execute procedure public.set_updated_at();

alter table public.pilot_billing_catalog enable row level security;
alter table public.visit_location_events enable row level security;
alter table public.visit_time_segments enable row level security;
alter table public.visit_hourly_billing_summaries enable row level security;
alter table public.visit_hourly_billing_lines enable row level security;

drop policy if exists "pilot_billing_catalog_select_staff_or_billing" on public.pilot_billing_catalog;
create policy "pilot_billing_catalog_select_staff_or_billing"
on public.pilot_billing_catalog
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
);

drop policy if exists "pilot_billing_catalog_manage_admin" on public.pilot_billing_catalog;
create policy "pilot_billing_catalog_manage_admin"
on public.pilot_billing_catalog
for all
using (public.has_any_role(array['admin'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role]));

drop policy if exists "visit_location_events_select_by_visit_access" on public.visit_location_events;
create policy "visit_location_events_select_by_visit_access"
on public.visit_location_events
for select
using (public.can_access_visit(visit_id));

drop policy if exists "visit_location_events_manage_staff" on public.visit_location_events;
create policy "visit_location_events_manage_staff"
on public.visit_location_events
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

drop policy if exists "visit_time_segments_select_by_visit_access" on public.visit_time_segments;
create policy "visit_time_segments_select_by_visit_access"
on public.visit_time_segments
for select
using (public.can_access_visit(visit_id));

drop policy if exists "visit_time_segments_manage_staff" on public.visit_time_segments;
create policy "visit_time_segments_manage_staff"
on public.visit_time_segments
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

drop policy if exists "visit_hourly_billing_summaries_select_by_visit_access" on public.visit_hourly_billing_summaries;
create policy "visit_hourly_billing_summaries_select_by_visit_access"
on public.visit_hourly_billing_summaries
for select
using (public.can_access_visit(visit_id));

drop policy if exists "visit_hourly_billing_summaries_manage_staff_or_billing" on public.visit_hourly_billing_summaries;
create policy "visit_hourly_billing_summaries_manage_staff_or_billing"
on public.visit_hourly_billing_summaries
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role]));

drop policy if exists "visit_hourly_billing_lines_select_by_visit_access" on public.visit_hourly_billing_lines;
create policy "visit_hourly_billing_lines_select_by_visit_access"
on public.visit_hourly_billing_lines
for select
using (public.can_access_visit(visit_id));

drop policy if exists "visit_hourly_billing_lines_manage_staff_or_billing" on public.visit_hourly_billing_lines;
create policy "visit_hourly_billing_lines_manage_staff_or_billing"
on public.visit_hourly_billing_lines
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role]));

insert into public.pilot_billing_catalog (
  code,
  label,
  segment_type,
  applies_on_weekend,
  home_hourly_rate,
  other_place_hourly_rate,
  description,
  metadata
)
values
  (
    '421396',
    'Trajet lié au patient — semaine',
    'travel',
    false,
    39.10,
    39.10,
    'Temps de déplacement lié au patient presté en semaine, hors jours fériés.',
    '{"officialPilot":true}'::jsonb
  ),
  (
    '421492',
    'Trajet lié au patient — week-end / jour férié',
    'travel',
    true,
    39.10,
    39.10,
    'Temps de déplacement lié au patient presté le week-end ou un jour férié.',
    '{"officialPilot":true}'::jsonb
  ),
  (
    '423835',
    'Soins infirmiers directs liés au patient — semaine',
    'direct',
    false,
    59.10,
    79.10,
    'Temps de soins infirmiers directs au patient presté en semaine, hors jours fériés.',
    '{"officialPilot":true}'::jsonb
  ),
  (
    '423850',
    'Soins infirmiers directs liés au patient — week-end / jour férié',
    'direct',
    true,
    59.10,
    79.10,
    'Temps de soins infirmiers directs au patient presté le week-end ou un jour férié.',
    '{"officialPilot":true}'::jsonb
  ),
  (
    '423872',
    'Soins infirmiers indirects liés au patient — semaine',
    'indirect',
    false,
    59.10,
    79.10,
    'Temps de soins infirmiers indirects liés au patient presté en semaine, hors jours fériés.',
    '{"officialPilot":true}'::jsonb
  ),
  (
    '423953',
    'Soins infirmiers indirects liés au patient — week-end / jour férié',
    'indirect',
    true,
    59.10,
    79.10,
    'Temps de soins infirmiers indirects liés au patient presté le week-end ou un jour férié.',
    '{"officialPilot":true}'::jsonb
  )
on conflict (code) do update
set
  label = excluded.label,
  segment_type = excluded.segment_type,
  applies_on_weekend = excluded.applies_on_weekend,
  home_hourly_rate = excluded.home_hourly_rate,
  other_place_hourly_rate = excluded.other_place_hourly_rate,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());
