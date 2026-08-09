import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { readServerEnv } from "@/lib/validation/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const env = readServerEnv();

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
