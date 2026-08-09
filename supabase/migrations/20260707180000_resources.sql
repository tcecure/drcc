insert into storage.buckets (id, name, public)
values
  ('public-resources', 'public-resources', true),
  ('protected-resources', 'protected-resources', false)
on conflict (id) do update
set public = excluded.public;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  resource_type text not null check (
    resource_type in (
      'student_guide',
      'lab_guide',
      'video',
      'policy',
      'checklist',
      'faq',
      'troubleshooting',
      'cmmc_reference',
      'template',
      'instructor_resource',
      'customer_delivery_resource',
      'announcement'
    )
  ),
  program_area text not null,
  audience text not null default 'public' check (
    audience in ('public', 'student', 'approver', 'admin')
  ),
  required_role text check (required_role in ('student', 'approver', 'admin')),
  lab_track_id uuid,
  file_path text,
  external_url text,
  version text not null default '1.0',
  status text not null default 'draft' check (
    status in ('draft', 'in_review', 'published', 'archived')
  ),
  effective_date date,
  expiration_date date,
  owner_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_due_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(program_area, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_has_target check (file_path is not null or external_url is not null)
);

create table if not exists public.resource_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.resource_tag_links (
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id uuid not null references public.resource_tags(id) on delete cascade,
  primary key (resource_id, tag_id)
);

create index if not exists resources_status_idx on public.resources(status);
create index if not exists resources_type_idx on public.resources(resource_type);
create index if not exists resources_audience_idx on public.resources(audience);
create index if not exists resources_required_role_idx on public.resources(required_role);
create index if not exists resources_program_area_idx on public.resources(program_area);
create index if not exists resources_review_due_at_idx on public.resources(review_due_at)
where review_due_at is not null and status = 'published';
create index if not exists resources_published_effective_idx on public.resources(effective_date desc)
where status = 'published';
create index if not exists resources_search_idx on public.resources using gin(search_vector);
create index if not exists resource_tag_links_tag_id_idx on public.resource_tag_links(tag_id);

drop trigger if exists resources_touch_updated_at on public.resources;
create trigger resources_touch_updated_at
before update on public.resources
for each row execute function public.touch_updated_at();

alter table public.resources enable row level security;
alter table public.resource_tags enable row level security;
alter table public.resource_tag_links enable row level security;

drop policy if exists "public can read published public resources" on public.resources;
create policy "public can read published public resources"
on public.resources for select
using (
  status = 'published'
  and audience = 'public'
  and required_role is null
);

drop policy if exists "authorized users can read role resources" on public.resources;
create policy "authorized users can read role resources"
on public.resources for select
using (
  status = 'published'
  and (
    audience = 'public'
    or required_role is null
    or public.current_user_has_role(required_role)
    or public.current_user_has_any_role(array['admin', 'approver'])
  )
);

drop policy if exists "admins can manage resources" on public.resources;
create policy "admins can manage resources"
on public.resources for all
using (public.current_user_has_role('admin'))
with check (public.current_user_has_role('admin'));

drop policy if exists "public can read tags" on public.resource_tags;
create policy "public can read tags"
on public.resource_tags for select
using (true);

drop policy if exists "admins can manage tags" on public.resource_tags;
create policy "admins can manage tags"
on public.resource_tags for all
using (public.current_user_has_role('admin'))
with check (public.current_user_has_role('admin'));

drop policy if exists "public can read tag links for readable resources" on public.resource_tag_links;
create policy "public can read tag links for readable resources"
on public.resource_tag_links for select
using (
  exists (
    select 1
    from public.resources r
    where r.id = resource_id
      and r.status = 'published'
      and (
        r.audience = 'public'
        or r.required_role is null
        or public.current_user_has_role(r.required_role)
        or public.current_user_has_any_role(array['admin', 'approver'])
      )
  )
);

drop policy if exists "admins can manage tag links" on public.resource_tag_links;
create policy "admins can manage tag links"
on public.resource_tag_links for all
using (public.current_user_has_role('admin'))
with check (public.current_user_has_role('admin'));

drop policy if exists "public can read public resource files" on storage.objects;
create policy "public can read public resource files"
on storage.objects for select
using (bucket_id = 'public-resources');

drop policy if exists "authenticated can read protected resource files" on storage.objects;
create policy "authenticated can read protected resource files"
on storage.objects for select
to authenticated
using (bucket_id = 'protected-resources');

drop policy if exists "admins can manage resource files" on storage.objects;
create policy "admins can manage resource files"
on storage.objects for all
to authenticated
using (
  bucket_id in ('public-resources', 'protected-resources')
  and public.current_user_has_role('admin')
)
with check (
  bucket_id in ('public-resources', 'protected-resources')
  and public.current_user_has_role('admin')
);

insert into public.resource_tags (name, slug)
values
  ('Lab Guide', 'lab-guide'),
  ('CMMC', 'cmmc'),
  ('Checklist', 'checklist'),
  ('Student Guide', 'student-guide')
on conflict (slug) do update
set name = excluded.name;
