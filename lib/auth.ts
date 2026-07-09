import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "lca_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  if (!safeEqual(signature, sign(issuedAt))) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age <= SESSION_MAX_AGE_SECONDS * 1000;
}

export function checkPasscode(candidate: string): boolean {
  const expected = process.env.APP_PASSCODE;
  if (!expected) throw new Error("APP_PASSCODE is not set");
  return safeEqual(candidate, expected);
}
