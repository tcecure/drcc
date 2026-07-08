import { describe, expect, it } from "vitest";

import { envSchema } from "@/lib/validation/env";

describe("envSchema", () => {
  it("accepts the required DigitalRCC environment variables", () => {
    const parsed = envSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_DELIVERY_MODE: "mock",
    });

    expect(parsed.success).toBe(true);
  });
});
