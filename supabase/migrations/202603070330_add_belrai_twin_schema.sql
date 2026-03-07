do $$
begin
  create type public.belrai_assessment_status as enum ('draft', 'in_review', 'ready_for_sync', 'synced', 'sync_error');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.belrai_sync_status as enum ('local_only', 'queued', 'processing', 'synced', 'error');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.belrai_priority as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.belrai_participant_status as enum ('invited', 'contributed', 'declined');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.belrai_evidence_source as enum (
    'patient_profile',
    'clinical_history',
    'care_plan',
    'questionnaire',
    'schedule',
    'manual'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.belrai_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  version text not null,
  label text not null,
  assessment_scope text not null default 'screening' check (assessment_scope in ('screening', 'follow_up', 'comprehensive')),
  is_active boolean not null default true,
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (template_key, version)
);

create table if not exists public.belrai_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.belrai_templates (id) on delete cascade,
  section_key text not null,
  item_key text not null,
  item_code text not null,
  label text not null,
  description text not null default '',
  options jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (template_id, item_key)
);

create table if not exists public.belrai_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  template_id uuid references public.belrai_templates (id) on delete set null,
  template_key text not null default 'interrai_hc_screener',
  template_version text not null default 'local-v1',
  assessment_scope text not null default 'screening' check (assessment_scope in ('screening', 'follow_up', 'comprehensive')),
  status public.belrai_assessment_status not null default 'draft',
  sync_status public.belrai_sync_status not null default 'local_only',
  source text not null default 'meta_cares_twin',
  started_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  review_note text,
  summary jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  submitted_at timestamptz,
  last_synced_at timestamptz,
  next_due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.belrai_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.belrai_assessments (id) on delete cascade,
  item_id text not null,
  section_id text not null,
  item_code text not null,
  item_label text not null,
  response_value integer,
  response_label text,
  is_suggested boolean not null default false,
  is_confirmed boolean not null default false,
  confidence numeric(4, 2) not null default 0,
  observed_at timestamptz,
  observed_by uuid references public.profiles (id) on delete set null,
  source public.belrai_evidence_source not null default 'manual',
  evidence_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint belrai_answers_confidence_check check (confidence >= 0 and confidence <= 1),
  unique (assessment_id, item_id)
);

create table if not exists public.belrai_evidence_links (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.belrai_assessments (id) on delete cascade,
  answer_id uuid references public.belrai_answers (id) on delete cascade,
  item_id text not null,
  source public.belrai_evidence_source not null,
  source_ref text,
  label text not null,
  summary text not null,
  observed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.belrai_participants (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.belrai_assessments (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  participant_role text not null,
  display_name text not null,
  status public.belrai_participant_status not null default 'invited',
  last_contribution_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.belrai_caps (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.belrai_assessments (id) on delete cascade,
  cap_key text not null,
  title text not null,
  detail text not null default '',
  priority public.belrai_priority not null default 'medium',
  status text not null default 'active' check (status in ('active', 'watch', 'dismissed')),
  rationale text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (assessment_id, cap_key)
);

create table if not exists public.belrai_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.belrai_assessments (id) on delete cascade,
  score_key text not null,
  label text not null,
  value_numeric numeric(10, 2),
  value_text text,
  interpretation text,
  tone text not null default 'blue' check (tone in ('blue', 'green', 'amber', 'red')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (assessment_id, score_key)
);

create table if not exists public.belrai_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.belrai_assessments (id) on delete cascade,
  status public.belrai_sync_status not null default 'local_only',
  target text not null default 'official_gateway',
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  requested_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.belrai_reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.belrai_assessments (id) on delete cascade,
  report_type text not null,
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists belrai_templates_active_idx on public.belrai_templates (template_key, is_active);
create index if not exists belrai_items_template_id_idx on public.belrai_items (template_id, display_order);
create index if not exists belrai_assessments_patient_id_idx on public.belrai_assessments (patient_id, status, sync_status);
create index if not exists belrai_answers_assessment_id_idx on public.belrai_answers (assessment_id, item_id);
create index if not exists belrai_evidence_links_assessment_id_idx on public.belrai_evidence_links (assessment_id, item_id);
create index if not exists belrai_participants_assessment_id_idx on public.belrai_participants (assessment_id);
create index if not exists belrai_caps_assessment_id_idx on public.belrai_caps (assessment_id, priority);
create index if not exists belrai_scores_assessment_id_idx on public.belrai_scores (assessment_id);
create index if not exists belrai_sync_jobs_assessment_id_idx on public.belrai_sync_jobs (assessment_id, status);
create index if not exists belrai_reports_assessment_id_idx on public.belrai_reports (assessment_id, report_type);

create or replace function public.can_access_belrai_assessment(target_assessment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.belrai_assessments
    where id = target_assessment_id
      and (
        public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
        or public.is_patient_owner(patient_id)
      )
  );
$$;

grant execute on function public.can_access_belrai_assessment(uuid) to authenticated;

drop trigger if exists set_belrai_templates_updated_at on public.belrai_templates;
create trigger set_belrai_templates_updated_at
  before update on public.belrai_templates
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_belrai_items_updated_at on public.belrai_items;
create trigger set_belrai_items_updated_at
  before update on public.belrai_items
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_belrai_assessments_updated_at on public.belrai_assessments;
create trigger set_belrai_assessments_updated_at
  before update on public.belrai_assessments
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_belrai_answers_updated_at on public.belrai_answers;
create trigger set_belrai_answers_updated_at
  before update on public.belrai_answers
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_belrai_participants_updated_at on public.belrai_participants;
create trigger set_belrai_participants_updated_at
  before update on public.belrai_participants
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_belrai_caps_updated_at on public.belrai_caps;
create trigger set_belrai_caps_updated_at
  before update on public.belrai_caps
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_belrai_scores_updated_at on public.belrai_scores;
create trigger set_belrai_scores_updated_at
  before update on public.belrai_scores
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_belrai_sync_jobs_updated_at on public.belrai_sync_jobs;
create trigger set_belrai_sync_jobs_updated_at
  before update on public.belrai_sync_jobs
  for each row execute procedure public.set_updated_at();

alter table public.belrai_templates enable row level security;
alter table public.belrai_items enable row level security;
alter table public.belrai_assessments enable row level security;
alter table public.belrai_answers enable row level security;
alter table public.belrai_evidence_links enable row level security;
alter table public.belrai_participants enable row level security;
alter table public.belrai_caps enable row level security;
alter table public.belrai_scores enable row level security;
alter table public.belrai_sync_jobs enable row level security;
alter table public.belrai_reports enable row level security;

create policy "belrai_templates_select_staff"
on public.belrai_templates
for select
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_templates_manage_admin"
on public.belrai_templates
for all
using (public.has_any_role(array['admin'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role]));

create policy "belrai_items_select_staff"
on public.belrai_items
for select
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_items_manage_admin"
on public.belrai_items
for all
using (public.has_any_role(array['admin'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role]));

create policy "belrai_assessments_select_staff_or_owner"
on public.belrai_assessments
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role, 'billing_office'::public.user_role])
  or public.is_patient_owner(patient_id)
);

create policy "belrai_assessments_manage_staff"
on public.belrai_assessments
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_answers_select_by_assessment_access"
on public.belrai_answers
for select
using (public.can_access_belrai_assessment(assessment_id));

create policy "belrai_answers_manage_staff"
on public.belrai_answers
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_evidence_links_select_by_assessment_access"
on public.belrai_evidence_links
for select
using (public.can_access_belrai_assessment(assessment_id));

create policy "belrai_evidence_links_manage_staff"
on public.belrai_evidence_links
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_participants_select_by_assessment_access"
on public.belrai_participants
for select
using (public.can_access_belrai_assessment(assessment_id));

create policy "belrai_participants_manage_staff"
on public.belrai_participants
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_caps_select_by_assessment_access"
on public.belrai_caps
for select
using (public.can_access_belrai_assessment(assessment_id));

create policy "belrai_caps_manage_staff"
on public.belrai_caps
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_scores_select_by_assessment_access"
on public.belrai_scores
for select
using (public.can_access_belrai_assessment(assessment_id));

create policy "belrai_scores_manage_staff"
on public.belrai_scores
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_sync_jobs_select_by_assessment_access"
on public.belrai_sync_jobs
for select
using (public.can_access_belrai_assessment(assessment_id));

create policy "belrai_sync_jobs_manage_staff"
on public.belrai_sync_jobs
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));

create policy "belrai_reports_select_by_assessment_access"
on public.belrai_reports
for select
using (public.can_access_belrai_assessment(assessment_id));

create policy "belrai_reports_manage_staff"
on public.belrai_reports
for all
using (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]))
with check (public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role]));
