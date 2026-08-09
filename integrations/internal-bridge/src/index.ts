import { createClient } from "@supabase/supabase-js";

import { runAwxJob } from "./awx.js";
import { readConfig } from "./config.js";
import { validateJobPayload } from "./job-types.js";
import { redact } from "./redact.js";

type ProvisioningJob = {
  id: string;
  user_id: string;
  lab_assignment_id: string | null;
  job_type: string;
  status: string;
  request_payload: Record<string, unknown>;
  attempts: number;
};

const config = readConfig();
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const job = await claimNextJob();

  if (!job) {
    console.log("No approved provisioning jobs are waiting.");
    return;
  }

  await transition(job, "running", "Bridge started job execution.");

  try {
    const { jobType, payload } = validateJob(job);
    const result = await runAwxJob({
      config,
      jobType: jobType,
      payload,
    });

    await supabase
      .from("provisioning_jobs")
      .update({
        status: result.status,
        external_job_id: result.externalJobId,
        result_payload: redact(result.result),
        completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", job.id)
      .eq("claimed_by", config.BRIDGE_ID);
    await insertEvent(job.id, "running", result.status, "Bridge completed job.", result.result);
    await syncAssignment(job, result.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown bridge error.";

    await supabase
      .from("provisioning_jobs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("claimed_by", config.BRIDGE_ID);
    await insertEvent(job.id, "running", "failed", message, {});
  }
}

async function claimNextJob() {
  const { data: candidates, error } = await supabase
    .from("provisioning_jobs")
    .select("*")
    .in("status", ["approved", "queued"])
    .order("requested_at", { ascending: true })
    .limit(1);

  if (error || !candidates?.length) {
    return null;
  }

  const job = candidates[0] as ProvisioningJob;
  const { data: claimed } = await supabase
    .from("provisioning_jobs")
    .update({
      status: "claimed",
      claimed_by: config.BRIDGE_ID,
      attempts: job.attempts + 1,
      started_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", job.id)
    .in("status", ["approved", "queued"])
    .select("*")
    .single();

  if (!claimed) {
    return null;
  }

  await insertEvent(claimed.id, job.status, "claimed", "Bridge claimed job.", {
    bridgeId: config.BRIDGE_ID,
  });

  return claimed as ProvisioningJob;
}

async function transition(job: ProvisioningJob, toStatus: string, message: string) {
  await supabase
    .from("provisioning_jobs")
    .update({ status: toStatus })
    .eq("id", job.id)
    .eq("claimed_by", config.BRIDGE_ID);
  await insertEvent(job.id, job.status, toStatus, message, {});
}

async function insertEvent(
  jobId: string,
  fromStatus: string | null,
  toStatus: string,
  message: string,
  payload: Record<string, unknown>,
) {
  await supabase.from("provisioning_job_events").insert({
    provisioning_job_id: jobId,
    bridge_id: config.BRIDGE_ID,
    from_status: fromStatus,
    to_status: toStatus,
    message,
    payload: redact(payload),
  });
}

async function syncAssignment(job: ProvisioningJob, status: string) {
  if (!job.lab_assignment_id || status !== "successful") {
    return;
  }

  const { count } = await supabase
    .from("provisioning_jobs")
    .select("id", { count: "exact", head: true })
    .eq("lab_assignment_id", job.lab_assignment_id)
    .in("status", ["approved", "queued", "claimed", "running", "failed"]);

  if (count && count > 0) {
    return;
  }

  await supabase.from("lab_assignments").update({ status: "active" }).eq("id", job.lab_assignment_id);
  await supabase.from("lab_instances").update({ status: "active" }).eq("id", job.request_payload.labInstanceId);
}

function validateJob(job: ProvisioningJob) {
  return validateJobPayload(job.job_type, job.request_payload);
}

main().catch((error) => {
  console.error(redact({ error: error instanceof Error ? error.message : error }));
  process.exit(1);
});
