create table if not exists public.pre_registration_interests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  interest text not null check (
    interest in (
      'cmmc_level_1_training',
      'hands_on_lab',
      'student_resources',
      'customer_delivery_zone'
    )
  ),
  message text not null,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'converted', 'closed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists pre_registration_interests_email_idx
on public.pre_registration_interests(lower(email));

create index if not exists pre_registration_interests_status_created_at_idx
on public.pre_registration_interests(status, created_at desc);

alter table public.pre_registration_interests enable row level security;

drop policy if exists "approvers can read pre-registration interests" on public.pre_registration_interests;
create policy "approvers can read pre-registration interests"
on public.pre_registration_interests for select
using (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "approvers can update pre-registration interests" on public.pre_registration_interests;
create policy "approvers can update pre-registration interests"
on public.pre_registration_interests for update
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));
