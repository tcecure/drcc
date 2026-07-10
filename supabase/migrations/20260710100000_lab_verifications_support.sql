create table if not exists public.lab_verifications (
  id uuid primary key default gen_random_uuid(),
  lab_assignment_id uuid not null references public.lab_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verification_type text not null default 'verify_lab' check (
    verification_type in ('check_progress', 'verify_lab')
  ),
  status text not null default 'not_started' check (
    status in ('not_started', 'queued', 'running', 'passed', 'failed', 'error')
  ),
  score integer check (score is null or (score >= 0 and score <= 100)),
  results jsonb not null default '{}'::jsonb,
  external_job_id text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_assignment_id uuid references public.lab_assignments(id) on delete set null,
  category text not null check (
    category in ('connectivity', 'guacamole', 'vpn', 'lab_guide', 'verification', 'other')
  ),
  subject text not null,
  description text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_on_student', 'resolved', 'closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists lab_verifications_assignment_idx on public.lab_verifications(lab_assignment_id);
create index if not exists lab_verifications_user_requested_idx on public.lab_verifications(user_id, requested_at desc);
create index if not exists lab_verifications_status_idx on public.lab_verifications(status);
create index if not exists support_requests_user_created_idx on public.support_requests(user_id, created_at desc);
create index if not exists support_requests_status_priority_idx on public.support_requests(status, priority);

drop trigger if exists lab_verifications_touch_updated_at on public.lab_verifications;
create trigger lab_verifications_touch_updated_at
before update on public.lab_verifications
for each row execute function public.touch_updated_at();

drop trigger if exists support_requests_touch_updated_at on public.support_requests;
create trigger support_requests_touch_updated_at
before update on public.support_requests
for each row execute function public.touch_updated_at();

alter table public.lab_verifications enable row level security;
alter table public.support_requests enable row level security;

drop policy if exists "students can read their own lab verifications" on public.lab_verifications;
create policy "students can read their own lab verifications"
on public.lab_verifications for select
using (user_id = (select auth.uid()));

drop policy if exists "students can create their own lab verifications" on public.lab_verifications;
create policy "students can create their own lab verifications"
on public.lab_verifications for insert
with check (user_id = (select auth.uid()));

drop policy if exists "approvers can manage lab verifications" on public.lab_verifications;
create policy "approvers can manage lab verifications"
on public.lab_verifications for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "students can read their own support requests" on public.support_requests;
create policy "students can read their own support requests"
on public.support_requests for select
using (user_id = (select auth.uid()));

drop policy if exists "students can create their own support requests" on public.support_requests;
create policy "students can create their own support requests"
on public.support_requests for insert
with check (user_id = (select auth.uid()));

drop policy if exists "approvers can manage support requests" on public.support_requests;
create policy "approvers can manage support requests"
on public.support_requests for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));
