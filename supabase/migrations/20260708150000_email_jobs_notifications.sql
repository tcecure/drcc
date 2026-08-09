create table if not exists public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  template_name text not null,
  recipient text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  rendered_text text,
  rendered_html text,
  status text not null default 'queued' check (
    status in ('queued', 'sending', 'sent', 'failed', 'cancelled')
  ),
  attempts integer not null default 0 check (attempts >= 0),
  error_message text,
  requested_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_jobs_user_id_idx on public.email_jobs(user_id);
create index if not exists email_jobs_status_requested_at_idx on public.email_jobs(status, requested_at desc);
create index if not exists email_jobs_template_name_idx on public.email_jobs(template_name);

drop trigger if exists email_jobs_touch_updated_at on public.email_jobs;
create trigger email_jobs_touch_updated_at
before update on public.email_jobs
for each row execute function public.touch_updated_at();

alter table public.email_jobs enable row level security;

drop policy if exists "users can read their own email jobs" on public.email_jobs;
create policy "users can read their own email jobs"
on public.email_jobs for select
using (user_id = (select auth.uid()));

drop policy if exists "approvers can manage email jobs" on public.email_jobs;
create policy "approvers can manage email jobs"
on public.email_jobs for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "approvers can read notifications" on public.notifications;
create policy "approvers can read notifications"
on public.notifications for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "approvers can manage notifications" on public.notifications;
create policy "approvers can manage notifications"
on public.notifications for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));
