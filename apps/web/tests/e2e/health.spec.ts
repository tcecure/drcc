import { expect, test } from "@playwright/test";

test("health endpoint reports application status", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = (await response.json()) as {
    status: string;
    application: string;
  };

  expect(response.ok()).toBe(true);
  expect(body.status).toBe("ok");
  expect(body.application).toBe("DigitalRCC Portal");
});
