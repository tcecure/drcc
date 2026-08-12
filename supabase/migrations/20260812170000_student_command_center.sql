alter table public.student_cohort_assignments
  add column if not exists pod_name text,
  add column if not exists lab_username text,
  add column if not exists credential_status text not null default 'pending_rotation',
  add column if not exists credential_version integer not null default 0,
  add column if not exists credential_ready_at timestamptz,
  add column if not exists last_progress_synced_at timestamptz;

update public.student_cohort_assignments
set
  pod_name = coalesce(pod_name, 'Pod' || lpad(seat_number::text, 2, '0')),
  lab_username = coalesce(lab_username, 'student' || lpad(seat_number::text, 2, '0'));

alter table public.student_cohort_assignments
  alter column pod_name set not null,
  alter column lab_username set not null;

alter table public.student_cohort_assignments
  drop constraint if exists student_cohort_assignments_pod_name_check,
  add constraint student_cohort_assignments_pod_name_check
    check (pod_name ~ '^Pod(0[1-9]|1[0-9]|20)$'),
  drop constraint if exists student_cohort_assignments_lab_username_check,
  add constraint student_cohort_assignments_lab_username_check
    check (lab_username ~ '^student(0[1-9]|1[0-9]|20)$'),
  drop constraint if exists student_cohort_assignments_credential_status_check,
  add constraint student_cohort_assignments_credential_status_check
    check (credential_status in ('pending_rotation', 'ready', 'failed', 'revoked')),
  drop constraint if exists student_cohort_assignments_credential_version_check,
  add constraint student_cohort_assignments_credential_version_check
    check (credential_version >= 0);

create table if not exists public.lab_credentials (
  id uuid primary key default gen_random_uuid(),
  cohort_assignment_id uuid not null unique references public.student_cohort_assignments(id) on delete cascade,
  credential_version integer not null check (credential_version > 0),
  encrypted_password text not null,
  initialization_vector text not null,
  auth_tag text not null,
  ready_at timestamptz not null default now(),
  last_revealed_at timestamptz,
  reveal_count integer not null default 0 check (reveal_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_progress (
  id uuid primary key default gen_random_uuid(),
  cohort_assignment_id uuid not null references public.student_cohort_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pod_name text not null,
  family text not null check (family in ('AC', 'IA', 'SI', 'SC', 'MP', 'PE')),
  lab_id text not null,
  completed boolean not null default false,
  reason text not null default 'Not yet verified',
  verifier_job_id bigint,
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_assignment_id, family, lab_id)
);

create table if not exists public.lab_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'awx',
  family text check (family in ('AC', 'IA', 'SI', 'SC', 'MP', 'PE')),
  verifier_job_id bigint,
  status text not null check (status in ('running', 'successful', 'failed')),
  records_received integer not null default 0,
  records_upserted integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lab_progress_user_id_idx on public.lab_progress(user_id);
create index if not exists lab_progress_pod_family_idx on public.lab_progress(pod_name, family);
create index if not exists integration_events_delivery_idx on public.integration_events(status, available_at);

create or replace function public.enqueue_cohort_assignment_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.integration_events (
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    idempotency_key
  ) values (
    'student.cohort_assigned',
    'student_cohort_assignment',
    new.id,
    jsonb_build_object(
      'assignment_id', new.id,
      'user_id', new.user_id,
      'cohort_number', new.cohort_number,
      'seat_number', new.seat_number,
      'pod_name', new.pod_name,
      'lab_username', new.lab_username,
      'access_starts_at', new.access_starts_at,
      'access_ends_at', new.access_ends_at
    ),
    'student.cohort_assigned:' || new.id::text
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

drop trigger if exists student_cohort_assignment_enqueue_event on public.student_cohort_assignments;
create trigger student_cohort_assignment_enqueue_event
after insert on public.student_cohort_assignments
for each row execute function public.enqueue_cohort_assignment_event();

insert into public.integration_events (
  event_type,
  aggregate_type,
  aggregate_id,
  payload,
  idempotency_key
)
select
  'student.cohort_assigned',
  'student_cohort_assignment',
  assignment.id,
  jsonb_build_object(
    'assignment_id', assignment.id,
    'user_id', assignment.user_id,
    'cohort_number', assignment.cohort_number,
    'seat_number', assignment.seat_number,
    'pod_name', assignment.pod_name,
    'lab_username', assignment.lab_username,
    'access_starts_at', assignment.access_starts_at,
    'access_ends_at', assignment.access_ends_at
  ),
  'student.cohort_assigned:' || assignment.id::text
from public.student_cohort_assignments assignment
on conflict (idempotency_key) do nothing;

drop trigger if exists lab_credentials_touch_updated_at on public.lab_credentials;
create trigger lab_credentials_touch_updated_at
before update on public.lab_credentials
for each row execute function public.touch_updated_at();

drop trigger if exists lab_progress_touch_updated_at on public.lab_progress;
create trigger lab_progress_touch_updated_at
before update on public.lab_progress
for each row execute function public.touch_updated_at();

drop trigger if exists integration_events_touch_updated_at on public.integration_events;
create trigger integration_events_touch_updated_at
before update on public.integration_events
for each row execute function public.touch_updated_at();

alter table public.lab_credentials enable row level security;
alter table public.lab_progress enable row level security;
alter table public.lab_sync_runs enable row level security;
alter table public.integration_events enable row level security;

drop policy if exists "students can read their own lab progress" on public.lab_progress;
create policy "students can read their own lab progress"
on public.lab_progress for select
using (user_id = (select auth.uid()));

drop policy if exists "approvers can manage lab progress" on public.lab_progress;
drop policy if exists "approvers can read lab progress" on public.lab_progress;
create policy "approvers can read lab progress"
on public.lab_progress for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "approvers can read lab sync runs" on public.lab_sync_runs;
create policy "approvers can read lab sync runs"
on public.lab_sync_runs for select
using (public.current_user_has_any_role(array['admin', 'approver']));
