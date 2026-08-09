create table if not exists public.customer_engagements (
  id uuid primary key default gen_random_uuid(),
  engagement_name text not null,
  customer_display_name text not null,
  engagement_type text not null check (
    engagement_type in ('readiness_support', 'assessment_prep', 'vulnerability_review', 'secure_collaboration', 'other')
  ),
  status text not null default 'planning' check (
    status in ('planning', 'active', 'paused', 'completed', 'archived')
  ),
  start_date date,
  end_date date,
  owner_id uuid references auth.users(id) on delete set null,
  internal_workspace_url text,
  classification_notice text not null default 'Metadata only. Customer material remains in the controlled environment.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_engagement_members (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.customer_engagements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  engagement_role text not null check (
    engagement_role in ('viewer', 'analyst', 'lead', 'reviewer', 'owner')
  ),
  approved_by uuid references auth.users(id) on delete set null,
  access_starts_at timestamptz not null default now(),
  access_expires_at timestamptz,
  last_reviewed_at timestamptz,
  status text not null default 'active' check (
    status in ('active', 'suspended', 'expired', 'revoked')
  ),
  created_at timestamptz not null default now(),
  unique (engagement_id, user_id)
);

create table if not exists public.customer_access_reviews (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.customer_engagements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  review_status text not null check (
    review_status in ('approved', 'revoked', 'needs_review')
  ),
  review_notes text,
  reviewed_at timestamptz not null default now()
);

create index if not exists customer_engagements_status_idx on public.customer_engagements(status);
create index if not exists customer_engagement_members_user_status_idx on public.customer_engagement_members(user_id, status);
create index if not exists customer_engagement_members_engagement_idx on public.customer_engagement_members(engagement_id);
create index if not exists customer_access_reviews_engagement_idx on public.customer_access_reviews(engagement_id, reviewed_at desc);

drop trigger if exists customer_engagements_touch_updated_at on public.customer_engagements;
create trigger customer_engagements_touch_updated_at
before update on public.customer_engagements
for each row execute function public.touch_updated_at();

alter table public.customer_engagements enable row level security;
alter table public.customer_engagement_members enable row level security;
alter table public.customer_access_reviews enable row level security;

drop policy if exists "members can read assigned customer engagements" on public.customer_engagements;
create policy "members can read assigned customer engagements"
on public.customer_engagements for select
using (
  exists (
    select 1
    from public.customer_engagement_members members
    where members.engagement_id = customer_engagements.id
      and members.user_id = (select auth.uid())
      and members.status = 'active'
      and (members.access_starts_at is null or members.access_starts_at <= now())
      and (members.access_expires_at is null or members.access_expires_at > now())
  )
);

drop policy if exists "approvers can manage customer engagements" on public.customer_engagements;
create policy "approvers can manage customer engagements"
on public.customer_engagements for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "members can read their customer memberships" on public.customer_engagement_members;
create policy "members can read their customer memberships"
on public.customer_engagement_members for select
using (user_id = (select auth.uid()));

drop policy if exists "approvers can manage customer memberships" on public.customer_engagement_members;
create policy "approvers can manage customer memberships"
on public.customer_engagement_members for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));

drop policy if exists "members can read their customer access reviews" on public.customer_access_reviews;
create policy "members can read their customer access reviews"
on public.customer_access_reviews for select
using (user_id = (select auth.uid()));

drop policy if exists "approvers can manage customer access reviews" on public.customer_access_reviews;
create policy "approvers can manage customer access reviews"
on public.customer_access_reviews for all
using (public.current_user_has_any_role(array['admin', 'approver']))
with check (public.current_user_has_any_role(array['admin', 'approver']));
