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

export { QUESTIONS } from "./questions";
export type { LikertQuestion } from "./questions";
