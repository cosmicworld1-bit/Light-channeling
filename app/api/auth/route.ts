import { NextRequest, NextResponse } from "next/server";
import {
  checkPasscode,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/auth";

// Not gated by the proxy, so the client can ask "am I already unlocked?"
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return NextResponse.json({ ok: verifySessionToken(token) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!passcode || !checkPasscode(passcode)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
