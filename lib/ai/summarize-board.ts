import { selectProvider } from "@/lib/ai";
import { BOARD_SUMMARY_SYSTEM } from "@/lib/ai/prompts";

export interface BoardSummary {
  pro: string;
  con: string;
}

interface PinSnippet {
  side: "PRO" | "CON";
  body: string;
}

/**
 * 박제 100~300개 → 50:50 양측 요약 한 줄씩.
 * 헌법 §2.1 — 우열 평가 절대 X. 길이 비슷하게 맞춤.
 */
export async function summarizeBoard(
  boardTitle: string,
  pins: PinSnippet[],
): Promise<BoardSummary | null> {
  if (pins.length < 4) return null; // 너무 적으면 의미 없음

  const proLines = pins
    .filter((p) => p.side === "PRO")
    .slice(0, 50)
    .map((p, i) => `[찬${i + 1}] ${p.body}`);
  const conLines = pins
    .filter((p) => p.side === "CON")
    .slice(0, 50)
    .map((p, i) => `[반${i + 1}] ${p.body}`);

  const provider = selectProvider();
  const userInput = [
    `[토론 주제] ${boardTitle}`,
    "",
    "[찬성 박제]",
    proLines.length === 0 ? "(없음)" : proLines.join("\n"),
    "",
    "[반대 박제]",
    conLines.length === 0 ? "(없음)" : conLines.join("\n"),
  ].join("\n");

  const text = await provider.call(userInput, {
    system: BOARD_SUMMARY_SYSTEM,
    jsonMode: true,
    maxTokens: 600,
  });

  return parseSummaryJson(text);
}

function parseSummaryJson(raw: string): BoardSummary | null {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]) as Record<string, unknown>;
    const pro = typeof obj.pro === "string" ? obj.pro.trim() : "";
    const con = typeof obj.con === "string" ? obj.con.trim() : "";
    if (!pro || !con) return null;
    return { pro, con };
  } catch {
    return null;
  }
}
