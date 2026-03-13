do $$
begin
  create type public.belrai_record_role as enum ('prep', 'official');
exception
  when duplicate_object then null;
end
$$;

alter table public.belrai_assessments
  add column if not exists record_role public.belrai_record_role not null default 'prep',
  add column if not exists linked_prep_assessment_id uuid,
  add column if not exists external_assessment_id text,
  add column if not exists source_system text,
  add column if not exists official_received_at timestamptz,
  add column if not exists shared_with_patient_at timestamptz,
  add column if not exists official_payload jsonb not null default '{}'::jsonb;

update public.belrai_assessments
set source_system = coalesce(nullif(source, ''), 'meta_cares_prep')
where source_system is null;

alter table public.belrai_assessments
  alter column source_system set default 'meta_cares_prep';

alter table public.belrai_assessments
  alter column source_system set not null;

do $$
begin
  alter table public.belrai_assessments
    add constraint belrai_assessments_linked_prep_assessment_id_fkey
    foreign key (linked_prep_assessment_id)
    references public.belrai_assessments (id)
    on delete set null;
exception
  when duplicate_object then null;
end
$$;

create index if not exists belrai_assessments_patient_role_updated_idx
  on public.belrai_assessments (patient_id, record_role, updated_at desc);

create index if not exists belrai_assessments_linked_prep_idx
  on public.belrai_assessments (linked_prep_assessment_id);

create unique index if not exists belrai_assessments_external_assessment_id_idx
  on public.belrai_assessments (external_assessment_id)
  where external_assessment_id is not null;
