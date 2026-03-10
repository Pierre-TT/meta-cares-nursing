do $$
begin
  create type public.professional_status as enum (
    'independant',
    'independant_complementaire',
    'salarie'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists professional_status public.professional_status,
  add column if not exists bce_number text,
  add column if not exists company_name text,
  add column if not exists professional_street text,
  add column if not exists professional_house_number text,
  add column if not exists professional_postal_code text,
  add column if not exists professional_city text;

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
  resolved_professional_status public.professional_status;
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

  resolved_professional_status := case lower(coalesce(new.raw_user_meta_data ->> 'professional_status', ''))
    when 'independant' then 'independant'::public.professional_status
    when 'independant_complementaire' then 'independant_complementaire'::public.professional_status
    when 'salarie' then 'salarie'::public.professional_status
    else null
  end;

  insert into public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    phone,
    inami_number,
    professional_status,
    bce_number,
    company_name,
    professional_street,
    professional_house_number,
    professional_postal_code,
    professional_city,
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
    resolved_professional_status,
    nullif(new.raw_user_meta_data ->> 'bce_number', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'professional_street', ''),
    nullif(new.raw_user_meta_data ->> 'professional_house_number', ''),
    nullif(new.raw_user_meta_data ->> 'professional_postal_code', ''),
    nullif(new.raw_user_meta_data ->> 'professional_city', ''),
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
    professional_status = excluded.professional_status,
    bce_number = excluded.bce_number,
    company_name = excluded.company_name,
    professional_street = excluded.professional_street,
    professional_house_number = excluded.professional_house_number,
    professional_postal_code = excluded.professional_postal_code,
    professional_city = excluded.professional_city,
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_images_public_read" on storage.objects;
create policy "profile_images_public_read"
on storage.objects
for select
using (bucket_id = 'profile-images');

drop policy if exists "profile_images_insert_own" on storage.objects;
create policy "profile_images_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_images_update_own" on storage.objects;
create policy "profile_images_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_images_delete_own" on storage.objects;
create policy "profile_images_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
