drop policy if exists "data_access_logs_select_nurse_scope" on public.data_access_logs;
create policy "data_access_logs_select_nurse_scope"
on public.data_access_logs
for select
using (
  public.has_any_role(array['nurse'::public.user_role])
  and (
    actor_id = auth.uid()
    or patient_id in (
      select assignment.patient_id
      from public.patient_assignments assignment
      where assignment.profile_id = auth.uid()
    )
  )
);
