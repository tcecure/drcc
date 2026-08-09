import "server-only";

import { readServerEnv } from "@/lib/validation/env";

export type MoodleUser = {
  id: number;
  email: string;
};

export type MoodleProgress = {
  progressPercentage: number;
  completed: boolean;
  lastActivityAt: string;
};

export function getMoodleIntegrationMode() {
  return readServerEnv().MOODLE_INTEGRATION_MODE;
}

export async function findMoodleUserByEmail(email: string): Promise<MoodleUser | null> {
  if (getMoodleIntegrationMode() === "mock") {
    return { id: mockMoodleUserId(email), email };
  }

  throw new Error("Live Moodle lookup is not configured yet.");
}

export async function createMoodleUser(email: string): Promise<MoodleUser> {
  if (getMoodleIntegrationMode() === "mock") {
    return { id: mockMoodleUserId(email), email };
  }

  throw new Error("Live Moodle user creation is not configured yet.");
}

export async function enrollUserInCourse() {
  if (getMoodleIntegrationMode() === "mock") {
    return { externalJobId: `mock-${Date.now()}` };
  }

  throw new Error("Live Moodle enrollment is not configured yet.");
}

export async function retrieveCourseCompletion(): Promise<MoodleProgress> {
  if (getMoodleIntegrationMode() === "mock") {
    return {
      progressPercentage: 0,
      completed: false,
      lastActivityAt: new Date().toISOString(),
    };
  }

  throw new Error("Live Moodle completion retrieval is not configured yet.");
}

export async function retrieveProgress() {
  return retrieveCourseCompletion();
}

export async function suspendMoodleUser() {
  if (getMoodleIntegrationMode() === "mock") {
    return { suspended: true };
  }

  throw new Error("Live Moodle suspension is not configured yet.");
}

export async function triggerPasswordSetupWorkflow() {
  if (getMoodleIntegrationMode() === "mock") {
    return { sent: true };
  }

  throw new Error("Live Moodle password workflow is not configured yet.");
}

function mockMoodleUserId(email: string) {
  return Math.abs(
    email.split("").reduce((hash, char) => hash * 31 + char.charCodeAt(0), 7),
  );
}
