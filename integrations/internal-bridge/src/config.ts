import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  BRIDGE_ID: z.string().min(1),
  BRIDGE_SECRET: z.string().min(12),
  INTEGRATION_MODE: z.enum(["mock", "live"]).default("mock"),
  AWX_BASE_URL: z.string().url().optional(),
  AWX_TOKEN: z.string().optional(),
  AWX_VERIFY_TLS: z.enum(["true", "false"]).default("true"),
  AWX_TEMPLATE_CREATE_ACCOUNT: z.string().optional(),
  AWX_TEMPLATE_ASSIGN_POD: z.string().optional(),
  AWX_TEMPLATE_PROVISION_GUACAMOLE: z.string().optional(),
  AWX_TEMPLATE_PROVISION_VPN: z.string().optional(),
  AWX_TEMPLATE_SEED_LAB: z.string().optional(),
  AWX_TEMPLATE_VERIFY_LAB: z.string().optional(),
  AWX_TEMPLATE_DISABLE_ACCOUNT: z.string().optional(),
  AWX_TEMPLATE_RESET_LAB: z.string().optional(),
  AWX_TEMPLATE_RELEASE_POD: z.string().optional(),
});

export type BridgeConfig = z.infer<typeof envSchema>;

export function readConfig() {
  return envSchema.parse(process.env);
}
