import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { getLabAccessState } from "@/lib/labs/access";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: assignment, error } = await supabase
    .from("student_cohort_assignments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !assignment) {
    return NextResponse.json({ error: "No lab assignment was found." }, { status: 404 });
  }

  const accessState = getLabAccessState(assignment);

  if (accessState !== "active" && accessState !== "expiring") {
    return NextResponse.json(
      { error: "Guacamole access is not available outside your lab window." },
      { status: 403 },
    );
  }

  const guacamoleUrl =
    process.env.NEXT_PUBLIC_GUACAMOLE_URL ?? "https://crc.guac.01.tcecure.com";

  await recordAuditEvent({
    actorId: user.id,
    action: "lab_access_launched",
    entityType: "student_cohort_assignment",
    entityId: assignment.id,
    sourceIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  const response = NextResponse.redirect(guacamoleUrl, 302);
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}
