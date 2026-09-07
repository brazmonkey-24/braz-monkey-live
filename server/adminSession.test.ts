import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  hasValidAdminSession,
} from "./adminSession";

describe("adminSession", () => {
  it("accepts a freshly signed admin session", async () => {
    const token = await createAdminSessionToken();
    const valid = await hasValidAdminSession({
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    });

    expect(valid).toBe(true);
  });

  it("rejects missing or tampered admin sessions", async () => {
    await expect(hasValidAdminSession({ headers: {} })).resolves.toBe(false);
    await expect(
      hasValidAdminSession({
        headers: { cookie: `${ADMIN_SESSION_COOKIE}=not-a-valid-token` },
      })
    ).resolves.toBe(false);
  });
});
