import Link from "next/link";
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  HelpCircle,
  Import,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Server,
  Settings,
  ShieldCheck,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { roleManagerRoles, type PortalRole } from "@/lib/permissions/roles";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const studentItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/labs/guides", label: "Lab guides", icon: BookOpen },
  { href: "/dashboard/labs", label: "Labs", icon: Server },
  { href: "/dashboard/labs/queue", label: "Queue status", icon: ListChecks },
  { href: "/dashboard/training", label: "Training", icon: GraduationCap },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
];

const operationsItems: NavItem[] = [
  { href: "/dashboard/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/students/queue", label: "Student queue", icon: Users },
  { href: "/admin/students/import", label: "Import students", icon: Import },
  { href: "/admin/email-jobs", label: "Email jobs", icon: Mail },
  { href: "/admin/labs", label: "Lab capacity", icon: Gauge },
];

const adminItems: NavItem[] = [
  { href: "/admin", label: "Admin overview", icon: ShieldCheck },
  { href: "/admin/moodle", label: "Moodle", icon: GraduationCap },
  { href: "/admin/lab-queue", label: "Lab requests", icon: ListChecks },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/provisioning", label: "Provisioning", icon: Server },
  { href: "/admin/support", label: "Support desk", icon: HelpCircle },
  { href: "/admin/integrations", label: "Settings", icon: Settings },
];

export function DashboardNav({ roles }: { roles: PortalRole[] }) {
  const canManage = roleManagerRoles.some((role) => roles.includes(role));
  const isAdmin = roles.includes("admin");

  return (
    <nav
      aria-label="Dashboard navigation"
      className="dashboard-sidebar"
      data-dashboard-nav
    >
      <div className="dashboard-sidebar__panel">
        <div className="space-y-1 border-b border-sidebar-border/80 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55">
            DigitalRCC
          </p>
          <p className="text-lg font-semibold text-sidebar-foreground">
            Lab Companion
          </p>
          <p className="text-xs leading-5 text-sidebar-foreground/65">
            Role-aware lab operations workspace.
          </p>
        </div>

        <div className="dashboard-sidebar__scroll">
          <NavSection items={studentItems} title="Student" />
          {canManage ? (
            <NavSection items={operationsItems} title="Operations" />
          ) : null}
          {isAdmin ? <NavSection items={adminItems} title="Admin" /> : null}
        </div>

        <form
          action={logoutAction}
          className="border-t border-sidebar-border/80 pt-4"
        >
          <button
            className="dashboard-sidebar__link w-full text-sidebar-foreground/75 hover:text-sidebar-foreground"
            type="submit"
          >
            <LogOut className="size-4" />
            <span>Log out</span>
          </button>
        </form>
      </div>
    </nav>
  );
}

function NavSection({ items, title }: { items: NavItem[]; title: string }) {
  return (
    <section className="grid gap-2">
      <h2 className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
        {title}
      </h2>
      <div className="grid gap-1">
        {items.map((item) => (
          <Link
            className="dashboard-sidebar__link"
            href={item.href}
            key={item.href}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
