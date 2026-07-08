import { z } from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  MOODLE_INTEGRATION_MODE: z.enum(["mock", "live"]).default("mock"),
  MOODLE_BASE_URL: z.string().url().optional(),
  MOODLE_API_TOKEN: z.string().optional(),
  MOODLE_WEB_SERVICE_NAME: z.string().optional(),
  MOODLE_WEBHOOK_SECRET: z.string().optional(),
});

export const publicEnvSchema = envSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
});

export type DigitalRccEnv = z.infer<typeof envSchema>;

export function readPublicEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  const parsed = publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  return {
    NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: parsed.NEXT_PUBLIC_APP_URL,
  };
}

export function readServerEnv() {
  const publicEnv = readPublicEnv();

  return envSchema.parse({
    ...publicEnv,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    MOODLE_INTEGRATION_MODE: process.env.MOODLE_INTEGRATION_MODE,
    MOODLE_BASE_URL: process.env.MOODLE_BASE_URL,
    MOODLE_API_TOKEN: process.env.MOODLE_API_TOKEN,
    MOODLE_WEB_SERVICE_NAME: process.env.MOODLE_WEB_SERVICE_NAME,
    MOODLE_WEBHOOK_SECRET: process.env.MOODLE_WEBHOOK_SECRET,
  });
}
