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
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const publicNavItems = [
  { href: "/about", label: "About" },
  { href: "/training", label: "Training" },
  { href: "/cyber-range", label: "Cyber Range" },
  { href: "/customer-delivery", label: "Customer Delivery" },
  { href: "/resources", label: "Resources" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export const programAreas = [
  {
    title: "CMMC Level 1 Training",
    description:
      "Learn foundational cybersecurity practices that help organizations protect Federal Contract Information and prepare for readiness conversations.",
    href: "/training",
    icon: ShieldCheck,
  },
  {
    title: "Cyber Range",
    description:
      "Practice in guided technical labs with workstations, servers, monitoring, endpoint protection, and incident response exercises.",
    href: "/cyber-range",
    icon: RadioTower,
  },
  {
    title: "Customer Delivery Zone",
    description:
      "Support approved customer assessments, secure collaboration, reporting, and readiness work in an isolated environment.",
    href: "/customer-delivery",
    icon: BriefcaseBusiness,
  },
  {
    title: "Student Resources",
    description:
      "Access lab guides, course instructions, troubleshooting materials, templates, references, and career support.",
    href: "/resources",
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
    question: "Who can use DigitalRCC?",
    answer:
      "DigitalRCC is designed for students, professionals, small businesses, and community organizations that need accessible cybersecurity education or guided security support.",
  },
  {
    question: "Is the Cyber Range part of normal student access?",
    answer:
      "No. Cyber Range access is approved separately so lab readiness, safety, capacity, and supervision can be managed responsibly.",
  },
  {
    question: "What is the Customer Delivery Zone?",
    answer:
      "It is an isolated environment for approved customer assessments, vulnerability reviews, secure collaboration, reporting, and readiness work. It is not part of normal student access.",
  },
  {
    question: "Can I request access before full registration launches?",
    answer:
      "Yes. The current request-access page is an informational pre-registration form. Full account registration is planned for the next sprint.",
  },
  {
    question: "Does DigitalRCC provide CMMC certification?",
    answer:
      "DigitalRCC provides education, readiness support, and practical guidance. Certification and formal assessment decisions remain with authorized assessment paths.",
  },
];
