create table if not exists public.data_access_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_role public.user_role,
  action text not null
    check (action in ('read', 'insert', 'update', 'delete', 'sync')),
  table_name text not null,
  record_id uuid,
  patient_id uuid references public.patients (id) on delete set null,
  resource_label text not null default '',
  ip_hint text,
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high')),
  contains_pii boolean not null default true,
  system_generated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ehealth_consent_sync_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  sync_type text not null default 'full'
    check (sync_type in ('consent', 'therapeutic_link', 'full')),
  status text not null default 'pending'
    check (status in ('pending', 'success', 'fallback', 'error')),
  source text not null default 'local-fallback',
  response_code text,
  payload jsonb not null default '{}'::jsonb,
  error_detail text,
  synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists data_access_logs_created_at_idx
  on public.data_access_logs (created_at desc);
create index if not exists data_access_logs_actor_id_idx
  on public.data_access_logs (actor_id, created_at desc);
create index if not exists data_access_logs_patient_id_idx
  on public.data_access_logs (patient_id, created_at desc);
create index if not exists data_access_logs_table_name_idx
  on public.data_access_logs (table_name, created_at desc);

create index if not exists ehealth_consent_sync_logs_patient_id_idx
  on public.ehealth_consent_sync_logs (patient_id, synced_at desc);
create index if not exists ehealth_consent_sync_logs_status_idx
  on public.ehealth_consent_sync_logs (status, synced_at desc);

create or replace function public.normalize_niss(value text)
returns text
language sql
stable
set search_path = public
as $$
  select nullif(regexp_replace(coalesce(value, ''), '[^0-9]+', '', 'g'), '');
$$;

create or replace function public.pseudo_niss(value text)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when public.normalize_niss(value) is null then null
    else
      'PSN-' || upper(
        substr(
          encode(
            hmac(
              public.normalize_niss(value),
              coalesce(
                nullif(current_setting('app.settings.pseudonymization_key', true), ''),
                'meta-cares-nursing-dev-key'
              ),
              'sha256'
            ),
            'hex'
          ),
          1,
          20
        )
      )
  end;
$$;

create or replace function public.log_data_access(
  p_table_name text,
  p_action text default 'read',
  p_record_id uuid default null,
  p_patient_id uuid default null,
  p_ip_hint text default null,
  p_resource_label text default null,
  p_severity text default 'low',
  p_contains_pii boolean default true,
  p_system_generated boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_actor_id uuid := auth.uid();
  resolved_actor_role public.user_role;
  inserted_id uuid;
begin
  if coalesce(trim(p_table_name), '') = '' then
    raise exception 'p_table_name is required';
  end if;

  if p_action not in ('read', 'insert', 'update', 'delete', 'sync') then
    raise exception 'Unsupported p_action: %', p_action;
  end if;

  if p_severity not in ('low', 'medium', 'high') then
    raise exception 'Unsupported p_severity: %', p_severity;
  end if;

  select role
  into resolved_actor_role
  from public.profiles
  where id = resolved_actor_id;

  insert into public.data_access_logs (
    actor_id,
    actor_role,
    action,
    table_name,
    record_id,
    patient_id,
    resource_label,
    ip_hint,
    severity,
    contains_pii,
    system_generated,
    metadata
  )
  values (
    resolved_actor_id,
    resolved_actor_role,
    p_action,
    p_table_name,
    p_record_id,
    p_patient_id,
    coalesce(nullif(p_resource_label, ''), p_table_name),
    p_ip_hint,
    p_severity,
    p_contains_pii,
    p_system_generated,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

create or replace function public.audit_sensitive_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_action text;
  target_record_id uuid;
  target_patient_id uuid;
  target_resource_label text;
  target_severity text := 'low';
  target_metadata jsonb := jsonb_build_object('trigger', tg_name);
begin
  target_action := case tg_op
    when 'INSERT' then 'insert'
    when 'UPDATE' then 'update'
    when 'DELETE' then 'delete'
    else 'update'
  end;

  if tg_table_name = 'patients' then
    target_record_id := case when tg_op = 'DELETE' then old.id else new.id end;
    target_patient_id := target_record_id;
    target_resource_label := 'Dossier patient';
  elsif tg_table_name = 'patient_consents' then
    target_record_id := case when tg_op = 'DELETE' then old.id else new.id end;
    target_patient_id := case when tg_op = 'DELETE' then old.patient_id else new.patient_id end;
    target_resource_label := 'Consentement eHealth';
    target_severity := 'medium';
  elsif tg_table_name = 'visits' then
    target_record_id := case when tg_op = 'DELETE' then old.id else new.id end;
    target_patient_id := case when tg_op = 'DELETE' then old.patient_id else new.patient_id end;
    target_resource_label := 'Visite infirmière';
    target_metadata := target_metadata || jsonb_build_object(
      'status',
      case when tg_op = 'DELETE' then old.status else new.status end
    );
  elsif tg_table_name = 'visit_acts' then
    target_record_id := case when tg_op = 'DELETE' then old.id else new.id end;
    target_resource_label := 'Acte de visite';
    target_metadata := target_metadata || jsonb_build_object(
      'visit_id',
      case when tg_op = 'DELETE' then old.visit_id else new.visit_id end,
      'code',
      case when tg_op = 'DELETE' then old.code else new.code end
    );

    select patient_id
    into target_patient_id
    from public.visits
    where id = case when tg_op = 'DELETE' then old.visit_id else new.visit_id end;
  else
    return coalesce(new, old);
  end if;

  if target_action = 'delete' then
    target_severity := 'high';
  end if;

  perform public.log_data_access(
    p_table_name => tg_table_name,
    p_action => target_action,
    p_record_id => target_record_id,
    p_patient_id => target_patient_id,
    p_resource_label => target_resource_label,
    p_severity => target_severity,
    p_contains_pii => true,
    p_system_generated => auth.uid() is null,
    p_metadata => target_metadata
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_patients_row_change on public.patients;
create trigger audit_patients_row_change
  after insert or update or delete on public.patients
  for each row execute procedure public.audit_sensitive_row_change();

drop trigger if exists audit_patient_consents_row_change on public.patient_consents;
create trigger audit_patient_consents_row_change
  after insert or update or delete on public.patient_consents
  for each row execute procedure public.audit_sensitive_row_change();

drop trigger if exists audit_visits_row_change on public.visits;
create trigger audit_visits_row_change
  after insert or update or delete on public.visits
  for each row execute procedure public.audit_sensitive_row_change();

drop trigger if exists audit_visit_acts_row_change on public.visit_acts;
create trigger audit_visit_acts_row_change
  after insert or update or delete on public.visit_acts
  for each row execute procedure public.audit_sensitive_row_change();

create or replace view public.patients_pseudonymised
with (security_invoker = true)
as
select
  p.id,
  public.pseudo_niss(p.niss) as patient_pseudonym,
  p.gender,
  p.city,
  p.postal_code,
  p.mutuality,
  p.mutuality_number,
  p.katz_category,
  p.katz_score,
  p.is_active,
  p.created_at,
  p.updated_at
from public.patients p;

create or replace view public.visit_hourly_billing_exports
with (security_invoker = true)
as
select
  s.visit_id,
  v.patient_id,
  public.pseudo_niss(p.niss) as patient_pseudonym,
  v.nurse_id,
  v.scheduled_start,
  v.scheduled_end,
  s.place_of_service,
  s.total_travel_minutes,
  s.total_direct_minutes,
  s.total_indirect_minutes,
  s.total_billable_minutes,
  s.travel_amount,
  s.direct_amount,
  s.indirect_amount,
  s.hourly_amount,
  s.estimated_forfait_amount,
  s.delta_amount,
  s.requires_manual_review,
  s.review_reasons,
  s.status,
  s.generated_at,
  s.validated_at
from public.visit_hourly_billing_summaries s
join public.visits v on v.id = s.visit_id
join public.patients p on p.id = v.patient_id;

alter table public.data_access_logs enable row level security;
alter table public.ehealth_consent_sync_logs enable row level security;

drop policy if exists "data_access_logs_select_admin_or_coordinator" on public.data_access_logs;
create policy "data_access_logs_select_admin_or_coordinator"
on public.data_access_logs
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role])
);

drop policy if exists "ehealth_consent_sync_logs_select_staff_or_owner" on public.ehealth_consent_sync_logs;
create policy "ehealth_consent_sync_logs_select_staff_or_owner"
on public.ehealth_consent_sync_logs
for select
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
  or public.is_patient_owner(patient_id)
);

drop policy if exists "ehealth_consent_sync_logs_manage_staff" on public.ehealth_consent_sync_logs;
create policy "ehealth_consent_sync_logs_manage_staff"
on public.ehealth_consent_sync_logs
for all
using (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
)
with check (
  public.has_any_role(array['admin'::public.user_role, 'coordinator'::public.user_role, 'nurse'::public.user_role])
);

grant execute on function public.normalize_niss(text) to authenticated;
grant execute on function public.pseudo_niss(text) to authenticated;
grant execute on function public.log_data_access(
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  boolean,
  jsonb
) to authenticated;

grant select on public.patients_pseudonymised to authenticated;
grant select on public.visit_hourly_billing_exports to authenticated;
