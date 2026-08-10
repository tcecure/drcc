import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HardDrive,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  MonitorCheck,
  Network,
  RadioTower,
  ShieldCheck,
  Users,
} from "lucide-react";

export const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://my.digitalrcc.com";

export const publicNavItems = [
  { href: "/training", label: "Training Labs" },
  { href: "/cyber-range", label: "Lab Access" },
  { href: "/resources", label: "Guides" },
  { href: "/faq", label: "FAQ" },
];

export const programAreas = [
  {
    title: "Request Access",
    description:
      "Students request lab companion access, verify their account, and enter the hands-on queue.",
    href: "/request-access",
    icon: ShieldCheck,
  },
  {
    title: "Queue Placement",
    description:
      "Approved students are placed into the active lab queue while the 20-seat range is managed.",
    href: "/dashboard/labs/queue",
    icon: RadioTower,
  },
  {
    title: "14-Day Lab Window",
    description:
      "Students receive a 14-day completion window once their assigned lab slot starts.",
    href: "/dashboard/labs/current",
    icon: BriefcaseBusiness,
  },
  {
    title: "Digital Lab Guides",
    description:
      "Every student can access the digital lab guide library for Student01 through Student20.",
    href: "/dashboard/labs/guides",
    icon: BookOpen,
  },
];

export const cmmcPractices = [
  { title: "Access Control", icon: LockKeyhole },
  { title: "Identification and Authentication", icon: KeyRound },
  { title: "Media Protection", icon: HardDrive },
  { title: "Physical Protection", icon: Building2 },
  { title: "System and Communications Protection", icon: Network },
  { title: "System and Information Integrity", icon: MonitorCheck },
];

export const cyberRangeCapabilities = [
  "Windows workstations",
  "Active Directory",
  "Linux servers",
  "Security monitoring",
  "Endpoint protection",
  "Firewall configuration",
  "Vulnerability assessment",
  "CMMC evidence collection",
  "Hardening exercises",
  "Incident response",
];

export const resourcePreviews = [
  {
    title: "Lab guides",
    description: "Step-by-step exercises for technical practice and range readiness.",
    icon: ClipboardCheck,
  },
  {
    title: "Course instructions",
    description: "Program expectations, training steps, and completion guidance.",
    icon: GraduationCap,
  },
  {
    title: "Troubleshooting documents",
    description: "Common fixes for access, lab, and training workflow issues.",
    icon: LifeBuoy,
  },
  {
    title: "CMMC references",
    description: "Plain-language references for Level 1 practices and evidence.",
    icon: ShieldCheck,
  },
  {
    title: "Policy templates",
    description: "Starter templates that help organizations document safeguards.",
    icon: FileText,
  },
  {
    title: "Career resources",
    description: "Certification guidance, next steps, and workforce pathways.",
    icon: Users,
  },
];

export const faqs = [
  {
    question: "Who can use the DigitalRCC Lab Companion?",
    answer:
      "The lab companion is for students who need guided access to DigitalRCC training labs, queue status, progress tracking, and digital lab guides.",
  },
  {
    question: "How does lab access work?",
    answer:
      "Students request access, an approver reviews the request, and approved students are placed into the queue until a Student01 through Student20 lab seat is available.",
  },
  {
    question: "How long do students have lab access?",
    answer:
      "Each active hands-on lab assignment is designed around a 14-day completion window unless an approver grants an exception.",
  },
  {
    question: "Can students read the lab guides before they receive a lab seat?",
    answer:
      "Yes. The lab companion includes digital lab guides that any signed-in student can use while waiting for hands-on access.",
  },
  {
    question: "Why are there only 20 lab seats?",
    answer:
      "The hands-on Proxmox environment is built for 20 concurrent student seats, so access is queued to keep each active lab stable and supportable.",
  },
];
