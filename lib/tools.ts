import type { FunctionDeclaration } from "@google/genai";
import { getOrgDetail, searchOrg } from "./crmClient";
import type { UiCard } from "./types";

export type ToolResult = {
  output: unknown;
  uiCard?: UiCard;
};

export type Tool = {
  declaration: FunctionDeclaration;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
};

async function handleSearchCrmOrg(args: Record<string, unknown>): Promise<ToolResult> {
  const name = typeof args.name === "string" && args.name.trim() ? args.name.trim() : undefined;
  const city = typeof args.city === "string" && args.city.trim() ? args.city.trim() : undefined;
  const pin = typeof args.pin === "string" && args.pin.trim() ? args.pin.trim() : undefined;
  const address =
    typeof args.address === "string" && args.address.trim() ? args.address.trim() : undefined;
  const orgnId =
    typeof args.orgnId === "string" && args.orgnId.trim() ? args.orgnId.trim() : undefined;

  if (!name && !city && !pin && !address && !orgnId) {
    return {
      output: { error: "Provide at least one search field: name, city, pin, address, or orgnId." },
    };
  }

  const matches = await searchOrg({ name, city, pin, address, orgnId });

  if (matches.length === 0) {
    return { output: { matchCount: 0, message: "No organisations matched that search." } };
  }

  if (matches.length > 1) {
    return {
      output: {
        matchCount: matches.length,
        matches,
        message: "Multiple organisations matched — ask the user which one before looking up sessions.",
      },
      uiCard: { type: "org_matches", matches },
    };
  }

  const detail = await getOrgDetail(matches[0].orgnId);
  const latestSession = detail.sessions[0] ?? null;

  const orgSummary = {
    orgnId: detail.orgnId,
    name: detail.name,
    orgType: detail.type,
    address: detail.address,
    zone: detail.zone,
    contact1: detail.contact1,
    contact2: detail.contact2,
  };

  return {
    output: {
      matchCount: 1,
      org: orgSummary,
      latestSession,
      totalSessions: detail.sessions.length,
    },
    uiCard: { type: "org_summary", ...orgSummary, latestSession },
  };
}

const registry: Tool[] = [
  {
    declaration: {
      name: "search_crm_org",
      description:
        "Search the Light Channeling volunteer CRM for a school/organisation and return its details plus the most recent session. Provide at least one of name, city, pin, address, or orgnId — combine fields to narrow results. If multiple organisations match, ask the user which one they mean (don't guess), then call this again with a more specific search.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Organisation name or part of it, e.g. a school name." },
          city: { type: "string", description: "City to narrow the search." },
          pin: { type: "string", description: "Postal/PIN code to narrow the search." },
          address: { type: "string", description: "A word or two from the address to narrow the search." },
          orgnId: { type: "string", description: "Exact CRM organisation id, if already known." },
        },
      },
    },
    handler: handleSearchCrmOrg,
  },
];

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
