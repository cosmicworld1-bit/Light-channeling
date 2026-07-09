import { GoogleGenAI, createPartFromFunctionResponse } from "@google/genai";
import type { Content, Part } from "@google/genai";
import { TOOLS, dispatchTool } from "./tools";
import type { ChatMessage, UiCard } from "./types";

const MODEL = "gemini-2.5-flash";
const MAX_TOOL_ITERATIONS = 6;

const SYSTEM_INSTRUCTION = `You are a personal assistant for Dammy, who runs "Light Channeling", a school-outreach volunteer program. You help by chat only (no voice yet).

You have access to tools that look up and summarize records in Dammy's volunteer CRM, and to a tool that prepares (but never sends) a WhatsApp message summarizing a new session for a coordinator to review.

Rules:
- Never claim to have sent a message, submitted a form, or written anything to the CRM. You can only read from it.
- When gathering details for a new session (school, date, headcount, session type, presenter, coordinator contact), ask concise follow-up questions for whatever is missing — don't invent values.
- When a CRM search returns multiple possible matches, list them and ask which one before proceeding.
- Keep replies short and conversational, like a text message.`;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export async function runChat(
  history: ChatMessage[],
): Promise<{ reply: string; uiCards: UiCard[] }> {
  const ai = getClient();
  const contents: Content[] = history.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }));
  const uiCards: UiCard[] = [];
  const toolDeclarations = TOOLS.map((tool) => tool.declaration);

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: toolDeclarations.length ? [{ functionDeclarations: toolDeclarations }] : undefined,
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      return { reply: response.text ?? "", uiCards };
    }

    const modelParts: Part[] =
      response.candidates?.[0]?.content?.parts ?? calls.map((call) => ({ functionCall: call }));
    contents.push({ role: "model", parts: modelParts });

    const responseParts: Part[] = [];
    for (const call of calls) {
      const name = call.name ?? "";
      const result = await dispatchTool(name, call.args ?? {});
      if (result.uiCard) uiCards.push(result.uiCard);
      responseParts.push(
        createPartFromFunctionResponse(call.id ?? name, name, {
          output: result.output,
        }),
      );
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return {
    reply:
      "I wasn't able to finish that after several tool calls — could you rephrase or simplify the request?",
    uiCards,
  };
}
