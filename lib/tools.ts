import type { FunctionDeclaration } from "@google/genai";
import type { UiCard } from "./types";

export type ToolResult = {
  output: unknown;
  uiCard?: UiCard;
};

export type Tool = {
  declaration: FunctionDeclaration;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
};

// search_crm_org, build_whatsapp_intake_summary, and find_nearby_schools
// are registered here in later phases.
const registry: Tool[] = [];

export const TOOLS = registry;

export async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const tool = registry.find((t) => t.declaration.name === name);
  if (!tool) {
    return { output: { error: `Unknown tool: ${name}` } };
  }
  try {
    return await tool.handler(args);
  } catch (error) {
    return {
      output: { error: error instanceof Error ? error.message : "Tool call failed" },
    };
  }
}
