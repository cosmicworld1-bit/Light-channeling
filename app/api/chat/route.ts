import { NextRequest, NextResponse } from "next/server";
import { runChat } from "@/lib/gemini";
import type { ChatMessage } from "@/lib/types";

// Tool calls can chain a Gemini round-trip with multiple slow requests to
// the legacy CRM (login + search + detail), which comfortably exceeds
// Vercel's 10s default — 60s is the max allowed on the Hobby plan.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const messages = Array.isArray(body?.messages) ? (body.messages as ChatMessage[]) : null;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  try {
    const { reply, uiCards } = await runChat(messages);
    return NextResponse.json({ reply, uiCards });
  } catch (error) {
    console.error("chat route error", error);
    return NextResponse.json(
      { error: "Something went wrong talking to the assistant." },
      { status: 500 },
    );
  }
}
