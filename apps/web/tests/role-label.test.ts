import { describe, expect, it } from "vitest";

import { getPrimaryPortalRoleLabel } from "@/lib/permissions/role-label";

describe("portal role label", () => {
  it("shows the highest privileged assigned role", () => {
    expect(getPrimaryPortalRoleLabel(["student", "admin"])).toBe("Administrator");
    expect(getPrimaryPortalRoleLabel(["student", "approver"])).toBe("Approver");
    expect(getPrimaryPortalRoleLabel(["student"])).toBe("Student");
  });
});
