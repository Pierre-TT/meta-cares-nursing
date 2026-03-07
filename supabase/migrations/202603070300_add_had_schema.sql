do $$
begin
  create type public.had_episode_type as enum (
    'opat',
    'oncology_at_home',
    'heart_failure_virtual_ward',
    'post_acute_virtual_ward',
    'other'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.had_episode_status as enum (
    'screening',
    'eligible',
    'planned',
    'active',
    'paused',
    'escalated',
    'closed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.had_eligibility_result as enum (
    'eligible',
    'eligible_with_conditions',
    'not_eligible'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.had_team_role as enum (
    'specialist',
    'gp',
    'nurse',
    'coordinator',
    'pharmacist',
    'caregiver',
    'patient',
    'hospital_case_manager',
    'other'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.had_round_decision as enum (
    'continue_episode',
    'adapt_plan',
    'call_patient',
    'urgent_nurse_visit',
    'send_to_ed',
    'rehospitalize',
    'close_episode'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.had_measurement_source as enum (
    'patient',
    'nurse',
    'device',
    'hospital',
    'lab',
    'questionnaire'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.had_episodes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  reference text not null unique
    default ('HAD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  episode_type public.had_episode_type not null,
  status public.had_episode_status not null default 'screening',
  origin text not null default 'step_down'
    check (origin in ('step_down', 'step_up', 'direct_referral', 'ed_avoidance')),
  risk_level text not null default 'moderate'
    check (risk_level in ('low', 'moderate', 'high', 'critical')),
  hospital_reference text,
  source_visit_id uuid references public.visits (id) on delete set null,
  specialist_profile_id uuid references public.profiles (id) on delete set null,
  coordinator_profile_id uuid references public.profiles (id) on delete set null,
  primary_nurse_profile_id uuid references public.profiles (id) on delete set null,
  originating_hospital text not null default '',
  originating_service text,
  diagnosis_summary text not null default '',
  admission_reason text not null default '',
  inclusion_notes text,
  exclusion_notes text,
  consent_confirmed boolean not null default false,
  home_ready boolean not null default false,
  caregiver_required boolean not null default false,
  caregiver_available boolean,
  start_at timestamptz,
  target_end_at timestamptz,
  end_at timestamptz,
  last_round_at timestamptz,
  escalated_at timestamptz,
  escalation_reason text,
  discharge_summary text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint had_episodes_dates_check check (
    (target_end_at is null or start_at is null or target_end_at >= start_at)
    and (end_at is null or start_at is null or end_at >= start_at)
  )
);

alter table public.visits
  add column if not exists had_episode_id uuid references public.had_episodes (id) on delete set null;

create table if not exists public.had_episode_team_members (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  role public.had_team_role not null,
  external_name text,
  external_phone text,
  external_email text,
  is_primary boolean not null default false,
  receives_alerts boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint had_episode_team_members_contact_check check (
    profile_id is not null
    or nullif(trim(coalesce(external_name, '')), '') is not null
  )
);

create table if not exists public.had_eligibility_assessments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  assessed_by uuid references public.profiles (id) on delete set null,
  assessed_at timestamptz not null default timezone('utc', now()),
  clinical_stability boolean not null default false,
  requires_24_7_monitoring boolean not null default false,
  needs_immediate_technical_platform boolean not null default false,
  home_environment_adequate boolean not null default false,
  patient_consent_obtained boolean not null default false,
  gp_informed boolean not null default false,
  caregiver_available boolean,
  logistics_ready boolean not null default false,
  caregiver_burden_risk boolean not null default false,
  result public.had_eligibility_result not null,
  blockers jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.had_care_plans (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  version integer not null default 1,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'superseded', 'closed')),
  protocol_slug text not null,
  summary text not null default '',
  monitoring_plan jsonb not null default '{}'::jsonb,
  escalation_rules jsonb not null default '{}'::jsonb,
  discharge_criteria jsonb not null default '[]'::jsonb,
  review_frequency_hours integer not null default 24
    check (review_frequency_hours > 0),
  next_review_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (episode_id, version)
);

create table if not exists public.had_medication_orders (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  care_plan_id uuid references public.had_care_plans (id) on delete set null,
  line_number integer not null default 1,
  medication_name text not null,
  dose text not null default '',
  route text not null default '',
  frequency text not null default '',
  administration_instructions text,
  requires_nurse boolean not null default true,
  supplier text not null default 'hospital_pharmacy',
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'held', 'cancelled')),
  start_at timestamptz,
  end_at timestamptz,
  next_due_at timestamptz,
  last_administered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint had_medication_orders_dates_check check (
    end_at is null or start_at is null or end_at >= start_at
  )
);

create table if not exists public.had_rounds (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  round_at timestamptz not null default timezone('utc', now()),
  recorded_by uuid references public.profiles (id) on delete set null,
  risk_score integer check (risk_score is null or (risk_score >= 0 and risk_score <= 100)),
  summary text not null default '',
  overnight_events text,
  recommendation text,
  decision public.had_round_decision not null default 'continue_episode',
  decision_reason text,
  next_round_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.had_measurements (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  visit_id uuid references public.visits (id) on delete set null,
  captured_by_profile_id uuid references public.profiles (id) on delete set null,
  source public.had_measurement_source not null,
  measurement_type text not null
    check (
      measurement_type in (
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'heart_rate',
        'temperature',
        'oxygen_saturation',
        'weight',
        'glycemia',
        'pain',
        'respiratory_rate',
        'symptom_score',
        'lab_result',
        'other'
      )
    ),
  value_numeric numeric(10, 2),
  value_text text,
  unit text not null default '',
  threshold_state text not null default 'ok'
    check (threshold_state in ('ok', 'warning', 'critical')),
  recorded_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint had_measurements_value_check check (
    value_numeric is not null
    or nullif(trim(coalesce(value_text, '')), '') is not null
  )
);

create table if not exists public.had_alerts (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  measurement_id uuid references public.had_measurements (id) on delete set null,
  severity text not null
    check (severity in ('info', 'warning', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  title text not null,
  description text,
  assigned_to_profile_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  acknowledged_by uuid references public.profiles (id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.had_tasks (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  linked_alert_id uuid references public.had_alerts (id) on delete set null,
  owner_kind text not null
    check (owner_kind in ('specialist', 'gp', 'nurse', 'coordinator', 'pharmacy', 'patient', 'caregiver', 'logistics', 'system', 'other')),
  owner_profile_id uuid references public.profiles (id) on delete set null,
  owner_external_label text,
  visibility text not null default 'staff'
    check (visibility in ('staff', 'patient', 'both')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  task_type text not null
    check (task_type in ('measurement', 'medication', 'visit', 'round', 'call', 'delivery', 'lab', 'education', 'consent', 'discharge', 'other')),
  title text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by_profile_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint had_tasks_owner_check check (
    owner_profile_id is not null
    or nullif(trim(coalesce(owner_external_label, '')), '') is not null
    or owner_kind in ('patient', 'caregiver', 'system')
  )
);

create table if not exists public.had_logistics_items (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.had_episodes (id) on delete cascade,
  item_type text not null
    check (item_type in ('medication', 'device', 'pump', 'consumable', 'waste_pickup', 'lab_sample', 'other')),
  label text not null,
  quantity numeric(10, 2),
  unit text,
  supplier text,
  cold_chain_required boolean not null default false,
  status text not null default 'planned'
    check (status in ('planned', 'ordered', 'ready', 'in_transit', 'delivered', 'installed', 'collected', 'cancelled')),
  scheduled_for timestamptz,
  completed_at timestamptz,
  tracking_reference text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists had_episodes_one_open_per_patient_idx
  on public.had_episodes (patient_id)
  where status in ('screening', 'eligible', 'planned', 'active', 'paused', 'escalated');

create index if not exists had_episodes_patient_status_idx
  on public.had_episodes (patient_id, status);

create index if not exists had_episodes_coordinator_idx
  on public.had_episodes (coordinator_profile_id);

create index if not exists had_episodes_primary_nurse_idx
  on public.had_episodes (primary_nurse_profile_id);

create index if not exists had_episodes_last_round_idx
  on public.had_episodes (last_round_at);

create index if not exists visits_had_episode_id_idx
  on public.visits (had_episode_id, scheduled_start);

create unique index if not exists had_episode_team_members_episode_profile_role_idx
  on public.had_episode_team_members (episode_id, profile_id, role)
  where profile_id is not null;

create index if not exists had_episode_team_members_episode_idx
  on public.had_episode_team_members (episode_id);

create index if not exists had_eligibility_assessments_episode_idx
  on public.had_eligibility_assessments (episode_id, assessed_at desc);

create index if not exists had_care_plans_episode_status_idx
  on public.had_care_plans (episode_id, status);

create unique index if not exists had_care_plans_one_active_idx
  on public.had_care_plans (episode_id)
  where status = 'active';

create index if not exists had_medication_orders_episode_due_idx
  on public.had_medication_orders (episode_id, status, next_due_at);

create index if not exists had_rounds_episode_round_at_idx
  on public.had_rounds (episode_id, round_at desc);

create index if not exists had_measurements_episode_type_recorded_idx
  on public.had_measurements (episode_id, measurement_type, recorded_at desc);

create index if not exists had_measurements_visit_id_idx
  on public.had_measurements (visit_id);

create index if not exists had_alerts_episode_status_severity_idx
  on public.had_alerts (episode_id, status, severity);

create index if not exists had_tasks_episode_status_due_idx
  on public.had_tasks (episode_id, status, due_at);

create index if not exists had_logistics_items_episode_status_idx
  on public.had_logistics_items (episode_id, status, scheduled_for);

drop trigger if exists set_had_episodes_updated_at on public.had_episodes;
create trigger set_had_episodes_updated_at
  before update on public.had_episodes
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_episode_team_members_updated_at on public.had_episode_team_members;
create trigger set_had_episode_team_members_updated_at
  before update on public.had_episode_team_members
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_eligibility_assessments_updated_at on public.had_eligibility_assessments;
create trigger set_had_eligibility_assessments_updated_at
  before update on public.had_eligibility_assessments
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_care_plans_updated_at on public.had_care_plans;
create trigger set_had_care_plans_updated_at
  before update on public.had_care_plans
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_medication_orders_updated_at on public.had_medication_orders;
create trigger set_had_medication_orders_updated_at
  before update on public.had_medication_orders
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_rounds_updated_at on public.had_rounds;
create trigger set_had_rounds_updated_at
  before update on public.had_rounds
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_measurements_updated_at on public.had_measurements;
create trigger set_had_measurements_updated_at
  before update on public.had_measurements
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_alerts_updated_at on public.had_alerts;
create trigger set_had_alerts_updated_at
  before update on public.had_alerts
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_tasks_updated_at on public.had_tasks;
create trigger set_had_tasks_updated_at
  before update on public.had_tasks
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_had_logistics_items_updated_at on public.had_logistics_items;
create trigger set_had_logistics_items_updated_at
  before update on public.had_logistics_items
  for each row execute procedure public.set_updated_at();

create or replace function public.sync_had_episode_last_round_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.had_episodes
  set last_round_at = new.round_at,
      updated_at = timezone('utc', now())
  where id = new.episode_id;

  return new;
end;
$$;

drop trigger if exists sync_had_episode_last_round_at on public.had_rounds;
create trigger sync_had_episode_last_round_at
  after insert on public.had_rounds
  for each row execute procedure public.sync_had_episode_last_round_at();

alter table public.had_episodes enable row level security;
alter table public.had_episode_team_members enable row level security;
alter table public.had_eligibility_assessments enable row level security;
alter table public.had_care_plans enable row level security;
alter table public.had_medication_orders enable row level security;
alter table public.had_rounds enable row level security;
alter table public.had_measurements enable row level security;
alter table public.had_alerts enable row level security;
alter table public.had_tasks enable row level security;
alter table public.had_logistics_items enable row level security;

create policy "had_episodes_select_staff_or_owner"
on public.had_episodes
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "had_episodes_insert_staff"
on public.had_episodes
for insert
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_episodes_update_staff"
on public.had_episodes
for update
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_episode_team_members_select_staff_or_owner"
on public.had_episode_team_members
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or exists (
    select 1
    from public.had_episodes e
    where e.id = episode_id
      and public.is_patient_owner(e.patient_id)
  )
);

create policy "had_episode_team_members_manage_staff"
on public.had_episode_team_members
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_eligibility_assessments_select_staff"
on public.had_eligibility_assessments
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_eligibility_assessments_manage_staff"
on public.had_eligibility_assessments
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_care_plans_select_staff_or_owner"
on public.had_care_plans
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or exists (
    select 1
    from public.had_episodes e
    where e.id = episode_id
      and public.is_patient_owner(e.patient_id)
  )
);

create policy "had_care_plans_manage_staff"
on public.had_care_plans
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_medication_orders_select_staff_or_owner"
on public.had_medication_orders
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or exists (
    select 1
    from public.had_episodes e
    where e.id = episode_id
      and public.is_patient_owner(e.patient_id)
  )
);

create policy "had_medication_orders_manage_staff"
on public.had_medication_orders
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_rounds_select_staff"
on public.had_rounds
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_rounds_manage_staff"
on public.had_rounds
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_measurements_select_staff_or_owner"
on public.had_measurements
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or exists (
    select 1
    from public.had_episodes e
    where e.id = episode_id
      and public.is_patient_owner(e.patient_id)
  )
);

create policy "had_measurements_insert_staff_or_patient"
on public.had_measurements
for insert
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or (
    source = 'patient'
    and captured_by_profile_id = (select auth.uid())
    and exists (
      select 1
      from public.had_episodes e
      where e.id = episode_id
        and public.is_patient_owner(e.patient_id)
    )
  )
);

create policy "had_measurements_update_staff_or_patient_self"
on public.had_measurements
for update
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or (
    source = 'patient'
    and captured_by_profile_id = (select auth.uid())
    and exists (
      select 1
      from public.had_episodes e
      where e.id = episode_id
        and public.is_patient_owner(e.patient_id)
    )
  )
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or (
    source = 'patient'
    and captured_by_profile_id = (select auth.uid())
    and exists (
      select 1
      from public.had_episodes e
      where e.id = episode_id
        and public.is_patient_owner(e.patient_id)
    )
  )
);

create policy "had_alerts_select_staff"
on public.had_alerts
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_alerts_manage_staff"
on public.had_alerts
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_tasks_select_staff_or_patient_visible"
on public.had_tasks
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or (
    visibility in ('patient', 'both')
    and exists (
      select 1
      from public.had_episodes e
      where e.id = episode_id
        and public.is_patient_owner(e.patient_id)
    )
  )
);

create policy "had_tasks_manage_staff"
on public.had_tasks
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_tasks_update_patient_self"
on public.had_tasks
for update
using (
  owner_kind = 'patient'
  and owner_profile_id = (select auth.uid())
  and visibility in ('patient', 'both')
)
with check (
  owner_kind = 'patient'
  and owner_profile_id = (select auth.uid())
  and visibility in ('patient', 'both')
);

create policy "had_logistics_items_select_staff"
on public.had_logistics_items
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

create policy "had_logistics_items_manage_staff"
on public.had_logistics_items
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);
