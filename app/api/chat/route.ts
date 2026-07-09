import { NextRequest, NextResponse } from "next/server";
import { runChat } from "@/lib/gemini";
import type { ChatMessage } from "@/lib/types";

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
