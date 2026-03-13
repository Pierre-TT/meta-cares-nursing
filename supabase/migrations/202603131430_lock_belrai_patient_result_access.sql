create or replace function public.can_access_belrai_staff_assessment(target_assessment_id uuid)
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
      and public.has_any_role(array[
        'admin'::public.user_role,
        'coordinator'::public.user_role,
        'nurse'::public.user_role,
        'billing_office'::public.user_role
      ])
  );
$$;

create or replace function public.can_access_belrai_shared_result(target_assessment_id uuid)
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
        public.has_any_role(array[
          'admin'::public.user_role,
          'coordinator'::public.user_role,
          'nurse'::public.user_role,
          'billing_office'::public.user_role
        ])
        or (
          public.is_patient_owner(patient_id)
          and record_role = 'official'::public.belrai_record_role
          and shared_with_patient_at is not null
        )
      )
  );
$$;

grant execute on function public.can_access_belrai_staff_assessment(uuid) to authenticated;
grant execute on function public.can_access_belrai_shared_result(uuid) to authenticated;

drop policy if exists "belrai_assessments_select_staff_or_owner" on public.belrai_assessments;
drop policy if exists "belrai_assessments_select_staff_or_shared_official" on public.belrai_assessments;
create policy "belrai_assessments_select_staff_or_shared_official"
on public.belrai_assessments
for select
using (
  public.has_any_role(array[
    'admin'::public.user_role,
    'coordinator'::public.user_role,
    'nurse'::public.user_role,
    'billing_office'::public.user_role
  ])
  or (
    public.is_patient_owner(patient_id)
    and record_role = 'official'::public.belrai_record_role
    and shared_with_patient_at is not null
  )
);

drop policy if exists "belrai_answers_select_by_assessment_access" on public.belrai_answers;
create policy "belrai_answers_select_by_assessment_access"
on public.belrai_answers
for select
using (public.can_access_belrai_staff_assessment(assessment_id));

drop policy if exists "belrai_evidence_links_select_by_assessment_access" on public.belrai_evidence_links;
create policy "belrai_evidence_links_select_by_assessment_access"
on public.belrai_evidence_links
for select
using (public.can_access_belrai_staff_assessment(assessment_id));

drop policy if exists "belrai_participants_select_by_assessment_access" on public.belrai_participants;
create policy "belrai_participants_select_by_assessment_access"
on public.belrai_participants
for select
using (public.can_access_belrai_staff_assessment(assessment_id));

drop policy if exists "belrai_caps_select_by_assessment_access" on public.belrai_caps;
create policy "belrai_caps_select_by_assessment_access"
on public.belrai_caps
for select
using (public.can_access_belrai_shared_result(assessment_id));

drop policy if exists "belrai_scores_select_by_assessment_access" on public.belrai_scores;
create policy "belrai_scores_select_by_assessment_access"
on public.belrai_scores
for select
using (public.can_access_belrai_shared_result(assessment_id));

drop policy if exists "belrai_sync_jobs_select_by_assessment_access" on public.belrai_sync_jobs;
create policy "belrai_sync_jobs_select_by_assessment_access"
on public.belrai_sync_jobs
for select
using (public.can_access_belrai_staff_assessment(assessment_id));

drop policy if exists "belrai_reports_select_by_assessment_access" on public.belrai_reports;
create policy "belrai_reports_select_by_assessment_access"
on public.belrai_reports
for select
using (public.can_access_belrai_shared_result(assessment_id));
