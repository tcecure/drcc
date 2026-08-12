export const labFamilyOrder = ["AC", "IA", "SI", "SC", "MP", "PE"] as const;

export type LabFamilyCode = (typeof labFamilyOrder)[number];

export type LabGuide = {
  id: string;
  verifierLabId: string;
  family: LabFamilyCode;
  module: string;
  title: string;
  objective: string;
};

export type LabFamilyGuide = {
  code: LabFamilyCode;
  name: string;
  description: string;
  workspace: string;
  artifactPath: string;
  labs: LabGuide[];
};

type LabDefinition = [
  verifierLabId: string,
  module: string,
  title: string,
  objective: string,
];

function buildLabs(
  family: LabFamilyCode,
  definitions: LabDefinition[],
): LabGuide[] {
  return definitions.map(([verifierLabId, module, title, objective]) => {
    const acMatch = /^L(\d)\.(\d)$/.exec(verifierLabId);
    const canonicalLabId = acMatch
      ? `M${acMatch[1]}-L${acMatch[2]}`
      : verifierLabId;

    return {
      id: `${family}-${canonicalLabId}`,
      verifierLabId,
      family,
      module,
      title,
      objective,
    };
  });
}

export const labFamilyGuides: LabFamilyGuide[] = [
  {
    code: "AC",
    name: "Access Control",
    description:
      "Correct account lifecycle, group membership, delegation, and audit evidence problems in your isolated Active Directory OU.",
    workspace: "PODNN-DC in Guacamole",
    artifactPath: "C:\\CyberLab\\PodNN\\",
    labs: buildLabs("AC", [
      ["L1.1", "Module 1 · Account Management", "Terminated employee still has active access", "Disable the terminated account and preserve evidence that access was removed."],
      ["L1.2", "Module 1 · Account Management", "HR user has unauthorized Finance access", "Remove access that is not required for the user's assigned role."],
      ["L1.3", "Module 1 · Account Management", "Helpdesk technician has IT-Admins privileges", "Remove excessive administrative privilege while retaining appropriate helpdesk access."],
      ["L2.1", "Module 2 · Joiners, Movers, and Leavers", "New hire account not created", "Create the joiner account in the correct OU with the approved access."],
      ["L2.2", "Module 2 · Joiners, Movers, and Leavers", "Role change without access update", "Update the mover's OU and group access to match the new role."],
      ["L2.3", "Module 2 · Joiners, Movers, and Leavers", "Departed employee not properly offboarded", "Complete the leaver workflow by disabling access and removing memberships."],
      ["L3.1", "Module 3 · Least Privilege", "User in the wrong organizational unit", "Move the user into the correct pod-scoped organizational unit."],
      ["L3.2", "Module 3 · Least Privilege", "Over-permissioned group nesting", "Remove the nested membership that grants unintended privileged access."],
      ["L3.3", "Module 3 · Least Privilege", "Delegation of password reset authority", "Delegate only the required password-reset permission to the approved group."],
      ["L4.1", "Module 4 · Audit and Accountability", "Contractor account without expiration", "Set the approved account expiration and document the control."],
      ["L4.2", "Module 4 · Audit and Accountability", "Missing audit evidence", "Create the required evidence showing the access-control review."],
      ["L4.3", "Module 4 · Audit and Accountability", "Incomplete audit evidence", "Complete the required evidence fields so the action is attributable and reviewable."],
    ]),
  },
  {
    code: "IA",
    name: "Identification & Authentication",
    description:
      "Replace shared or generic identities, correct authentication controls, and document service, device, and password-management decisions.",
    workspace: "PODNN-DC in Guacamole",
    artifactPath: "C:\\CyberLab\\PodNN\\IA-Artifacts\\",
    labs: buildLabs("IA", [
      ["M1-L1", "Module 1 · User Identification", "Shared reception account", "Disable the shared account and create attributable individual identities."],
      ["M1-L2", "Module 1 · User Identification", "Zombie account", "Disable the departed user's account, remove access, and place it in the terminated-user OU."],
      ["M1-L3", "Module 1 · User Identification", "Generic accounts", "Remove or disable generic accounts and create an authorized-user inventory."],
      ["M2-L1", "Module 2 · Non-Person Entity IDs", "Scheduled task runs as a human", "Create a dedicated service identity and assign the scheduled task to it."],
      ["M2-L2", "Module 2 · Non-Person Entity IDs", "Rogue device artifact", "Identify the unauthorized device and document its configuration status."],
      ["M2-L3", "Module 2 · Non-Person Entity IDs", "Service account matrix", "Document each service account's owner and purpose."],
      ["M3-L1", "Module 3 · Authentication Management", "Password policy report", "Export the password policy and create the required evidence."],
      ["M3-L2", "Module 3 · Authentication Management", "Weak password policy", "Apply the required length, complexity, and lockout settings."],
      ["M3-L3", "Module 3 · Authentication Management", "Must change password", "Reset the affected password, require a change at next sign-in, and document the incident."],
      ["M4-L1", "Module 4 · Defaults and Process Authentication", "Default credentials", "Update the hardening standard to prohibit unchanged default credentials."],
      ["M4-L2", "Module 4 · Defaults and Process Authentication", "SNMP public string", "Document the insecure SNMP configuration and required remediation."],
      ["M4-L3", "Module 4 · Defaults and Process Authentication", "Script contains password123", "Remove the hard-coded password and replace it with an approved vault reference."],
    ]),
  },
  {
    code: "SI",
    name: "System & Information Integrity",
    description:
      "Analyze flaws, verify remediation, review malware protection, and investigate disabled or bypassed security controls.",
    workspace: "PODNN-DC in Guacamole",
    artifactPath: "C:\\CyberLab\\PodNN\\SI-Artifacts\\",
    labs: buildLabs("SI", [
      ["M1-L1", "Module 1 · Flaw Remediation Foundations", "Understanding system flaws", "Classify the supplied flaws and document their security impact."],
      ["M1-L2", "Module 1 · Flaw Remediation Foundations", "Active vs passive flaw identification", "Distinguish active and passive discovery methods using the provided evidence."],
      ["M1-L3", "Module 1 · Flaw Remediation Foundations", "Window of exposure calculation", "Calculate and document the period between discovery and remediation."],
      ["M2-L1", "Module 2 · Vulnerability Assessment", "Read a vulnerability scan report", "Prioritize the relevant findings and record the required remediation decisions."],
      ["M2-L2", "Module 2 · Vulnerability Assessment", "Patch verification", "Verify the required patch state and preserve evidence of the result."],
      ["M2-L3", "Module 2 · Vulnerability Assessment", "Remediation reporting", "Complete the remediation report with owners, status, evidence, and dates."],
      ["M3-L1", "Module 3 · Malware Protection", "Verify antivirus installation and coverage", "Confirm malware protection is installed and covers the required systems."],
      ["M3-L2", "Module 3 · Malware Protection", "Review malware scan logs", "Review scan results and document the correct response to detected activity."],
      ["M3-L3", "Module 3 · Malware Protection", "Antivirus definition currency check", "Confirm definitions are current and record the validation evidence."],
      ["M4-L1", "Module 4 · Enforcement and Investigation", "Defender GPO review", "Review and correct the policy that enforces Microsoft Defender settings."],
      ["M4-L2", "Module 4 · Enforcement and Investigation", "Disabled protection detection", "Use event evidence to identify when protection was disabled and document the event."],
      ["M4-L3", "Module 4 · Enforcement and Investigation", "Rogue developer investigation", "Correlate the supplied artifacts and complete the investigation report."],
    ]),
  },
  {
    code: "SC",
    name: "System & Communications Protection",
    description:
      "Work with trust boundaries, pfSense rules, segmentation, monitoring, and validation evidence for protected communications.",
    workspace: "PODNN-GW and PODNN-DC in Guacamole",
    artifactPath: "C:\\CyberLab\\PodNN\\SC-Artifacts\\",
    labs: buildLabs("SC", [
      ["M1-L1", "Module 1 · Digital Perimeter", "Understanding trust boundaries", "Identify the trust boundaries and document where controlled information crosses them."],
      ["M1-L2", "Module 1 · Digital Perimeter", "Deny by default firewall", "Apply a deny-by-default posture while preserving explicitly authorized traffic."],
      ["M1-L3", "Module 1 · Digital Perimeter", "Monitor, control, protect", "Document how the selected controls monitor, control, and protect communications."],
      ["M2-L1", "Module 2 · Boundaries", "Draw the organizational boundary", "Produce an accurate boundary diagram using the supplied environment details."],
      ["M2-L2", "Module 2 · Boundaries", "Secure the DMZ", "Correct the DMZ rules so only required services are reachable."],
      ["M2-L3", "Module 2 · Boundaries", "Internal segmentation with VLANs", "Document and validate the required internal segmentation."],
      ["M3-L1", "Module 3 · Firewall Rules", "Firewall rule audit", "Review the rule set and identify overly broad, obsolete, or undocumented rules."],
      ["M3-L2", "Module 3 · Firewall Rules", "Rule ordering challenge", "Reorder the rules so specific authorized traffic is evaluated correctly."],
      ["M3-L3", "Module 3 · Firewall Rules", "Least privilege access", "Reduce allowed sources, destinations, ports, and protocols to the approved minimum."],
      ["M4-L1", "Module 4 · Monitoring and Validation", "Firewall log investigation", "Use firewall logs to identify the relevant event and document the finding."],
      ["M4-L2", "Module 4 · Monitoring and Validation", "Verify SC compliance", "Validate the required SC controls and record the evidence."],
      ["M4-L3", "Module 4 · Monitoring and Validation", "Final capstone", "Complete the integrated boundary, firewall, and evidence review."],
    ]),
  },
  {
    code: "MP",
    name: "Media Protection",
    description:
      "Classify media, perform verifiable sanitization, and document secure disposition decisions.",
    workspace: "PODNN-DC in Guacamole",
    artifactPath: "C:\\CyberLab\\PodNN\\MP-Artifacts\\",
    labs: buildLabs("MP", [
      ["M1-L1", "Module 1 · Media Lifecycle", "Classify FCI and non-FCI media", "Classify both supplied virtual media devices and support each decision with evidence."],
      ["M1-L2", "Module 1 · Media Lifecycle", "Sanitize media for approved reuse", "Recreate and format the FCI volume, validate it is empty, and complete the sanitization records."],
      ["M1-L3", "Module 1 · Media Lifecycle", "Dispose of media securely", "Select destruction, reconcile the custody and asset records, and document the rationale."],
    ]),
  },
  {
    code: "PE",
    name: "Physical Protection",
    description:
      "Review authorized physical access, visitor escort and badge controls, monitoring records, and physical security incidents.",
    workspace: "PODNN-DC in Guacamole",
    artifactPath: "C:\\CyberLab\\PodNN\\PE-Artifacts\\",
    labs: buildLabs("PE", [
      ["M1-L1", "Module 1 · Authorized Access", "Review physical access authorization", "Identify the terminated employee and unauthorized contractor in the access review."],
      ["M1-L2", "Module 1 · Authorized Access", "Reconcile server-room access events", "Compare badge, room, and employee records and document each access decision."],
      ["M2-L1", "Module 2 · Visitors", "Identify an unescorted visitor", "Use the visitor, ticket, camera, and policy evidence to identify the escort violation."],
      ["M2-L2", "Module 2 · Visitors", "Complete temporary badge workflow", "Document issuance, escort, sign-in, sign-out, and return of the temporary badge."],
      ["M3-L1", "Module 3 · Monitoring and Incidents", "Reconcile physical access records", "Reconcile badge, visitor, and alarm records and document both discrepancies."],
      ["M3-L2", "Module 3 · Monitoring and Incidents", "Respond to a lost badge", "Disable the lost badge, issue a replacement, and document post-loss access activity."],
    ]),
  },
];

export const labGuides = labFamilyGuides.flatMap((family) => family.labs);

export const totalLabCount = labGuides.length;

export const startHereSteps = [
  "Confirm the access window and assigned lab identity shown in your command center.",
  "Reveal the lab credential only after your access window opens at Sunday 12:00 AM Eastern.",
  "Open the current lab guide, then launch Guacamole in a separate tab.",
  "Sign in to Guacamole with the assigned studentNN identity and open the listed PODNN connection.",
  "Complete labs in order. AWX verifies the environment automatically and the portal mirrors the latest result.",
  "Use the incomplete reason as a checklist, correct the environment, and wait for the next verification cycle.",
];

export const labGuideSafetyNotes = [
  "Use only the PodNN and studentNN identity assigned to your access window.",
  "Never place customer information, real credentials, or sensitive production data in the lab.",
  "Do not email, share, or store screenshots containing lab credentials.",
  "Ask for technical support when access or infrastructure blocks you; support will not provide lab answers.",
];

export function getLabFamilyGuide(code: string) {
  return labFamilyGuides.find((family) => family.code === code.toUpperCase());
}

export function getLabGuide(id: string) {
  return labGuides.find((lab) => lab.id.toLowerCase() === id.toLowerCase());
}

export function getCurrentLabGuide(
  progress: Array<{ family: string; lab_id: string; completed: boolean }>,
) {
  const completed = new Set(
    progress
      .filter((result) => result.completed)
      .map((result) => `${result.family}:${result.lab_id}`),
  );

  return (
    labGuides.find((lab) => !completed.has(`${lab.family}:${lab.id}`)) ?? null
  );
}

export function normalizeVerifierLabId(
  family: LabFamilyCode,
  verifierLabId: string,
) {
  const normalized = verifierLabId.replace(new RegExp(`^${family}-`, "i"), "");
  const familyGuide = labFamilyGuides.find((guide) => guide.code === family);

  return familyGuide?.labs.find(
    (lab) => lab.verifierLabId.toLowerCase() === normalized.toLowerCase(),
  )?.id;
}
