import { afterEach, describe, expect, it, vi } from "vitest";

import { envSchema, readPublicEnv, readServerEnv } from "@/lib/validation/env";

describe("envSchema", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the required DigitalRCC environment variables", () => {
    const parsed = envSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_DELIVERY_MODE: "mock",
      INTEGRATION_MODE: "mock",
    });

    expect(parsed.success).toBe(true);
  });

  it("normalizes Supabase Vercel integration variable names", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("SUPABASE_SECRET_KEY", "secret-key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://my.digitalrcc.com");

    expect(readPublicEnv()).toMatchObject({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "publishable-key",
    });
    expect(readServerEnv()).toMatchObject({
      SUPABASE_SERVICE_ROLE_KEY: "secret-key",
    });
  });
});
