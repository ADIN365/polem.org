// 12 Likert 답변 → 4축 점수 계산.

import type { Axis } from "./questions";
import { QUESTIONS } from "./questions";

export interface AxisScores {
  society: number;
  ethics: number;
  economy: number;
  change: number;
}

export type AnswerMap = Record<string, number>; // questionId → -2..+2

/**
 * 각 축마다 3 문항. direction 으로 부호 정규화 후 합산하면 -6..+6 → /6 = -1..+1.
 * 입력에 빠진 문항은 0 (보통) 으로 간주.
 */
export function computeScores(answers: AnswerMap): AxisScores {
  const sums: Record<Axis, number> = {
    S: 0,
    E_ethics: 0,
    E_economy: 0,
    C: 0,
  };
  for (const q of QUESTIONS) {
    const raw = clamp(answers[q.id] ?? 0, -2, 2);
    sums[q.axis] += raw * q.direction;
  }
  return {
    society: round3(sums.S / 6),
    ethics: round3(sums.E_ethics / 6),
    economy: round3(sums.E_economy / 6),
    change: round3(sums.C / 6),
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** UI 라벨링 — score(-1..+1) → 위치 (왼쪽 -100% 부터 오른쪽 +100%). */
export function scoreToPercent(score: number): number {
  return Math.round(((score + 1) / 2) * 100);
}

/** 4축 코드 (예: S+0.5 / E•+0.2 / E$-0.3 / C+0.7). 디버그·내보내기용. */
export function formatPrismCode(s: AxisScores): string {
  const fmt = (n: number) => (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
  return `S${fmt(s.society)} E•${fmt(s.ethics)} E$${fmt(s.economy)} C${fmt(s.change)}`;
}

/**
 * 4축 점수를 한 문장 자연어 요약으로.
 * 헌법 §2.1 — AI 판정 X. 사용자 답변 데이터 그대로 기술만.
 * 강도 0.3 미만 축은 "중간"으로 보고 생략. 모두 중간이면 균형형 안내.
 */
export function summarizeScores(s: AxisScores): string {
  const phrases: { score: number; phrase: string }[] = [
    { score: s.society, phrase: s.society > 0 ? "공동체를 중시하고" : "개인을 중시하고" },
    { score: s.ethics, phrase: s.ethics > 0 ? "보편 원칙에 따르며" : "상황 맥락에 따르며" },
    { score: s.economy, phrase: s.economy > 0 ? "안정·분배를 선호하고" : "성장·위험을 감수하며" },
    { score: s.change, phrase: s.change > 0 ? "전통·보존을 지키는" : "혁신·개방을 받아들이는" },
  ];

  const strong = phrases.filter((p) => Math.abs(p.score) >= 0.3);
  if (strong.length === 0) {
    return "네 축 모두 한쪽으로 치우치지 않은 균형형 입장입니다.";
  }
  return strong.map((p) => p.phrase).join(" ") + " 성향입니다.";
}

export { QUESTIONS } from "./questions";
export type { LikertQuestion } from "./questions";
