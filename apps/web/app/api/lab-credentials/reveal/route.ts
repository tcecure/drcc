import { recordAuditEvent } from "@/lib/audit/audit-log";
import { canRevealLabCredential } from "@/lib/labs/access";
import { decryptLabPassword } from "@/lib/labs/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("student_cohort_assignments")
    .select("*")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (assignmentError || !assignment) {
    return Response.json({ error: "Lab assignment not found" }, { status: 404 });
  }

  if (!canRevealLabCredential(assignment)) {
    return Response.json(
      { error: "Lab credentials are not available in this access window" },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: credential, error: credentialError } = await admin
    .from("lab_credentials")
    .select("*")
    .eq("cohort_assignment_id", assignment.id)
    .eq("credential_version", assignment.credential_version)
    .is("revoked_at", null)
    .maybeSingle();

  if (credentialError || !credential) {
    return Response.json({ error: "Credential is not ready" }, { status: 409 });
  }

  let password: string;

  try {
    password = decryptLabPassword({
      encryptedPassword: credential.encrypted_password,
      initializationVector: credential.initialization_vector,
      authTag: credential.auth_tag,
    });
  } catch {
    return Response.json({ error: "Credential could not be decrypted" }, { status: 500 });
  }

  const revealedAt = new Date().toISOString();
  await admin
    .from("lab_credentials")
    .update({
      last_revealed_at: revealedAt,
      reveal_count: credential.reveal_count + 1,
    })
    .eq("id", credential.id);

  await recordAuditEvent({
    actorId: authData.user.id,
    action: "lab_credential_revealed",
    entityType: "student_cohort_assignments",
    entityId: assignment.id,
    newValue: {
      credential_version: assignment.credential_version,
      revealed_at: revealedAt,
    },
  });

  return Response.json(
    {
      username: assignment.lab_username,
      password,
      domain: "acs-p01.local",
      podName: assignment.pod_name,
    },
    {
      headers: {
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
      },
    },
  );
}
