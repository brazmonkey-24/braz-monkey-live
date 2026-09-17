import { describe, expect, it } from "vitest";
import { appRouter, createCmsPasswordHash, isAdminRecoveryToken } from "./routers";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_COOKIE } from "./adminSession";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createContext(): { ctx: TrpcContext; cookies: CookieCall[] } {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

describe("admin.login", () => {
  it("creates a salted password hash that verifies with the stored salt", () => {
    const { passwordHash, passwordSalt } = createCmsPasswordHash("new-secure-password", "test-salt");
    const candidate = scryptSync("new-secure-password", passwordSalt, 64);
    const expected = Buffer.from(passwordHash, "hex");
    expect(candidate.length).toBe(expected.length);
    expect(timingSafeEqual(candidate, expected)).toBe(true);
  });

  it("accepts the configured CMS username and password and creates an admin session", async () => {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    expect(username).toBeTruthy();
    expect(password).toBeTruthy();

    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.login({ username: username as string, password: password as string });

    expect(result).toEqual({ ok: true });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(ADMIN_SESSION_COOKIE);
    expect(cookies[0]?.value).toBeTruthy();
  });

  it("validates the configured recovery token without exposing it", () => {
    const token = process.env.ADMIN_RECOVERY_TOKEN;
    expect(token).toBeTruthy();
    expect(isAdminRecoveryToken(token as string)).toBe(true);
    expect(isAdminRecoveryToken(`${token}-invalid`)).toBe(false);
  });
});
