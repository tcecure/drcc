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
  { href: "/dashboard/labs/guides", label: "Guides", icon: BookOpen },
  { href: "/dashboard/labs", label: "Labs", icon: Server },
  { href: "/dashboard/labs/queue", label: "Queue", icon: ListChecks },
  { href: "/dashboard/training", label: "Training", icon: GraduationCap },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
];

const operationsItems: NavItem[] = [
  { href: "/dashboard/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin", label: "Admin Overview", icon: ShieldCheck },
  { href: "/admin/students/queue", label: "Student queue", icon: Users },
  { href: "/admin/students/import", label: "Import", icon: Import },
  { href: "/admin/email-jobs", label: "Email jobs", icon: Mail },
  { href: "/admin/labs", label: "Capacity", icon: Gauge },
];

export function DashboardNav({ roles }: { roles: PortalRole[] }) {
  const canManage = roleManagerRoles.some((role) => roles.includes(role));
  const items = canManage
    ? [...studentItems, ...operationsItems]
    : studentItems;

  return (
    <nav aria-label="Dashboard navigation" className="dashboard-nav">
      <div className="dashboard-nav__header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            DigitalRCC
          </p>
          <p className="font-semibold">Lab Companion</p>
        </div>
        <form action={logoutAction}>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            type="submit"
          >
            <LogOut className="size-4" />
            <span>Log out</span>
          </button>
        </form>
      </div>
      <div className="dashboard-nav__links">
        {items.map((item) => (
          <Link
            className="dashboard-nav__link"
            href={item.href}
            key={item.href}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
