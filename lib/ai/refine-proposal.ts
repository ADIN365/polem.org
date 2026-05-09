import type { Category } from "@prisma/client";

import { selectProvider } from "@/lib/ai";
import { PROPOSAL_REFINE_SYSTEM } from "@/lib/ai/prompts";
import type { RefineResult } from "@/lib/ai/types";

const CATEGORIES: Category[] = [
  "POLITICS",
  "ECONOMY",
  "SOCIETY",
  "CULTURE",
  "FOREIGN_AFFAIRS",
  "ENVIRONMENT",
];

export async function refineProposal(
  rawTitle: string,
  rawBody: string | null,
): Promise<RefineResult> {
  const provider = selectProvider();
  const userInput = `[제안 제목]\n${rawTitle}\n\n[배경]\n${rawBody?.trim() || "(없음)"}`;
  const text = await provider.call(userInput, {
    system: PROPOSAL_REFINE_SYSTEM,
    jsonMode: true,
    maxTokens: 600,
  });
  return parseRefineJson(text);
}

function parseRefineJson(raw: string): RefineResult {
  const json = extractFirstJsonObject(raw);
  if (!json) {
    throw new Error(`AI 응답에서 JSON 을 찾지 못했어요: ${raw.slice(0, 200)}`);
  }
  const filtered = !!json.aiFiltered;
  const cat = typeof json.aiCategory === "string" ? json.aiCategory : null;
  const title = typeof json.aiTitle === "string" ? json.aiTitle.trim() : null;

  return {
    aiTitle: filtered ? null : title,
    aiCategory: filtered ? null : cat && CATEGORIES.includes(cat as Category) ? (cat as Category) : null,
    aiFiltered: filtered,
    filterReason:
      filtered && typeof json.filterReason === "string" ? json.filterReason.trim() : null,
  };
}

function extractFirstJsonObject(text: string): Record<string, unknown> | null {
  // 코드블록·여분 텍스트 제거 후 첫 { ... } 매칭
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}
