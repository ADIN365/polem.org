import { selectProvider } from "@/lib/ai";
import { BLIND_QUESTION_SYSTEM } from "@/lib/ai/prompts";

/**
 * 박제 본문을 *진영을 가린 블라인드 질문* 으로 변환.
 * 의제명·고유명사·정당명 모두 가림. 논점만 유지.
 */
export async function convertToBlindQuestion(
  pinBody: string,
  boardTitle: string,
): Promise<string> {
  const provider = selectProvider();
  const userInput = `[원본 의제]\n${boardTitle}\n\n[박제 본문]\n${pinBody}`;
  const out = await provider.call(userInput, {
    system: BLIND_QUESTION_SYSTEM,
    maxTokens: 200,
  });
  // 단순 정제: 따옴표·역따옴표·코드블록 제거
  return out
    .replace(/^```[a-z]*\s*/gi, "")
    .replace(/\s*```\s*$/g, "")
    .replace(/^["'「『]/, "")
    .replace(/["'」』]$/, "")
    .trim();
}
