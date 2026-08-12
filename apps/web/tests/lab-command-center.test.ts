import { describe, expect, it } from "vitest";

import {
  addLocalDays,
  canRevealLabCredential,
  getLabAccessState,
  isWithinLabAccessWindow,
  zonedDateTimeToIso,
} from "@/lib/labs/access";
import {
  getCurrentLabGuide,
  labFamilyGuides,
  labGuides,
  normalizeVerifierLabId,
  totalLabCount,
} from "@/lib/labs/guides";
import { getLabSeatIdentity } from "@/lib/labs/identity";

const assignment = {
  access_starts_at: "2026-08-16T04:00:00.000Z",
  access_ends_at: "2026-08-30T04:00:00.000Z",
  status: "notified",
  credential_status: "ready",
  credential_ready_at: "2026-08-15T18:00:00.000Z",
};

describe("lab access policy", () => {
  it("uses an inclusive start and exclusive end boundary", () => {
    expect(
      isWithinLabAccessWindow(assignment, new Date("2026-08-16T04:00:00.000Z")),
    ).toBe(true);
    expect(
      isWithinLabAccessWindow(assignment, new Date("2026-08-30T04:00:00.000Z")),
    ).toBe(false);
  });

  it("derives upcoming, active, expiring, and completed states", () => {
    expect(getLabAccessState(assignment, new Date("2026-08-10T04:00:00.000Z"))).toBe(
      "upcoming",
    );
    expect(getLabAccessState(assignment, new Date("2026-08-16T04:00:00.000Z"))).toBe(
      "active",
    );
    expect(getLabAccessState(assignment, new Date("2026-08-29T04:00:00.000Z"))).toBe(
      "expiring",
    );
    expect(getLabAccessState(assignment, new Date("2026-08-30T04:00:00.000Z"))).toBe(
      "completed",
    );
  });

  it("requires a ready credential inside a non-cancelled access window", () => {
    expect(
      canRevealLabCredential(assignment, new Date("2026-08-16T04:00:00.000Z")),
    ).toBe(true);
    expect(
      canRevealLabCredential(
        { ...assignment, status: "cancelled" },
        new Date("2026-08-16T04:00:00.000Z"),
      ),
    ).toBe(false);
    expect(
      canRevealLabCredential(
        { ...assignment, credential_status: "pending_rotation" },
        new Date("2026-08-16T04:00:00.000Z"),
      ),
    ).toBe(false);
  });
});

describe("Eastern cohort scheduling", () => {
  it("resolves Sunday midnight across daylight-saving changes", () => {
    expect(zonedDateTimeToIso({ localDate: "2026-08-16" })).toBe(
      "2026-08-16T04:00:00.000Z",
    );
    expect(zonedDateTimeToIso({ localDate: "2026-11-15" })).toBe(
      "2026-11-15T05:00:00.000Z",
    );
  });

  it("adds calendar days without changing the local date contract", () => {
    expect(addLocalDays("2026-10-25", 14)).toBe("2026-11-08");
  });
});

describe("CMMC Level 1 guide catalog", () => {
  it("contains 57 unique labs across the six required families", () => {
    expect(totalLabCount).toBe(57);
    expect(new Set(labGuides.map((lab) => lab.id)).size).toBe(57);
    expect(labFamilyGuides.map((family) => family.labs.length)).toEqual([
      12, 12, 12, 12, 3, 6,
    ]);
  });

  it("normalizes AWX verifier IDs to portal guide IDs", () => {
    expect(normalizeVerifierLabId("AC", "L1.1")).toBe("AC-M1-L1");
    expect(normalizeVerifierLabId("IA", "IA-M4-L3")).toBe("IA-M4-L3");
  });

  it("selects the first incomplete lab in family order", () => {
    expect(getCurrentLabGuide([])?.id).toBe("AC-M1-L1");
    expect(
      getCurrentLabGuide([
        { family: "AC", lab_id: "AC-M1-L1", completed: true },
      ])?.id,
    ).toBe("AC-M1-L2");
  });
});

describe("lab seat identity", () => {
  it("maps seat numbers to the live direct PodNN and studentNN model", () => {
    expect(getLabSeatIdentity(2)).toEqual({
      podName: "Pod02",
      labUsername: "student02",
    });
    expect(() => getLabSeatIdentity(21)).toThrow();
  });
});
