create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('nurse', 'coordinator', 'patient', 'admin', 'billing_office');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.dashboard_scope as enum ('admin', 'coordinator', 'billing');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.patient_gender as enum ('M', 'F', 'X');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.katz_category as enum ('O', 'A', 'B', 'C', 'Cd');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.visit_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'patient',
  first_name text not null default '',
  last_name text not null default '',
  avatar_url text,
  phone text,
  inami_number text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  niss text,
  first_name text not null default '',
  last_name text not null default '',
  date_of_birth date,
  gender public.patient_gender,
  phone text not null default '',
  email text,
  street text not null default '',
  house_number text not null default '',
  postal_code text not null default '',
  city text not null default '',
  lat double precision,
  lng double precision,
  mutuality text not null default '',
  mutuality_number text not null default '',
  katz_category public.katz_category,
  katz_score integer,
  prescribing_doctor text not null default '',
  doctor_phone text,
  notes text,
  photo_url text,
  is_active boolean not null default true,
  last_visit_at timestamptz,
  next_visit_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patients_katz_score_check check (katz_score is null or (katz_score >= 0 and katz_score <= 100))
);

create table if not exists public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  assignment_role public.user_role not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (patient_id, profile_id, assignment_role)
);

create table if not exists public.patient_allergies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (patient_id, label)
);

create table if not exists public.patient_pathologies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (patient_id, label)
);

create table if not exists public.patient_consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patients (id) on delete cascade,
  consent_status text not null check (consent_status in ('active', 'renewal', 'missing')),
  therapeutic_link_status text not null check (therapeutic_link_status in ('ok', 'review', 'blocked')),
  exclusion_note text not null default 'Aucune',
  last_sync_at timestamptz,
  source text not null default 'eHealth',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  nurse_id uuid references public.profiles (id) on delete set null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status public.visit_status not null default 'planned',
  notes text,
  signature text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint visits_end_after_start check (scheduled_end is null or scheduled_end >= scheduled_start)
);

create table if not exists public.visit_acts (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  code text not null,
  label text not null,
  value_w numeric(10, 2) not null default 0,
  category text not null check (category in ('toilette', 'injection', 'wound', 'medication', 'consultation', 'other')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visit_vitals (
  visit_id uuid primary key references public.visits (id) on delete cascade,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  temperature numeric(4, 1),
  oxygen_saturation integer,
  glycemia numeric(6, 2),
  weight numeric(6, 2),
  pain integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint visit_vitals_pain_check check (pain is null or (pain >= 0 and pain <= 10))
);

create table if not exists public.patient_dashboard_state (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  assigned_nurse_id uuid references public.profiles (id) on delete set null,
  nurse_name text not null default '',
  eta_minutes integer not null default 0,
  eta_status text not null default 'preparing' check (eta_status in ('preparing', 'en_route', 'arriving', 'on_site')),
  visits_today integer not null default 0,
  health_tip text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.medication_reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  name text not null,
  scheduled_for time not null,
  status text not null check (status in ('due', 'taken', 'upcoming')),
  taken_at timestamptz,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patient_timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  event_time time not null,
  label text not null,
  status text not null check (status in ('done', 'current', 'upcoming')),
  display_order integer not null default 0,
  related_visit_id uuid references public.visits (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patient_vital_snapshots (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  label text not null,
  value text not null,
  unit text not null,
  tone text not null check (tone in ('red', 'amber', 'green', 'blue')),
  display_order integer not null default 0,
  recorded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (patient_id, label)
);

create table if not exists public.dashboard_sections (
  id uuid primary key default gen_random_uuid(),
  scope public.dashboard_scope not null,
  section_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (scope, section_key)
);

create index if not exists profiles_role_idx on public.profiles (role);
create unique index if not exists patients_niss_unique_idx on public.patients (niss) where niss is not null;
create index if not exists patients_profile_id_idx on public.patients (profile_id);
create index if not exists patients_last_name_idx on public.patients (last_name, first_name);
create index if not exists patient_assignments_patient_id_idx on public.patient_assignments (patient_id);
create index if not exists patient_assignments_profile_id_idx on public.patient_assignments (profile_id);
create index if not exists patient_allergies_patient_id_idx on public.patient_allergies (patient_id);
create index if not exists patient_pathologies_patient_id_idx on public.patient_pathologies (patient_id);
create index if not exists visits_patient_id_idx on public.visits (patient_id);
create index if not exists visits_nurse_id_idx on public.visits (nurse_id);
create index if not exists visits_scheduled_start_idx on public.visits (scheduled_start);
create index if not exists medication_reminders_patient_id_idx on public.medication_reminders (patient_id, scheduled_for);
create index if not exists patient_timeline_events_patient_id_idx on public.patient_timeline_events (patient_id, display_order);
create index if not exists patient_vital_snapshots_patient_id_idx on public.patient_vital_snapshots (patient_id, display_order);
create index if not exists dashboard_sections_scope_idx on public.dashboard_sections (scope, section_key);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.has_any_role(required_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = any (required_roles)
  );
$$;

create or replace function public.is_patient_owner(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients
    where id = target_patient_id
      and profile_id = (select auth.uid())
  );
$$;

create or replace function public.can_access_visit(target_visit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.visits
    where id = target_visit_id
      and (
        public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
        or public.is_patient_owner(patient_id)
      )
  );
$$;

grant execute on function public.has_any_role(public.user_role[]) to authenticated;
grant execute on function public.is_patient_owner(uuid) to authenticated;
grant execute on function public.can_access_visit(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role public.user_role;
  resolved_first_name text;
  resolved_last_name text;
  created_patient_id uuid;
begin
  resolved_role := case lower(coalesce(new.raw_user_meta_data ->> 'role', ''))
    when 'nurse' then 'nurse'::public.user_role
    when 'patient' then 'patient'::public.user_role
    else 'patient'::public.user_role
  end;

  resolved_first_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1),
    ''
  );

  resolved_last_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '^\S+\s*', ''), ''),
    ''
  );

  insert into public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    phone,
    inami_number,
    metadata
  )
  values (
    new.id,
    coalesce(new.email, ''),
    resolved_role,
    resolved_first_name,
    resolved_last_name,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'inami_number', ''),
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    inami_number = excluded.inami_number,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  if resolved_role = 'patient' then
    insert into public.patients (
      profile_id,
      first_name,
      last_name,
      email,
      phone,
      is_active
    )
    values (
      new.id,
      resolved_first_name,
      resolved_last_name,
      nullif(new.email, ''),
      coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), ''),
      true
    )
    on conflict (profile_id) do update
    set
      email = excluded.email,
      phone = excluded.phone,
      updated_at = timezone('utc', now())
    returning id into created_patient_id;

    if created_patient_id is null then
      select id
      into created_patient_id
      from public.patients
      where profile_id = new.id;
    end if;

    insert into public.patient_dashboard_state (
      patient_id,
      nurse_name,
      eta_minutes,
      eta_status,
      visits_today,
      health_tip
    )
    values (
      created_patient_id,
      'Équipe Meta Cares',
      0,
      'preparing',
      0,
      'Bienvenue sur votre espace patient. Votre équipe soignante partagera ici les prochains rappels et conseils.'
    )
    on conflict (patient_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
  before update on public.patients
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_patient_assignments_updated_at on public.patient_assignments;
create trigger set_patient_assignments_updated_at
  before update on public.patient_assignments
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_patient_consents_updated_at on public.patient_consents;
create trigger set_patient_consents_updated_at
  before update on public.patient_consents
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_visits_updated_at on public.visits;
create trigger set_visits_updated_at
  before update on public.visits
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_visit_vitals_updated_at on public.visit_vitals;
create trigger set_visit_vitals_updated_at
  before update on public.visit_vitals
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_patient_dashboard_state_updated_at on public.patient_dashboard_state;
create trigger set_patient_dashboard_state_updated_at
  before update on public.patient_dashboard_state
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_medication_reminders_updated_at on public.medication_reminders;
create trigger set_medication_reminders_updated_at
  before update on public.medication_reminders
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_patient_timeline_events_updated_at on public.patient_timeline_events;
create trigger set_patient_timeline_events_updated_at
  before update on public.patient_timeline_events
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_patient_vital_snapshots_updated_at on public.patient_vital_snapshots;
create trigger set_patient_vital_snapshots_updated_at
  before update on public.patient_vital_snapshots
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_dashboard_sections_updated_at on public.dashboard_sections;
create trigger set_dashboard_sections_updated_at
  before update on public.dashboard_sections
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.patient_assignments enable row level security;
alter table public.patient_allergies enable row level security;
alter table public.patient_pathologies enable row level security;
alter table public.patient_consents enable row level security;
alter table public.visits enable row level security;
alter table public.visit_acts enable row level security;
alter table public.visit_vitals enable row level security;
alter table public.patient_dashboard_state enable row level security;
alter table public.medication_reminders enable row level security;
alter table public.patient_timeline_events enable row level security;
alter table public.patient_vital_snapshots enable row level security;
alter table public.dashboard_sections enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (
  id = (select auth.uid())
  or public.has_any_role(array['admin'::public.user_role])
);

create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (
  id = (select auth.uid())
  or public.has_any_role(array['admin'::public.user_role])
)
with check (
  id = (select auth.uid())
  or public.has_any_role(array['admin'::public.user_role])
);

create policy "patients_select_staff_or_owner"
on public.patients
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
  or profile_id = (select auth.uid())
);

create policy "patients_insert_staff"
on public.patients
for insert
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "patients_update_staff_or_owner"
on public.patients
for update
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or profile_id = (select auth.uid())
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or profile_id = (select auth.uid())
);

create policy "patients_delete_admin"
on public.patients
for delete
using (public.has_any_role(array['admin'::public.user_role]));

create policy "patient_assignments_select_staff_or_owner"
on public.patient_assignments
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "patient_assignments_manage_admin_or_coordinator"
on public.patient_assignments
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role]));

create policy "patient_allergies_select_staff_or_owner"
on public.patient_allergies
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "patient_allergies_manage_staff"
on public.patient_allergies
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "patient_pathologies_select_staff_or_owner"
on public.patient_pathologies
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "patient_pathologies_manage_staff"
on public.patient_pathologies
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "patient_consents_select_staff_or_owner"
on public.patient_consents
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "patient_consents_manage_staff"
on public.patient_consents
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "visits_select_staff_billing_or_owner"
on public.visits
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "visits_manage_staff"
on public.visits
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "visit_acts_select_by_visit_access"
on public.visit_acts
for select
using (public.can_access_visit(visit_id));

create policy "visit_acts_manage_staff"
on public.visit_acts
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "visit_vitals_select_by_visit_access"
on public.visit_vitals
for select
using (public.can_access_visit(visit_id));

create policy "visit_vitals_manage_staff"
on public.visit_vitals
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "patient_dashboard_state_select_staff_or_owner"
on public.patient_dashboard_state
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "patient_dashboard_state_manage_staff"
on public.patient_dashboard_state
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "medication_reminders_select_staff_or_owner"
on public.medication_reminders
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "medication_reminders_update_staff_or_owner"
on public.medication_reminders
for update
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "medication_reminders_insert_staff"
on public.medication_reminders
for insert
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "medication_reminders_delete_staff"
on public.medication_reminders
for delete
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "patient_timeline_events_select_staff_or_owner"
on public.patient_timeline_events
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "patient_timeline_events_manage_staff"
on public.patient_timeline_events
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "patient_vital_snapshots_select_staff_or_owner"
on public.patient_vital_snapshots
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "patient_vital_snapshots_manage_staff"
on public.patient_vital_snapshots
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "dashboard_sections_select_by_scope"
on public.dashboard_sections
for select
using (
  (scope = 'admin' and public.has_any_role(array['admin'::public.user_role]))
  or (scope = 'coordinator' and public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role]))
  or (scope = 'billing' and public.has_any_role(array['admin'::public.user_role, 'billing_office'::public.user_role]))
);

create policy "dashboard_sections_manage_admin"
on public.dashboard_sections
for all
using (public.has_any_role(array['admin'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role]));
