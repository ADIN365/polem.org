// 공통 타입 — provider 와 task 사이 인터페이스
import type { Category } from "@prisma/client";

export interface AiCallOptions {
  system?: string;
  /** 출력이 JSON 이라고 모델에게 명시. 단순 prompt 추가만 함 (provider 가 강제 구조화 지원하면 사용). */
  jsonMode?: boolean;
  /** 최대 토큰 (provider 에 매핑). claude-cli 는 무시. */
  maxTokens?: number;
}

export interface AiProvider {
  readonly name: string;
  call(prompt: string, options?: AiCallOptions): Promise<string>;
}

export interface RefineResult {
  aiTitle: string | null;
  aiCategory: Category | null;
  aiFiltered: boolean;
  /** 거부 사유 (aiFiltered=true 인 경우만) — 관리자에게만 노출. */
  filterReason: string | null;
}
