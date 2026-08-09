create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  organization text not null default '',
  phone text,
  account_status text not null default 'pending'
    check (account_status in ('pending', 'active', 'suspended', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  role_name text not null unique check (
    role_name in (
      'student',
      'approver',
      'admin'
    )
  ),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, role_id)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  source_ip inet,
  created_at timestamptz not null default now()
);

create index if not exists profiles_account_status_idx on public.profiles(account_status);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists user_roles_role_id_idx on public.user_roles(role_id);
create index if not exists user_roles_assigned_by_idx on public.user_roles(assigned_by);
create index if not exists audit_events_actor_id_idx on public.audit_events(actor_id);
create index if not exists audit_events_entity_idx on public.audit_events(entity_type, entity_id);

insert into public.roles (role_name, description)
values
  ('student', 'Default role for students who view lab guides and track progress.'),
  ('approver', 'Approver role for student access approvals and permission assignment.'),
  ('admin', 'Global administrator role with full portal control.')
on conflict (role_name) do update
set description = excluded.description;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.current_user_has_role(required_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = (select auth.uid())
      and r.role_name = required_role
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

create or replace function public.current_user_has_any_role(required_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = (select auth.uid())
      and r.role_name = any(required_roles)
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "users can read their own profile" on public.profiles;
create policy "users can read their own profile"
on public.profiles for select
using (id = (select auth.uid()));

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles for update
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "administrators can read all profiles" on public.profiles;
create policy "administrators can read all profiles"
on public.profiles for select
using (
  public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
);

drop policy if exists "administrators can update account status" on public.profiles;
create policy "administrators can update account status"
on public.profiles for update
using (
  public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
)
with check (
  public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
);

drop policy if exists "authenticated users can read roles" on public.roles;
create policy "authenticated users can read roles"
on public.roles for select
using ((select auth.uid()) is not null);

drop policy if exists "users can read their own roles" on public.user_roles;
create policy "users can read their own roles"
on public.user_roles for select
using (user_id = (select auth.uid()));

drop policy if exists "administrators can read all user roles" on public.user_roles;
create policy "administrators can read all user roles"
on public.user_roles for select
using (
  public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
);

drop policy if exists "authorized administrators can assign roles" on public.user_roles;
create policy "authorized administrators can assign roles"
on public.user_roles for insert
with check (
  user_id <> (select auth.uid())
  and public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
);

drop policy if exists "authorized administrators can remove roles" on public.user_roles;
create policy "authorized administrators can remove roles"
on public.user_roles for delete
using (
  user_id <> (select auth.uid())
  and public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
);

drop policy if exists "administrators can insert audit events" on public.audit_events;
create policy "administrators can insert audit events"
on public.audit_events for insert
with check (
  public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
);

drop policy if exists "administrators can read audit events" on public.audit_events;
create policy "administrators can read audit events"
on public.audit_events for select
using (
  public.current_user_has_any_role(array[
    'admin',
    'approver'
  ])
);
