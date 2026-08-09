create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_assignment_id uuid references public.lab_assignments(id) on delete set null,
  job_type text not null check (
    job_type in (
      'create_student_account',
      'enable_student_account',
      'assign_student_to_pod',
      'provision_guacamole_access',
      'provision_vpn_access',
      'seed_lab',
      'verify_lab',
      'disable_student_access',
      'reset_lab',
      'release_pod',
      'reset_student_password'
    )
  ),
  status text not null default 'pending_approval' check (
    status in (
      'pending_approval',
      'approved',
      'queued',
      'claimed',
      'running',
      'successful',
      'failed',
      'cancelled'
    )
  ),
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  claimed_by text,
  external_job_id text,
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  error_message text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provisioning_job_events (
  id uuid primary key default gen_random_uuid(),
  provisioning_job_id uuid not null references public.provisioning_jobs(id) on delete cascade,
  bridge_id text,
  from_status text,
  to_status text not null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists provisioning_jobs_user_id_idx on public.provisioning_jobs(user_id);
create index if not exists provisioning_jobs_assignment_idx on public.provisioning_jobs(lab_assignment_id);
create index if not exists provisioning_jobs_status_requested_idx on public.provisioning_jobs(status, requested_at desc);
create index if not exists provisioning_jobs_job_type_idx on public.provisioning_jobs(job_type);
create index if not exists provisioning_job_events_job_id_idx on public.provisioning_job_events(provisioning_job_id, created_at desc);

drop trigger if exists provisioning_jobs_touch_updated_at on public.provisioning_jobs;
create trigger provisioning_jobs_touch_updated_at
before update on public.provisioning_jobs
for each row execute function public.touch_updated_at();

alter table public.provisioning_jobs enable row level security;
alter table public.provisioning_job_events enable row level security;

drop policy if exists "students can read their own provisioning jobs" on public.provisioning_jobs;
create policy "students can read their own provisioning jobs"
on public.provisioning_jobs for select
using (user_id = (select auth.uid()));

drop policy if exists "approvers can manage provisioning jobs" on public.provisioning_jobs;
create policy "approvers can manage provisioning jobs"
on public.provisioning_jobs for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "students can read their own provisioning job events" on public.provisioning_job_events;
create policy "students can read their own provisioning job events"
on public.provisioning_job_events for select
using (
  exists (
    select 1
    from public.provisioning_jobs jobs
    where jobs.id = provisioning_job_events.provisioning_job_id
      and jobs.user_id = (select auth.uid())
  )
);

drop policy if exists "approvers can read provisioning job events" on public.provisioning_job_events;
create policy "approvers can read provisioning job events"
on public.provisioning_job_events for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "approvers can create provisioning job events" on public.provisioning_job_events;
create policy "approvers can create provisioning job events"
on public.provisioning_job_events for insert
with check (public.current_user_has_any_role(array['admin', 'approver']));
