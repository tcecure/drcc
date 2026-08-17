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
import type { ReactNode } from "react";

import { logoutAction } from "@/lib/auth/actions";
import { roleManagerRoles, type PortalRole } from "@/lib/permissions/roles";

type VisionNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const studentNav: VisionNavItem[] = [
  { href: "/dashboard-v2", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/labs/guides", label: "Lab Guides", icon: BookOpen },
  { href: "/dashboard/labs", label: "Labs", icon: Server },
  { href: "/dashboard/labs/queue", label: "Queue Status", icon: ListChecks },
  { href: "/dashboard/training", label: "Training", icon: GraduationCap },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
];

const operationsNav: VisionNavItem[] = [
  { href: "/admin-v2", label: "Admin Overview", icon: ShieldCheck },
  { href: "/dashboard/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/students/queue", label: "Student Queue", icon: Users },
  { href: "/admin/students/import", label: "Import Students", icon: Import },
  { href: "/admin/email-jobs", label: "Email Jobs", icon: Mail },
  { href: "/admin/labs", label: "Lab Capacity", icon: Gauge },
];

export function VisionShell({
  children,
  eyebrow,
  roles,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  roles: PortalRole[];
  title: string;
}) {
  const canManage = roleManagerRoles.some((role) => roles.includes(role));
  const navItems = canManage ? [...studentNav, ...operationsNav] : studentNav;

  return (
    <main className="vision-shell">
      <aside
        className="vision-sidebar"
        aria-label="Vision dashboard navigation"
      >
        <div className="vision-brand">
          <span className="vision-brand__mark">DR</span>
          <div>
            <p className="text-sm font-semibold text-white">DigitalRCC</p>
            <p className="text-xs text-white/55">Lab Companion V2</p>
          </div>
        </div>
        <nav className="vision-sidebar__nav">
          {navItems.map((item) => (
            <Link
              className="vision-sidebar__link"
              href={item.href}
              key={item.href}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-auto">
          <button className="vision-sidebar__link w-full" type="submit">
            <LogOut className="size-4" />
            <span>Log out</span>
          </button>
        </form>
      </aside>
      <section className="vision-main">
        <header className="vision-topbar">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
          </div>
          <div className="vision-role-stack">
            {roles.map((role) => (
              <span className="vision-role-chip" key={role}>
                {role}
              </span>
            ))}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function VisionCard({
  children,
  className = "",
  eyebrow,
  title,
  value,
}: {
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  title: string;
  value?: string;
}) {
  return (
    <article className={`vision-card ${className}`}>
      {eyebrow ? <p className="vision-card__eyebrow">{eyebrow}</p> : null}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {value ? (
          <p className="text-3xl font-semibold text-white">{value}</p>
        ) : null}
      </div>
      {children ? (
        <div className="mt-4 text-sm leading-6 text-slate-300">{children}</div>
      ) : null}
    </article>
  );
}

export function VisionMetricCard({
  helper,
  label,
  tone = "blue",
  value,
}: {
  helper: string;
  label: string;
  tone?: "blue" | "cyan" | "violet" | "emerald";
  value: string;
}) {
  return (
    <VisionCard
      className={`vision-card--${tone}`}
      eyebrow="Live metric"
      title={label}
      value={value}
    >
      <p>{helper}</p>
    </VisionCard>
  );
}
