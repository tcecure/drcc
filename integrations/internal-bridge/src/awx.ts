import type { BridgeConfig } from "./config.js";
import type { ProvisioningJobType } from "./job-types.js";

export type AwxResult = {
  externalJobId: string;
  status: "successful" | "failed";
  result: Record<string, unknown>;
};

export async function runAwxJob({
  config,
  jobType,
}: {
  config: BridgeConfig;
  jobType: ProvisioningJobType;
  payload: Record<string, unknown>;
}): Promise<AwxResult> {
  if (config.INTEGRATION_MODE === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      externalJobId: `mock-awx-${jobType}-${Date.now()}`,
      status: "successful",
      result: {
        mode: "mock",
        jobType,
        completedAt: new Date().toISOString(),
      },
    };
  }

  throw new Error("Live AWX execution is not enabled in this bridge scaffold.");
}
