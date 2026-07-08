import { describe, expect, it } from "vitest";

import { isAuthPath, isProtectedPath } from "@/lib/auth/protected-routes";

describe("protected route helpers", () => {
  it("identifies dashboard and admin routes as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/profile")).toBe(true);
    expect(isProtectedPath("/admin/users/123/roles")).toBe(true);
  });

  it("does not protect public routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/training")).toBe(false);
  });

  it("identifies auth routes", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/signup")).toBe(true);
    expect(isAuthPath("/auth/callback")).toBe(true);
  });
});
