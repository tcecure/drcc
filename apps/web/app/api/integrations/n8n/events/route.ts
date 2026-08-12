import { z } from "zod";

import { hasValidBearerToken } from "@/lib/integrations/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/validation/env";

const acknowledgementSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["delivered", "retry"]),
  error: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const env = readServerEnv();

  if (!hasValidBearerToken(request, env.N8N_INTEGRATION_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .catch(25)
    .parse(url.searchParams.get("limit"));
  const supabase = createAdminClient();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const staleClaimedAt = new Date(nowDate.getTime() - 15 * 60 * 1000).toISOString();
  await supabase
    .from("integration_events")
    .update({ status: "pending", claimed_at: null, available_at: now })
    .eq("status", "processing")
    .lte("claimed_at", staleClaimedAt);

  const { data: events, error } = await supabase
    .from("integration_events")
    .select("*")
    .eq("status", "pending")
    .lte("available_at", now)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return Response.json({ error: "Unable to read integration events" }, { status: 500 });
  }

  const claimed = [];

  for (const event of events ?? []) {
    const { data: updated } = await supabase
      .from("integration_events")
      .update({
        status: "processing",
        claimed_at: now,
        attempts: event.attempts + 1,
      })
      .eq("id", event.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (updated) {
      claimed.push(updated);
    }
  }

  return Response.json(
    { events: claimed },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const env = readServerEnv();

  if (!hasValidBearerToken(request, env.N8N_INTEGRATION_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = acknowledgementSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return Response.json({ error: "Invalid acknowledgement" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const delivered = parsed.data.status === "delivered";
  const retryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { data: event, error } = await supabase
    .from("integration_events")
    .update({
      status: delivered ? "delivered" : "pending",
      delivered_at: delivered ? new Date().toISOString() : null,
      claimed_at: null,
      available_at: delivered ? new Date().toISOString() : retryAt,
      last_error: parsed.data.error ?? null,
    })
    .eq("id", parsed.data.eventId)
    .eq("status", "processing")
    .select("id, status")
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Unable to update integration event" }, { status: 500 });
  }

  if (!event) {
    return Response.json({ error: "Processing event not found" }, { status: 404 });
  }

  return Response.json(event);
}
