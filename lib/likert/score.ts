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
 * 4축 점수 → 종합 한 문장.
 * 헌법 §2.1 — AI 판정 X. 사용자 답변 데이터 그대로 기술만.
 * 강도 0.3 미만 축은 "중간"으로 보고 생략. 모두 중간이면 균형형 안내.
 * 어법: 마지막 구절은 관형형(`···하는`)으로 마무리하고 앞은 연결형(`···하고/하며`).
 */
export function summarizeScores(s: AxisScores): string {
  const phrases: { score: number; conn: string; attr: string }[] = [
    {
      score: s.society,
      conn: s.society > 0 ? "공동체를 중시하고" : "개인을 중시하고",
      attr: s.society > 0 ? "공동체를 중시하는" : "개인을 중시하는",
    },
    {
      score: s.ethics,
      conn: s.ethics > 0 ? "보편 원칙을 따르며" : "상황 맥락을 우선하며",
      attr: s.ethics > 0 ? "보편 원칙을 따르는" : "상황 맥락을 우선하는",
    },
    {
      score: s.economy,
      conn: s.economy > 0 ? "안정·분배를 선호하고" : "성장·위험을 감수하며",
      attr: s.economy > 0 ? "안정·분배를 선호하는" : "성장·위험을 감수하는",
    },
    {
      score: s.change,
      conn: s.change > 0 ? "전통·보존을 지향하고" : "혁신·개방을 받아들이고",
      attr: s.change > 0 ? "전통·보존을 지향하는" : "혁신·개방을 받아들이는",
    },
  ];

  const strong = phrases.filter((p) => Math.abs(p.score) >= 0.3);
  if (strong.length === 0) {
    return "네 축 모두 한쪽으로 치우치지 않은 균형형 입장입니다.";
  }
  if (strong.length === 1) {
    return `${strong[0].attr} 성향입니다.`;
  }
  const head = strong.slice(0, -1).map((p) => p.conn);
  const tail = strong[strong.length - 1].attr;
  return `${head.join(", ")}, ${tail} 성향입니다.`;
}

/** 축별 짧은 보조 설명. 강도 0.3 이상 축만 반환. */
export interface AxisBrief {
  category: string;
  strength: "조금" | "꽤" | "강하게";
  leanLabel: string;
  brief: string;
}

const STRENGTH = (score: number): AxisBrief["strength"] => {
  const a = Math.abs(score);
  if (a < 0.3) return "조금"; // 호출부에서 필터링되니 실제로는 안 쓰임
  if (a < 0.6) return "꽤";
  return "강하게";
};

export function axisBriefs(s: AxisScores): AxisBrief[] {
  const rows: { score: number; category: string; plus: AxisBrief; minus: AxisBrief }[] = [
    {
      score: s.society,
      category: "사회관",
      plus: {
        category: "사회관",
        strength: STRENGTH(s.society),
        leanLabel: "공동체",
        brief: "개인의 자율보다 공동의 책임을 우선",
      },
      minus: {
        category: "사회관",
        strength: STRENGTH(s.society),
        leanLabel: "개인",
        brief: "공동의 규범보다 개인의 선택을 우선",
      },
    },
    {
      score: s.ethics,
      category: "윤리관",
      plus: {
        category: "윤리관",
        strength: STRENGTH(s.ethics),
        leanLabel: "보편 원칙",
        brief: "상황·관계보다 원칙·일관성을 중시",
      },
      minus: {
        category: "윤리관",
        strength: STRENGTH(s.ethics),
        leanLabel: "상황 맥락",
        brief: "원칙의 엄격함보다 맥락과 사정을 고려",
      },
    },
    {
      score: s.economy,
      category: "경제관",
      plus: {
        category: "경제관",
        strength: STRENGTH(s.economy),
        leanLabel: "안정·분배",
        brief: "성장 속도보다 형평·안전망을 우선",
      },
      minus: {
        category: "경제관",
        strength: STRENGTH(s.economy),
        leanLabel: "성장·위험",
        brief: "안전망보다 성장·기회·경쟁을 우선",
      },
    },
    {
      score: s.change,
      category: "변화관",
      plus: {
        category: "변화관",
        strength: STRENGTH(s.change),
        leanLabel: "전통·보존",
        brief: "빠른 변화보다 검증된 가치·관행을 유지",
      },
      minus: {
        category: "변화관",
        strength: STRENGTH(s.change),
        leanLabel: "혁신·개방",
        brief: "기존 관행보다 새로운 변화·개방을 수용",
      },
    },
  ];

  return rows
    .filter((r) => Math.abs(r.score) >= 0.3)
    .map((r) => (r.score > 0 ? r.plus : r.minus));
}

export { QUESTIONS } from "./questions";
export type { LikertQuestion } from "./questions";
