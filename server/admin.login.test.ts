import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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
});
