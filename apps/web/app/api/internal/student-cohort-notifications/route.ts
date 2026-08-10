import { NextResponse, type NextRequest } from "next/server";

import { processDueCohortNotifications } from "@/lib/students/cohorts";
import { readServerEnv } from "@/lib/validation/env";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return processRequest(request);
}

export async function GET(request: NextRequest) {
  return processRequest(request);
}

async function processRequest(request: NextRequest) {
  const env = readServerEnv();

  if (env.CRON_SECRET) {
    const authorization = request.headers.get("authorization");

    if (authorization !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processDueCohortNotifications(null);

  return NextResponse.json({
    status: "ok",
    ...result,
  });
}
