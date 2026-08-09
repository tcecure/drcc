create table if not exists public.moodle_courses (
  id uuid primary key default gen_random_uuid(),
  moodle_course_id bigint not null unique,
  course_name text not null,
  course_short_name text not null,
  description text not null default '',
  required_for_lab boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moodle_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  moodle_user_id bigint,
  moodle_course_id bigint not null references public.moodle_courses(moodle_course_id) on delete cascade,
  enrollment_status text not null default 'pending' check (
    enrollment_status in (
      'pending',
      'provisioning',
      'enrolled',
      'not_started',
      'in_progress',
      'completed',
      'expired',
      'suspended',
      'failed'
    )
  ),
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  enrolled_at timestamptz,
  completed_at timestamptz,
  last_activity_at timestamptz,
  last_synced_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, moodle_course_id)
);

create table if not exists public.integration_jobs (
  id uuid primary key default gen_random_uuid(),
  integration_type text not null check (integration_type in ('moodle')),
  job_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (
    status in ('pending', 'running', 'completed', 'failed', 'retrying')
  ),
  external_job_id text,
  attempts integer not null default 0,
  error_message text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists moodle_courses_active_idx on public.moodle_courses(active);
create index if not exists moodle_courses_required_for_lab_idx on public.moodle_courses(required_for_lab)
where required_for_lab = true;
create index if not exists moodle_enrollments_user_id_idx on public.moodle_enrollments(user_id);
create index if not exists moodle_enrollments_status_idx on public.moodle_enrollments(enrollment_status);
create index if not exists integration_jobs_status_idx on public.integration_jobs(status);
create index if not exists integration_jobs_user_id_idx on public.integration_jobs(user_id);
create index if not exists integration_jobs_entity_idx on public.integration_jobs(entity_type, entity_id);

drop trigger if exists moodle_courses_touch_updated_at on public.moodle_courses;
create trigger moodle_courses_touch_updated_at
before update on public.moodle_courses
for each row execute function public.touch_updated_at();

drop trigger if exists moodle_enrollments_touch_updated_at on public.moodle_enrollments;
create trigger moodle_enrollments_touch_updated_at
before update on public.moodle_enrollments
for each row execute function public.touch_updated_at();

alter table public.moodle_courses enable row level security;
alter table public.moodle_enrollments enable row level security;
alter table public.integration_jobs enable row level security;

drop policy if exists "authenticated users can read active moodle courses" on public.moodle_courses;
create policy "authenticated users can read active moodle courses"
on public.moodle_courses for select
to authenticated
using (active = true);

drop policy if exists "admins can manage moodle courses" on public.moodle_courses;
create policy "admins can manage moodle courses"
on public.moodle_courses for all
using (public.current_user_has_role('admin'))
with check (public.current_user_has_role('admin'));

drop policy if exists "students can read their own moodle enrollments" on public.moodle_enrollments;
create policy "students can read their own moodle enrollments"
on public.moodle_enrollments for select
using (user_id = (select auth.uid()));

drop policy if exists "admins and approvers can read moodle enrollments" on public.moodle_enrollments;
create policy "admins and approvers can read moodle enrollments"
on public.moodle_enrollments for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "admins and approvers can manage moodle enrollments" on public.moodle_enrollments;
create policy "admins and approvers can manage moodle enrollments"
on public.moodle_enrollments for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "admins and approvers can read integration jobs" on public.integration_jobs;
create policy "admins and approvers can read integration jobs"
on public.integration_jobs for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "admins and approvers can manage integration jobs" on public.integration_jobs;
create policy "admins and approvers can manage integration jobs"
on public.integration_jobs for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

insert into public.moodle_courses (
  moodle_course_id,
  course_name,
  course_short_name,
  description,
  required_for_lab,
  active
)
values (
  1001,
  'CMMC Level 1 Foundations',
  'CMMC-L1',
  'Foundational CMMC Level 1 training used for lab readiness checks.',
  true,
  true
)
on conflict (moodle_course_id) do update
set
  course_name = excluded.course_name,
  course_short_name = excluded.course_short_name,
  description = excluded.description,
  required_for_lab = excluded.required_for_lab,
  active = excluded.active;
