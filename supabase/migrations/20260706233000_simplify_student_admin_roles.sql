alter table public.roles
drop constraint if exists roles_role_name_check;

insert into public.roles (role_name, description)
values
  ('student', 'Default role for students who view lab guides and track progress.'),
  ('approver', 'Approver role for student access approvals and permission assignment.'),
  ('admin', 'Global administrator role with full portal control.')
on conflict (role_name) do update
set description = excluded.description;

with target_roles as (
  select
    (select id from public.roles where role_name = 'student') as student_role_id,
    (select id from public.roles where role_name = 'approver') as approver_role_id,
    (select id from public.roles where role_name = 'admin') as admin_role_id
),
legacy_assignments as (
  select distinct
    ur.user_id,
    ur.assigned_by,
    case
      when r.role_name in ('super_administrator', 'program_administrator') then target_roles.admin_role_id
      when r.role_name in ('instructor', 'lab_administrator', 'customer_delivery_staff') then target_roles.approver_role_id
      else target_roles.student_role_id
    end as role_id
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  cross join target_roles
  where r.role_name in (
    'applicant',
    'moodle_student',
    'lab_candidate',
    'active_lab_student',
    'alumni',
    'instructor',
    'lab_administrator',
    'program_administrator',
    'customer_delivery_staff',
    'super_administrator'
  )
)
insert into public.user_roles (user_id, role_id, assigned_by)
select user_id, role_id, assigned_by
from legacy_assignments
where role_id is not null
on conflict (user_id, role_id) do nothing;

delete from public.user_roles ur
using public.roles r
where ur.role_id = r.id
  and r.role_name in (
    'applicant',
    'moodle_student',
    'lab_candidate',
    'active_lab_student',
    'alumni',
    'instructor',
    'lab_administrator',
    'program_administrator',
    'customer_delivery_staff',
    'super_administrator'
  );

delete from public.roles
where role_name in (
  'applicant',
  'moodle_student',
  'lab_candidate',
  'active_lab_student',
  'alumni',
  'instructor',
  'lab_administrator',
  'program_administrator',
  'customer_delivery_staff',
  'super_administrator'
);

alter table public.roles
add constraint roles_role_name_check check (
  role_name in ('student', 'approver', 'admin')
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_role_id uuid;
begin
  insert into public.profiles (id, email, full_name, organization)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    organization = excluded.organization;

  select id into student_role_id
  from public.roles
  where role_name = 'student';

  if student_role_id is not null then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (new.id, student_role_id, null)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

drop policy if exists "administrators can read all profiles" on public.profiles;
create policy "administrators can read all profiles"
on public.profiles for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "administrators can update account status" on public.profiles;
create policy "administrators can update account status"
on public.profiles for update
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "administrators can read all user roles" on public.user_roles;
create policy "administrators can read all user roles"
on public.user_roles for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "authorized administrators can assign roles" on public.user_roles;
create policy "authorized administrators can assign roles"
on public.user_roles for insert
with check (
  user_id <> (select auth.uid())
  and public.current_user_has_any_role(array['admin', 'approver'])
);

drop policy if exists "authorized administrators can remove roles" on public.user_roles;
create policy "authorized administrators can remove roles"
on public.user_roles for delete
using (
  user_id <> (select auth.uid())
  and public.current_user_has_any_role(array['admin', 'approver'])
);

drop policy if exists "administrators can insert audit events" on public.audit_events;
create policy "administrators can insert audit events"
on public.audit_events for insert
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "administrators can read audit events" on public.audit_events;
create policy "administrators can read audit events"
on public.audit_events for select
using (public.current_user_has_any_role(array['admin', 'approver']));
