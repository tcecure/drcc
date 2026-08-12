export const labAccessTimeZone = "America/New_York";

export type LabAccessState =
  | "queued"
  | "upcoming"
  | "active"
  | "expiring"
  | "completed"
  | "cancelled";

type AccessWindow = {
  access_starts_at: string;
  access_ends_at: string;
  status: string;
  credential_status?: string;
  credential_ready_at?: string | null;
};

const upcomingWindowMs = 7 * 24 * 60 * 60 * 1000;
const expiringWindowMs = 48 * 60 * 60 * 1000;

export function getLabAccessState(
  assignment: AccessWindow,
  now = new Date(),
): LabAccessState {
  if (assignment.status === "cancelled") {
    return "cancelled";
  }

  if (assignment.status === "completed") {
    return "completed";
  }

  const startsAt = new Date(assignment.access_starts_at).getTime();
  const endsAt = new Date(assignment.access_ends_at).getTime();
  const current = now.getTime();

  if (current >= endsAt) {
    return "completed";
  }

  if (current < startsAt) {
    return startsAt - current <= upcomingWindowMs ? "upcoming" : "queued";
  }

  return endsAt - current <= expiringWindowMs ? "expiring" : "active";
}

export function isWithinLabAccessWindow(
  assignment: Pick<AccessWindow, "access_starts_at" | "access_ends_at">,
  now = new Date(),
) {
  const current = now.getTime();

  return (
    current >= new Date(assignment.access_starts_at).getTime() &&
    current < new Date(assignment.access_ends_at).getTime()
  );
}

export function canRevealLabCredential(
  assignment: AccessWindow,
  now = new Date(),
) {
  if (
    assignment.status === "cancelled" ||
    assignment.status === "completed" ||
    !isWithinLabAccessWindow(assignment, now)
  ) {
    return false;
  }

  if (assignment.credential_status !== "ready") {
    return false;
  }

  return assignment.credential_ready_at
    ? new Date(assignment.credential_ready_at).getTime() <= now.getTime()
    : false;
}

export function formatLabDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: labAccessTimeZone,
    timeZoneName: "short",
  }).format(new Date(value));
}

export function addLocalDays(localDate: string, days: number) {
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function zonedDateTimeToIso({
  localDate,
  hour = 0,
  minute = 0,
  timeZone = labAccessTimeZone,
}: {
  localDate: string;
  hour?: number;
  minute?: number;
  timeZone?: string;
}) {
  const [year, month, day] = localDate.split("-").map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = targetAsUtc;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const observedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const difference = targetAsUtc - observedAsUtc;

    if (difference === 0) {
      return new Date(candidate).toISOString();
    }

    candidate += difference;
  }

  throw new Error(`Unable to resolve ${localDate} in ${timeZone}.`);
}
