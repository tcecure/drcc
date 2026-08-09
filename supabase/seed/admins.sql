-- Replace these values with the admin and approver users you want to seed.
-- Each email must already exist in Supabase Auth before this seed is run.
with admin_seed(email, role_name) as (
  values
    ('admin@example.com', 'admin'),
    ('approver@example.com', 'approver')
)
insert into public.user_roles (user_id, role_id, assigned_by)
select auth_users.id, roles.id, null
from admin_seed
join auth.users auth_users on lower(auth_users.email) = lower(admin_seed.email)
join public.roles roles on roles.role_name = admin_seed.role_name
on conflict (user_id, role_id) do nothing;
