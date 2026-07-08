export type QueueStatus =
  | "waiting"
  | "readiness_requested"
  | "ready"
  | "reservation_offered"
  | "reserved"
  | "provisioning"
  | "active"
  | "paused"
  | "removed"
  | "completed";

export type QueueEntry = {
  id: string;
  priority_group: number;
  queue_status: QueueStatus;
  eligibility_date: string;
  request_date: string;
  manual_priority: number;
};

export const activeQueueStatuses: QueueStatus[] = [
  "waiting",
  "readiness_requested",
  "ready",
  "reservation_offered",
];

export function formatLabValue(value: string) {
  return value.replaceAll("_", " ");
}

export function sortQueueEntries(entries: QueueEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.priority_group !== right.priority_group) {
      return left.priority_group - right.priority_group;
    }

    if (left.manual_priority !== right.manual_priority) {
      return right.manual_priority - left.manual_priority;
    }

    const eligibilityDelta =
      new Date(left.eligibility_date).getTime() - new Date(right.eligibility_date).getTime();

    if (eligibilityDelta !== 0) {
      return eligibilityDelta;
    }

    return new Date(left.request_date).getTime() - new Date(right.request_date).getTime();
  });
}

export function getQueuePosition(entries: QueueEntry[], queueEntryId: string) {
  const activeEntries = sortQueueEntries(
    entries.filter((entry) => activeQueueStatuses.includes(entry.queue_status)),
  );
  const index = activeEntries.findIndex((entry) => entry.id === queueEntryId);

  return index === -1 ? null : index + 1;
}
