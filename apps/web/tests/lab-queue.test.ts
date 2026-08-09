import { describe, expect, it } from "vitest";

import { getQueuePosition, sortQueueEntries, type QueueEntry } from "@/lib/labs/queue";

function entry(overrides: Partial<QueueEntry>): QueueEntry {
  return {
    id: "entry-1",
    priority_group: 100,
    queue_status: "waiting",
    eligibility_date: "2026-07-07T10:00:00.000Z",
    request_date: "2026-07-07T10:00:00.000Z",
    manual_priority: 0,
    ...overrides,
  };
}

describe("lab queue ordering", () => {
  it("sorts by priority group, manual priority, eligibility date, then request date", () => {
    const sorted = sortQueueEntries([
      entry({ id: "late", eligibility_date: "2026-07-07T12:00:00.000Z" }),
      entry({ id: "manual", manual_priority: 5, eligibility_date: "2026-07-07T12:00:00.000Z" }),
      entry({ id: "priority", priority_group: 10, eligibility_date: "2026-07-07T13:00:00.000Z" }),
      entry({ id: "early", eligibility_date: "2026-07-07T09:00:00.000Z" }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["priority", "manual", "early", "late"]);
  });

  it("excludes paused and removed entries from active queue position", () => {
    const entries = [
      entry({ id: "paused", queue_status: "paused", eligibility_date: "2026-07-07T08:00:00.000Z" }),
      entry({ id: "first", eligibility_date: "2026-07-07T09:00:00.000Z" }),
      entry({ id: "target", eligibility_date: "2026-07-07T10:00:00.000Z" }),
      entry({ id: "removed", queue_status: "removed", eligibility_date: "2026-07-07T07:00:00.000Z" }),
    ];

    expect(getQueuePosition(entries, "target")).toBe(2);
    expect(getQueuePosition(entries, "paused")).toBeNull();
  });
});
