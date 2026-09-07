import { parse } from "cookie";
import type { Request } from "express";
import { jwtVerify, SignJWT } from "jose";
import { ENV } from "./_core/env";

export const ADMIN_SESSION_COOKIE = "braz_admin_session";
export const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function getSigningKey() {
  if (!ENV.cookieSecret) {
    throw new Error("Admin session configuration is unavailable");
  }
  return encoder.encode(ENV.cookieSecret);
}

export async function createAdminSessionToken() {
  return new SignJWT({ scope: "braz-admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSigningKey());
}

export async function hasValidAdminSession(
  req: Pick<Request, "headers">
): Promise<boolean> {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return false;

  const token = parse(rawCookie)[ADMIN_SESSION_COOKIE];
  if (!token) return false;

  try {
    const verified = await jwtVerify(token, getSigningKey());
    return verified.payload.scope === "braz-admin";
  } catch {
    return false;
  }
}
