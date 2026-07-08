import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AuditEvent = {
  actorId: string | null;
  action: "role_assigned" | "role_removed" | "account_status_changed" | string;
  entityType: string;
  entityId?: string | null;
  previousValue?: Json | null;
  newValue?: Json | null;
  sourceIp?: string | null;
};

export async function recordAuditEvent(event: AuditEvent) {
  const supabase = createAdminClient();

  await supabase.from("audit_events").insert({
    actor_id: event.actorId,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    previous_value: event.previousValue ?? null,
    new_value: event.newValue ?? null,
    source_ip: event.sourceIp ?? null,
  });
}
