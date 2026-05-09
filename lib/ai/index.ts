// AI provider router. 현재는 claude-cli 단일. 나중에 Anthropic API/OpenAI/Gemini 추가 시
// 환경변수로 우선순위 결정 + fallback.

import type { AiProvider } from "@/lib/ai/types";
import { claudeCli } from "@/lib/ai/providers/claude-cli";

export function selectProvider(): AiProvider {
  // TODO: ANTHROPIC_API_KEY/OPENAI_API_KEY/GOOGLE_GEMINI_API_KEY 가 있으면 우선순위로 선택
  // 지금은 claude-cli 만. (Vercel 환경에서는 호출 시 에러 — 의도적 설계)
  return claudeCli;
}

export { claudeCli };
