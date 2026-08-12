import { z } from "zod";

import { hasValidBearerToken } from "@/lib/integrations/auth";
import {
  labFamilyOrder,
  normalizeVerifierLabId,
  totalLabCount,
} from "@/lib/labs/guides";
import { createAdminClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/validation/env";

const familySchema = z.enum(labFamilyOrder);
const progressPayloadSchema = z.object({
  family: familySchema,
  verifierJobId: z.number().int().positive(),
  verifiedAt: z.string().datetime(),
  pods: z.record(
    z.string(),
    z.record(
      z.string(),
      z.object({
        completed: z.boolean(),
        reason: z.string().min(1).max(2000),
      }),
    ),
  ),
});

export async function POST(request: Request) {
  const env = readServerEnv();

  if (!hasValidBearerToken(request, env.AWX_PROGRESS_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = progressPayloadSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Invalid AWX progress payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const supabase = createAdminClient();
  const recordsReceived = Object.values(payload.pods).reduce(
    (count, labs) => count + Object.keys(labs).length,
    0,
  );
  const { data: syncRun, error: syncRunError } = await supabase
    .from("lab_sync_runs")
    .insert({
      family: payload.family,
      verifier_job_id: payload.verifierJobId,
      status: "running",
      records_received: recordsReceived,
    })
    .select("id")
    .single();

  if (syncRunError || !syncRun) {
    return Response.json({ error: "Unable to start sync run" }, { status: 500 });
  }

  try {
    const podNames = Object.keys(payload.pods).map(normalizePodName);
    const { data: assignments, error: assignmentError } = await supabase
      .from("student_cohort_assignments")
      .select("*")
      .in("pod_name", podNames)
      .neq("status", "cancelled");

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }

    const verifiedAtMs = new Date(payload.verifiedAt).getTime();
    const currentAssignments = (assignments ?? []).filter(
      (assignment) =>
        new Date(assignment.access_starts_at).getTime() <= verifiedAtMs &&
        verifiedAtMs < new Date(assignment.access_ends_at).getTime(),
    );
    const assignmentByPod = new Map(
      currentAssignments.map((assignment) => [assignment.pod_name, assignment]),
    );
    const rows = [];

    for (const [rawPodName, labs] of Object.entries(payload.pods)) {
      const podName = normalizePodName(rawPodName);
      const assignment = assignmentByPod.get(podName);

      if (!assignment) {
        continue;
      }

      for (const [verifierLabId, result] of Object.entries(labs)) {
        const labId = normalizeVerifierLabId(payload.family, verifierLabId);

        if (!labId) {
          throw new Error(
            `Unknown ${payload.family} verifier lab ID: ${verifierLabId}`,
          );
        }

        rows.push({
          cohort_assignment_id: assignment.id,
          user_id: assignment.user_id,
          pod_name: assignment.pod_name,
          family: payload.family,
          lab_id: labId,
          completed: result.completed,
          reason: result.reason,
          verifier_job_id: payload.verifierJobId,
          verified_at: payload.verifiedAt,
        });
      }
    }

    if (rows.length > 0) {
      const { error: progressError } = await supabase.from("lab_progress").upsert(rows, {
        onConflict: "cohort_assignment_id,family,lab_id",
      });

      if (progressError) {
        throw new Error(progressError.message);
      }
    }

    const assignmentIds = Array.from(
      new Set(rows.map((row) => row.cohort_assignment_id)),
    );

    for (const assignmentId of assignmentIds) {
      await supabase
        .from("student_cohort_assignments")
        .update({ last_progress_synced_at: payload.verifiedAt })
        .eq("id", assignmentId);

      const { count: completedCount } = await supabase
        .from("lab_progress")
        .select("id", { count: "exact", head: true })
        .eq("cohort_assignment_id", assignmentId)
        .eq("completed", true);

      if (completedCount === totalLabCount) {
        const assignment = currentAssignments.find(
          (item) => item.id === assignmentId,
        );

        if (assignment) {
          await supabase.from("integration_events").upsert(
            {
              event_type: "student.curriculum_completed",
              aggregate_type: "student_cohort_assignment",
              aggregate_id: assignmentId,
              payload: {
                assignment_id: assignmentId,
                user_id: assignment.user_id,
                pod_name: assignment.pod_name,
                completed_labs: completedCount,
                verified_at: payload.verifiedAt,
              },
              idempotency_key: `student.curriculum_completed:${assignmentId}`,
            },
            { onConflict: "idempotency_key", ignoreDuplicates: true },
          );
        }
      }
    }

    await supabase
      .from("lab_sync_runs")
      .update({
        status: "successful",
        records_upserted: rows.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncRun.id);

    return Response.json({
      syncRunId: syncRun.id,
      recordsReceived,
      recordsUpserted: rows.length,
      assignmentsUpdated: assignmentIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await supabase
      .from("lab_sync_runs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncRun.id);

    return Response.json({ error: message }, { status: 500 });
  }
}

function normalizePodName(value: string) {
  const match = /^pod(0?[1-9]|1[0-9]|20)$/i.exec(value.trim());

  if (!match) {
    throw new Error(`Invalid pod name: ${value}`);
  }

  return `Pod${String(Number(match[1])).padStart(2, "0")}`;
}
