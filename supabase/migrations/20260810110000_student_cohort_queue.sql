create table if not exists public.student_cohort_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'csv_import',
  cohort_number integer not null check (cohort_number > 0),
  seat_number integer not null check (seat_number between 1 and 20),
  access_starts_at timestamptz not null,
  access_ends_at timestamptz not null,
  notification_send_at timestamptz not null,
  status text not null default 'queued' check (
    status in ('queued', 'notified', 'active', 'completed', 'cancelled')
  ),
  notified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (cohort_number, seat_number)
);

create index if not exists student_cohort_assignments_user_id_idx
on public.student_cohort_assignments(user_id);

create index if not exists student_cohort_assignments_cohort_idx
on public.student_cohort_assignments(cohort_number, seat_number);

create index if not exists student_cohort_assignments_notification_idx
on public.student_cohort_assignments(status, notification_send_at)
where status = 'queued';

drop trigger if exists student_cohort_assignments_touch_updated_at on public.student_cohort_assignments;
create trigger student_cohort_assignments_touch_updated_at
before update on public.student_cohort_assignments
for each row execute function public.touch_updated_at();

alter table public.student_cohort_assignments enable row level security;

drop policy if exists "students can read their own cohort assignment" on public.student_cohort_assignments;
create policy "students can read their own cohort assignment"
on public.student_cohort_assignments for select
using (user_id = (select auth.uid()));

drop policy if exists "approvers can manage cohort assignments" on public.student_cohort_assignments;
create policy "approvers can manage cohort assignments"
on public.student_cohort_assignments for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));
