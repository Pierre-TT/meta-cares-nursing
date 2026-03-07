create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create index if not exists patient_dashboard_state_assigned_nurse_id_idx
  on public.patient_dashboard_state (assigned_nurse_id);

create index if not exists patient_timeline_events_related_visit_id_idx
  on public.patient_timeline_events (related_visit_id);

create index if not exists visit_acts_visit_id_idx
  on public.visit_acts (visit_id);
