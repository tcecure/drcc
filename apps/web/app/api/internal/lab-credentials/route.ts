import { z } from "zod";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { hasValidBearerToken } from "@/lib/integrations/auth";
import { encryptLabPassword } from "@/lib/labs/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/validation/env";

const credentialSchema = z.object({
  cohortAssignmentId: z.string().uuid(),
  credentialVersion: z.number().int().positive(),
  password: z.string().min(12).max(256),
});

export async function POST(request: Request) {
  const env = readServerEnv();

  if (!hasValidBearerToken(request, env.LAB_INTEGRATION_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = credentialSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Invalid credential payload" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: assignment, error: assignmentError } = await supabase
    .from("student_cohort_assignments")
    .select("id, user_id, pod_name, lab_username, credential_version")
    .eq("id", parsed.data.cohortAssignmentId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    return Response.json({ error: "Cohort assignment not found" }, { status: 404 });
  }

  if (parsed.data.credentialVersion <= assignment.credential_version) {
    return Response.json(
      { error: "Credential version must increase" },
      { status: 409 },
    );
  }

  const encrypted = encryptLabPassword(parsed.data.password);
  const readyAt = new Date().toISOString();
  const { error: credentialError } = await supabase.from("lab_credentials").upsert(
    {
      cohort_assignment_id: assignment.id,
      credential_version: parsed.data.credentialVersion,
      encrypted_password: encrypted.encryptedPassword,
      initialization_vector: encrypted.initializationVector,
      auth_tag: encrypted.authTag,
      ready_at: readyAt,
      revoked_at: null,
    },
    { onConflict: "cohort_assignment_id" },
  );

  if (credentialError) {
    return Response.json({ error: "Credential storage failed" }, { status: 500 });
  }

  const { error: assignmentUpdateError } = await supabase
    .from("student_cohort_assignments")
    .update({
      credential_status: "ready",
      credential_version: parsed.data.credentialVersion,
      credential_ready_at: readyAt,
    })
    .eq("id", assignment.id);

  if (assignmentUpdateError) {
    return Response.json({ error: "Assignment update failed" }, { status: 500 });
  }

  await supabase.from("integration_events").upsert(
    {
      event_type: "student.credentials_ready",
      aggregate_type: "student_cohort_assignment",
      aggregate_id: assignment.id,
      payload: {
        assignment_id: assignment.id,
        user_id: assignment.user_id,
        pod_name: assignment.pod_name,
        lab_username: assignment.lab_username,
        credential_version: parsed.data.credentialVersion,
        ready_at: readyAt,
      },
      idempotency_key: `student.credentials_ready:${assignment.id}:${parsed.data.credentialVersion}`,
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true },
  );

  await recordAuditEvent({
    actorId: null,
    action: "lab_credential_stored",
    entityType: "student_cohort_assignments",
    entityId: assignment.id,
    previousValue: { credential_version: assignment.credential_version },
    newValue: {
      credential_version: parsed.data.credentialVersion,
      credential_status: "ready",
    },
  });

  return Response.json({
    assignmentId: assignment.id,
    credentialVersion: parsed.data.credentialVersion,
    status: "ready",
  });
}
