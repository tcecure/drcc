insert into public.roles (role_name, description)
values
  ('student', 'Default role for students who view lab guides and track progress.'),
  ('approver', 'Approver role for student access approvals and permission assignment.'),
  ('admin', 'Global administrator role with full portal control.')
on conflict (role_name) do update
set description = excluded.description;
