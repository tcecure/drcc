create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (
    request_type in (
      'cmmc_level_1_training',
      'hands_on_lab',
      'instructor_access',
      'customer_delivery_zone',
      'administrative_access'
    )
  ),
  requested_program text not null,
  reason text not null,
  experience_level text not null check (
    experience_level in ('beginner', 'intermediate', 'advanced', 'professional')
  ),
  school_or_organization text not null,
  availability_notes text,
  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'under_review',
      'more_information_required',
      'approved',
      'denied',
      'withdrawn'
    )
  ),
  reviewer_id uuid references auth.users(id) on delete set null,
  decision_notes text,
  internal_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  action_url text,
  read_at timestamptz,
  sent_email_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists access_requests_user_id_idx on public.access_requests(user_id);
create index if not exists access_requests_status_idx on public.access_requests(status);
create index if not exists access_requests_request_type_idx on public.access_requests(request_type);
create index if not exists access_requests_reviewer_id_idx on public.access_requests(reviewer_id);
create index if not exists access_requests_submitted_at_idx on public.access_requests(submitted_at desc);
create index if not exists notifications_user_id_read_at_idx on public.notifications(user_id, read_at);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

drop trigger if exists access_requests_touch_updated_at on public.access_requests;
create trigger access_requests_touch_updated_at
before update on public.access_requests
for each row execute function public.touch_updated_at();

alter table public.access_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "students can read their own access requests" on public.access_requests;
create policy "students can read their own access requests"
on public.access_requests for select
using (user_id = (select auth.uid()));

drop policy if exists "students can create their own access requests" on public.access_requests;
create policy "students can create their own access requests"
on public.access_requests for insert
with check (user_id = (select auth.uid()));

drop policy if exists "students can update editable access requests" on public.access_requests;
create policy "students can update editable access requests"
on public.access_requests for update
using (
  user_id = (select auth.uid())
  and status in ('draft', 'more_information_required')
)
with check (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted', 'withdrawn')
);

drop policy if exists "approvers can read access requests" on public.access_requests;
create policy "approvers can read access requests"
on public.access_requests for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "approvers can update access requests" on public.access_requests;
create policy "approvers can update access requests"
on public.access_requests for update
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "users can read their own notifications" on public.notifications;
create policy "users can read their own notifications"
on public.notifications for select
using (user_id = (select auth.uid()));

drop policy if exists "users can mark their own notifications read" on public.notifications;
create policy "users can mark their own notifications read"
on public.notifications for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "approvers can create notifications" on public.notifications;
create policy "approvers can create notifications"
on public.notifications for insert
with check (public.current_user_has_any_role(array['admin', 'approver']));
