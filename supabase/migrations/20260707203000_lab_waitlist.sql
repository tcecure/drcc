create or replace function public.user_completed_required_moodle_training(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.moodle_enrollments enrollments
    join public.moodle_courses courses
      on courses.moodle_course_id = enrollments.moodle_course_id
    where enrollments.user_id = check_user_id
      and enrollments.enrollment_status = 'completed'
      and courses.required_for_lab = true
      and courses.active = true
  );
$$;

create table if not exists public.lab_tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  capacity integer not null default 20 check (capacity > 0),
  standard_duration_days integer not null default 7 check (standard_duration_days > 0),
  prerequisite_course_id bigint references public.moodle_courses(moodle_course_id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_track_id uuid not null references public.lab_tracks(id) on delete restrict,
  preferred_start_date date,
  weekly_availability text not null,
  experience_level text not null check (experience_level in ('beginner', 'intermediate', 'advanced', 'professional')),
  accessibility_needs text,
  acceptable_use_accepted_at timestamptz,
  connectivity_confirmed_at timestamptz,
  eligibility_verified boolean not null default false,
  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'ineligible',
      'queued',
      'on_hold',
      'withdrawn',
      'reserved',
      'provisioning',
      'active',
      'completed',
      'expired',
      'revoked'
    )
  ),
  requested_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_queue_entries (
  id uuid primary key default gen_random_uuid(),
  lab_request_id uuid not null unique references public.lab_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_track_id uuid not null references public.lab_tracks(id) on delete restrict,
  priority_group integer not null default 100,
  queue_status text not null default 'waiting' check (
    queue_status in (
      'waiting',
      'readiness_requested',
      'ready',
      'reservation_offered',
      'reserved',
      'provisioning',
      'active',
      'paused',
      'removed',
      'completed'
    )
  ),
  eligibility_date timestamptz not null default now(),
  request_date timestamptz not null default now(),
  ready_confirmed_at timestamptz,
  confirmation_expires_at timestamptz,
  reserved_at timestamptz,
  assigned_lab_instance_id uuid,
  manual_priority integer not null default 0,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lab_tracks_active_idx on public.lab_tracks(active);
create index if not exists lab_tracks_slug_idx on public.lab_tracks(slug);
create index if not exists lab_requests_user_id_idx on public.lab_requests(user_id);
create index if not exists lab_requests_lab_track_id_idx on public.lab_requests(lab_track_id);
create index if not exists lab_requests_status_idx on public.lab_requests(status);
create index if not exists lab_queue_entries_user_id_idx on public.lab_queue_entries(user_id);
create index if not exists lab_queue_entries_lab_track_status_idx on public.lab_queue_entries(lab_track_id, queue_status);
create index if not exists lab_queue_entries_order_idx
on public.lab_queue_entries(lab_track_id, priority_group, manual_priority desc, eligibility_date, request_date)
where queue_status in ('waiting', 'readiness_requested', 'ready', 'reservation_offered');

drop trigger if exists lab_tracks_touch_updated_at on public.lab_tracks;
create trigger lab_tracks_touch_updated_at
before update on public.lab_tracks
for each row execute function public.touch_updated_at();

drop trigger if exists lab_requests_touch_updated_at on public.lab_requests;
create trigger lab_requests_touch_updated_at
before update on public.lab_requests
for each row execute function public.touch_updated_at();

drop trigger if exists lab_queue_entries_touch_updated_at on public.lab_queue_entries;
create trigger lab_queue_entries_touch_updated_at
before update on public.lab_queue_entries
for each row execute function public.touch_updated_at();

alter table public.lab_tracks enable row level security;
alter table public.lab_requests enable row level security;
alter table public.lab_queue_entries enable row level security;

drop policy if exists "authenticated users can read active lab tracks" on public.lab_tracks;
create policy "authenticated users can read active lab tracks"
on public.lab_tracks for select
to authenticated
using (active = true);

drop policy if exists "admins and approvers can manage lab tracks" on public.lab_tracks;
create policy "admins and approvers can manage lab tracks"
on public.lab_tracks for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "students can read their own lab requests" on public.lab_requests;
create policy "students can read their own lab requests"
on public.lab_requests for select
using (user_id = (select auth.uid()));

drop policy if exists "eligible students can create lab requests" on public.lab_requests;
create policy "eligible students can create lab requests"
on public.lab_requests for insert
with check (
  user_id = (select auth.uid())
  and public.user_completed_required_moodle_training((select auth.uid()))
);

drop policy if exists "students can update their editable lab requests" on public.lab_requests;
create policy "students can update their editable lab requests"
on public.lab_requests for update
using (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted', 'queued', 'on_hold')
)
with check (user_id = (select auth.uid()));

drop policy if exists "admins and approvers can read lab requests" on public.lab_requests;
create policy "admins and approvers can read lab requests"
on public.lab_requests for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "admins and approvers can manage lab requests" on public.lab_requests;
create policy "admins and approvers can manage lab requests"
on public.lab_requests for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "students can read their own queue entries" on public.lab_queue_entries;
create policy "students can read their own queue entries"
on public.lab_queue_entries for select
using (user_id = (select auth.uid()));

drop policy if exists "admins and approvers can read queue entries" on public.lab_queue_entries;
create policy "admins and approvers can read queue entries"
on public.lab_queue_entries for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "admins and approvers can manage queue entries" on public.lab_queue_entries;
create policy "admins and approvers can manage queue entries"
on public.lab_queue_entries for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

insert into public.lab_tracks (
  name,
  slug,
  description,
  capacity,
  standard_duration_days,
  prerequisite_course_id,
  active
)
values (
  'CMMC Level 1 Hands-on Lab',
  'cmmc-level-1-hands-on-lab',
  'Guided virtual lab track for students who completed required CMMC Level 1 training.',
  20,
  7,
  1001,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  capacity = excluded.capacity,
  standard_duration_days = excluded.standard_duration_days,
  prerequisite_course_id = excluded.prerequisite_course_id,
  active = excluded.active;
