import { z } from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_GUACAMOLE_URL: z.string().url().optional(),
  MOODLE_INTEGRATION_MODE: z.enum(["mock", "live"]).default("mock"),
  MOODLE_BASE_URL: z.string().url().optional(),
  MOODLE_API_TOKEN: z.string().optional(),
  MOODLE_WEB_SERVICE_NAME: z.string().optional(),
  MOODLE_WEBHOOK_SECRET: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SES_FROM_ADDRESS: z.string().email().optional(),
  SES_REPLY_TO_ADDRESS: z.string().email().optional(),
  EMAIL_DELIVERY_MODE: z.enum(["mock", "live"]).default("mock"),
  BRIDGE_ID: z.string().optional(),
  BRIDGE_SECRET: z.string().optional(),
  INTEGRATION_MODE: z.enum(["mock", "live"]).default("mock"),
  CRON_SECRET: z.string().optional(),
  AWX_PROGRESS_SECRET: z.string().min(16).optional(),
  N8N_INTEGRATION_SECRET: z.string().min(16).optional(),
  LAB_INTEGRATION_SECRET: z.string().min(16).optional(),
  LAB_CREDENTIAL_ENCRYPTION_KEY: z.string().optional(),
});

export const publicEnvSchema = envSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: true,
  SUPABASE_ANON_KEY: true,
  SUPABASE_PUBLISHABLE_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_GUACAMOLE_URL: true,
});

export type DigitalRccEnv = z.infer<typeof envSchema>;

function envValue(value: string | undefined) {
  return value?.trim() || undefined;
}

export function readPublicEnv() {
  const supabaseUrl =
    envValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    envValue(process.env.SUPABASE_URL);
  const supabasePublishableKey =
    envValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    envValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    envValue(process.env.SUPABASE_ANON_KEY) ??
    envValue(process.env.SUPABASE_PUBLISHABLE_KEY);

  const parsed = publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    SUPABASE_URL: envValue(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabasePublishableKey,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: envValue(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    SUPABASE_ANON_KEY: envValue(process.env.SUPABASE_ANON_KEY),
    SUPABASE_PUBLISHABLE_KEY: envValue(process.env.SUPABASE_PUBLISHABLE_KEY),
    NEXT_PUBLIC_APP_URL: envValue(process.env.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_GUACAMOLE_URL: envValue(
      process.env.NEXT_PUBLIC_GUACAMOLE_URL,
    ),
  });

  return {
    NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: parsed.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GUACAMOLE_URL: parsed.NEXT_PUBLIC_GUACAMOLE_URL,
  };
}

export function readServerEnv() {
  const publicEnv = readPublicEnv();
  const supabaseSecretKey =
    envValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    envValue(process.env.SUPABASE_SECRET_KEY);

  return envSchema.parse({
    ...publicEnv,
    SUPABASE_URL: envValue(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: envValue(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    SUPABASE_ANON_KEY: envValue(process.env.SUPABASE_ANON_KEY),
    SUPABASE_PUBLISHABLE_KEY: envValue(process.env.SUPABASE_PUBLISHABLE_KEY),
    SUPABASE_SERVICE_ROLE_KEY: supabaseSecretKey,
    SUPABASE_SECRET_KEY: envValue(process.env.SUPABASE_SECRET_KEY),
    MOODLE_INTEGRATION_MODE: envValue(process.env.MOODLE_INTEGRATION_MODE),
    MOODLE_BASE_URL: envValue(process.env.MOODLE_BASE_URL),
    MOODLE_API_TOKEN: envValue(process.env.MOODLE_API_TOKEN),
    MOODLE_WEB_SERVICE_NAME: envValue(process.env.MOODLE_WEB_SERVICE_NAME),
    MOODLE_WEBHOOK_SECRET: envValue(process.env.MOODLE_WEBHOOK_SECRET),
    AWS_REGION: envValue(process.env.AWS_REGION),
    AWS_ACCESS_KEY_ID: envValue(process.env.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: envValue(process.env.AWS_SECRET_ACCESS_KEY),
    SES_FROM_ADDRESS: envValue(process.env.SES_FROM_ADDRESS),
    SES_REPLY_TO_ADDRESS: envValue(process.env.SES_REPLY_TO_ADDRESS),
    EMAIL_DELIVERY_MODE: envValue(process.env.EMAIL_DELIVERY_MODE),
    BRIDGE_ID: envValue(process.env.BRIDGE_ID),
    BRIDGE_SECRET: envValue(process.env.BRIDGE_SECRET),
    INTEGRATION_MODE: envValue(process.env.INTEGRATION_MODE),
    CRON_SECRET: envValue(process.env.CRON_SECRET),
    AWX_PROGRESS_SECRET: envValue(process.env.AWX_PROGRESS_SECRET),
    N8N_INTEGRATION_SECRET: envValue(process.env.N8N_INTEGRATION_SECRET),
    LAB_INTEGRATION_SECRET: envValue(process.env.LAB_INTEGRATION_SECRET),
    LAB_CREDENTIAL_ENCRYPTION_KEY: envValue(
      process.env.LAB_CREDENTIAL_ENCRYPTION_KEY,
    ),
  });
}
