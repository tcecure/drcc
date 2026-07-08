create table if not exists public.lab_instances (
  id uuid primary key default gen_random_uuid(),
  lab_track_id uuid not null references public.lab_tracks(id) on delete restrict,
  pod_name text not null,
  environment_identifier text not null unique,
  status text not null default 'available' check (
    status in ('available', 'reserved', 'provisioning', 'active', 'expiring', 'resetting', 'maintenance', 'disabled')
  ),
  assigned_user_id uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  expires_at timestamptz,
  last_reset_at timestamptz,
  maintenance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_instance_id uuid not null references public.lab_instances(id) on delete restrict,
  queue_entry_id uuid not null unique references public.lab_queue_entries(id) on delete cascade,
  status text not null default 'reservation_offered' check (
    status in ('reservation_offered', 'reserved', 'declined', 'provisioning', 'active', 'completed', 'expired', 'revoked')
  ),
  reserved_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  extended_until timestamptz,
  completed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_capacity_settings (
  id uuid primary key default gen_random_uuid(),
  lab_track_id uuid references public.lab_tracks(id) on delete cascade,
  maximum_active integer not null default 20 check (maximum_active > 0),
  maximum_reserved integer not null default 3 check (maximum_reserved >= 0),
  confirmation_window_hours integer not null default 48 check (confirmation_window_hours > 0),
  inactivity_warning_hours integer not null default 24 check (inactivity_warning_hours > 0),
  standard_duration_days integer not null default 7 check (standard_duration_days > 0),
  maximum_extension_days integer not null default 3 check (maximum_extension_days >= 0),
  automatic_expiration_enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists lab_capacity_settings_global_once_idx
on public.lab_capacity_settings((lab_track_id is null))
where lab_track_id is null;
create unique index if not exists lab_capacity_settings_track_once_idx
on public.lab_capacity_settings(lab_track_id)
where lab_track_id is not null;

create index if not exists lab_instances_lab_track_status_idx on public.lab_instances(lab_track_id, status);
create index if not exists lab_instances_assigned_user_id_idx on public.lab_instances(assigned_user_id);
create index if not exists lab_assignments_user_id_idx on public.lab_assignments(user_id);
create index if not exists lab_assignments_instance_id_idx on public.lab_assignments(lab_instance_id);
create index if not exists lab_assignments_status_idx on public.lab_assignments(status);
create index if not exists lab_assignments_expires_at_idx on public.lab_assignments(expires_at)
where status in ('reserved', 'provisioning', 'active');

drop trigger if exists lab_instances_touch_updated_at on public.lab_instances;
create trigger lab_instances_touch_updated_at
before update on public.lab_instances
for each row execute function public.touch_updated_at();

drop trigger if exists lab_assignments_touch_updated_at on public.lab_assignments;
create trigger lab_assignments_touch_updated_at
before update on public.lab_assignments
for each row execute function public.touch_updated_at();

alter table public.lab_instances enable row level security;
alter table public.lab_assignments enable row level security;
alter table public.lab_capacity_settings enable row level security;

drop policy if exists "students can read their assigned lab instances" on public.lab_instances;
create policy "students can read their assigned lab instances"
on public.lab_instances for select
using (assigned_user_id = (select auth.uid()));

drop policy if exists "admins and approvers can read lab instances" on public.lab_instances;
create policy "admins and approvers can read lab instances"
on public.lab_instances for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "admins and approvers can manage lab instances" on public.lab_instances;
create policy "admins and approvers can manage lab instances"
on public.lab_instances for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "students can read their own lab assignments" on public.lab_assignments;
create policy "students can read their own lab assignments"
on public.lab_assignments for select
using (user_id = (select auth.uid()));

drop policy if exists "students can update offered lab assignments" on public.lab_assignments;
create policy "students can update offered lab assignments"
on public.lab_assignments for update
using (
  user_id = (select auth.uid())
  and status in ('reservation_offered', 'reserved')
)
with check (user_id = (select auth.uid()));

drop policy if exists "admins and approvers can read lab assignments" on public.lab_assignments;
create policy "admins and approvers can read lab assignments"
on public.lab_assignments for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "admins and approvers can manage lab assignments" on public.lab_assignments;
create policy "admins and approvers can manage lab assignments"
on public.lab_assignments for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "authenticated users can read lab capacity settings" on public.lab_capacity_settings;
create policy "authenticated users can read lab capacity settings"
on public.lab_capacity_settings for select
to authenticated
using (true);

drop policy if exists "admins and approvers can manage capacity settings" on public.lab_capacity_settings;
create policy "admins and approvers can manage capacity settings"
on public.lab_capacity_settings for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

insert into public.lab_capacity_settings (
  lab_track_id,
  maximum_active,
  maximum_reserved,
  confirmation_window_hours,
  inactivity_warning_hours,
  standard_duration_days,
  maximum_extension_days,
  automatic_expiration_enabled
)
select null, 20, 3, 48, 24, 7, 3, true
where not exists (
  select 1
  from public.lab_capacity_settings
  where lab_track_id is null
);

insert into public.lab_instances (
  lab_track_id,
  pod_name,
  environment_identifier,
  status
)
select
  tracks.id,
  'CMMC-L1-POD-' || lpad(series.pod_number::text, 2, '0'),
  'cmmc-l1-pod-' || lpad(series.pod_number::text, 2, '0'),
  'available'
from public.lab_tracks tracks
cross join generate_series(1, 20) as series(pod_number)
where tracks.slug = 'cmmc-level-1-hands-on-lab'
on conflict (environment_identifier) do nothing;
