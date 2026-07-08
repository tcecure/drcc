import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260706132000_auth_profiles_roles.sql"),
  "utf8",
);
const simplifiedRolesMigration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260706233000_simplify_student_admin_roles.sql"),
  "utf8",
);
const adminSeed = readFileSync(
  resolve(process.cwd(), "../../supabase/seed/admins.sql"),
  "utf8",
);
const accessRequestsMigration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260707143000_access_requests_notifications.sql"),
  "utf8",
);
const resourcesMigration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260707180000_resources.sql"),
  "utf8",
);
const moodleMigration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260707193000_moodle_training.sql"),
  "utf8",
);
const labWaitlistMigration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260707203000_lab_waitlist.sql"),
  "utf8",
);
const labCapacityMigration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260708103000_lab_capacity_reservations.sql"),
  "utf8",
);

describe("auth profiles roles migration", () => {
  it("enables RLS for user-facing tables", () => {
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("alter table public.roles enable row level security");
    expect(migration).toContain("alter table public.user_roles enable row level security");
    expect(migration).toContain("alter table public.audit_events enable row level security");
  });

  it("prevents users from assigning roles to themselves", () => {
    expect(migration).toContain("user_id <> (select auth.uid())");
    expect(migration).toContain("authorized administrators can assign roles");
  });

  it("creates the new user trigger for profile and student role creation", () => {
    expect(migration).toContain("create trigger on_auth_user_created");
    expect(migration).toContain("public.handle_new_user()");
    expect(migration).toContain("where role_name = 'student'");
  });

  it("keeps the role model to admins, approvers, and students", () => {
    expect(simplifiedRolesMigration).toContain("'student'");
    expect(simplifiedRolesMigration).toContain("'approver'");
    expect(simplifiedRolesMigration).toContain("'admin'");
    expect(simplifiedRolesMigration).toContain("where role_name = 'student'");
    expect(simplifiedRolesMigration).toContain("array['admin', 'approver']");
  });

  it("provides a manual admin seed by email and role", () => {
    expect(adminSeed).toContain("with admin_seed(email, role_name) as");
    expect(adminSeed).toContain("join auth.users auth_users");
    expect(adminSeed).toContain("on conflict (user_id, role_id) do nothing");
  });

  it("adds access request and notification RLS policies", () => {
    expect(accessRequestsMigration).toContain("create table if not exists public.access_requests");
    expect(accessRequestsMigration).toContain("create table if not exists public.notifications");
    expect(accessRequestsMigration).toContain("alter table public.access_requests enable row level security");
    expect(accessRequestsMigration).toContain("alter table public.notifications enable row level security");
    expect(accessRequestsMigration).toContain("public.current_user_has_any_role(array['admin', 'approver'])");
  });

  it("adds resource tables, RLS, and storage buckets", () => {
    expect(resourcesMigration).toContain("create table if not exists public.resources");
    expect(resourcesMigration).toContain("create table if not exists public.resource_tags");
    expect(resourcesMigration).toContain("alter table public.resources enable row level security");
    expect(resourcesMigration).toContain("'public-resources'");
    expect(resourcesMigration).toContain("'protected-resources'");
    expect(resourcesMigration).toContain("public.current_user_has_role('admin')");
  });

  it("adds Moodle enrollment tables, RLS, and a required course seed", () => {
    expect(moodleMigration).toContain("create table if not exists public.moodle_courses");
    expect(moodleMigration).toContain("create table if not exists public.moodle_enrollments");
    expect(moodleMigration).toContain("create table if not exists public.integration_jobs");
    expect(moodleMigration).toContain("alter table public.moodle_courses enable row level security");
    expect(moodleMigration).toContain("alter table public.moodle_enrollments enable row level security");
    expect(moodleMigration).toContain("alter table public.integration_jobs enable row level security");
    expect(moodleMigration).toContain("public.current_user_has_any_role(array['admin', 'approver'])");
    expect(moodleMigration).toContain("'CMMC Level 1 Foundations'");
  });

  it("adds lab waitlist tables, RLS, and derived Moodle eligibility", () => {
    expect(labWaitlistMigration).toContain("create table if not exists public.lab_tracks");
    expect(labWaitlistMigration).toContain("create table if not exists public.lab_requests");
    expect(labWaitlistMigration).toContain("create table if not exists public.lab_queue_entries");
    expect(labWaitlistMigration).toContain("public.user_completed_required_moodle_training");
    expect(labWaitlistMigration).toContain("alter table public.lab_tracks enable row level security");
    expect(labWaitlistMigration).toContain("alter table public.lab_requests enable row level security");
    expect(labWaitlistMigration).toContain("alter table public.lab_queue_entries enable row level security");
    expect(labWaitlistMigration).toContain("public.current_user_has_any_role(array['admin', 'approver'])");
    expect(labWaitlistMigration).toContain("'CMMC Level 1 Hands-on Lab'");
    expect(labWaitlistMigration).toContain("20");
  });

  it("adds lab capacity tables, RLS, and default 20 student limits", () => {
    expect(labCapacityMigration).toContain("create table if not exists public.lab_instances");
    expect(labCapacityMigration).toContain("create table if not exists public.lab_assignments");
    expect(labCapacityMigration).toContain("create table if not exists public.lab_capacity_settings");
    expect(labCapacityMigration).toContain("alter table public.lab_instances enable row level security");
    expect(labCapacityMigration).toContain("alter table public.lab_assignments enable row level security");
    expect(labCapacityMigration).toContain("alter table public.lab_capacity_settings enable row level security");
    expect(labCapacityMigration).toContain("select null, 20, 3, 48, 24, 7, 3, true");
    expect(labCapacityMigration).toContain("generate_series(1, 20)");
    expect(labCapacityMigration).toContain("public.current_user_has_any_role(array['admin', 'approver'])");
  });
});
