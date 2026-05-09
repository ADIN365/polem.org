// 사상검증 12 Likert. 4축 (S/E_ethics/E_economy/C) × 각 3문항.
// 명세 §6 Phase 5 — 한국 사회 맥락. 정파 색깔 약하게, 가치 우선순위 묻는 형태.
//
// `direction` 의미: 응답값(-2~+2) 에 곱할 부호.
//   +1 = 답에 +2 (매우 동의) 일수록 *이 축의 + 끝* 으로
//   -1 = 답에 +2 (매우 동의) 일수록 *이 축의 - 끝* 으로 (역코딩)

export type Axis = "S" | "E_ethics" | "E_economy" | "C";

export interface LikertQuestion {
  id: string; // q1..q12
  axis: Axis;
  direction: 1 | -1;
  text: string;
  /** 데이터 분석·디버깅용 짧은 라벨 */
  hint?: string;
}

/**
 * 4축 정의:
 *   S         공동체(+1) ↔ 개인(-1)
 *   E_ethics  보편 원칙(+1) ↔ 상황 맥락(-1)
 *   E_economy 안정/분배(+1) ↔ 성장/위험(-1)
 *   C         전통/보존(+1) ↔ 혁신/개방(-1)
 */
export const AXIS_LABEL: Record<Axis, { plus: string; minus: string; full: string }> = {
  S: { plus: "공동체", minus: "개인", full: "공동체 ↔ 개인" },
  E_ethics: { plus: "보편 원칙", minus: "상황 맥락", full: "보편 ↔ 맥락" },
  E_economy: { plus: "안정·분배", minus: "성장·위험", full: "안정·분배 ↔ 성장" },
  C: { plus: "전통·보존", minus: "혁신·개방", full: "전통 ↔ 혁신" },
};

export const QUESTIONS: LikertQuestion[] = [
  // S — 공동체 ↔ 개인
  {
    id: "q1",
    axis: "S",
    direction: 1,
    text: "사회의 안전·복지를 위해 개인의 자유가 일정 부분 제한될 수 있다.",
  },
  {
    id: "q2",
    axis: "S",
    direction: -1,
    text: "정책의 출발점은 *개인의 선택과 책임* 이어야 한다.",
  },
  {
    id: "q3",
    axis: "S",
    direction: 1,
    text: "공동체의 합의를 위해 소수 의견이 양보되는 경우도 받아들일 수 있다.",
  },

  // E_ethics — 보편 원칙 ↔ 상황 맥락
  {
    id: "q4",
    axis: "E_ethics",
    direction: 1,
    text: "옳고 그름은 *상황과 무관하게* 일관되게 적용되어야 한다.",
  },
  {
    id: "q5",
    axis: "E_ethics",
    direction: -1,
    text: "법과 원칙도 시대·상황에 맞춰 *유연하게* 해석되어야 한다.",
  },
  {
    id: "q6",
    axis: "E_ethics",
    direction: -1,
    text: "정의는 절차적 일관성보다 *결과의 공정성* 으로 판단되어야 한다.",
  },

  // E_economy — 안정/분배 ↔ 성장/위험
  {
    id: "q7",
    axis: "E_economy",
    direction: 1,
    text: "경제 정책의 1차 목표는 *격차 해소와 분배* 여야 한다.",
  },
  {
    id: "q8",
    axis: "E_economy",
    direction: -1,
    text: "성장이 멈추면 분배할 파이도 줄어든다. *성장이 먼저* 다.",
  },
  {
    id: "q9",
    axis: "E_economy",
    direction: -1,
    text: "안전망이 너무 두꺼워지면 도전·창업의 동력이 약해진다.",
  },

  // C — 전통/보존 ↔ 혁신/개방
  {
    id: "q10",
    axis: "C",
    direction: 1,
    text: "오랫동안 검증된 제도는 가능한 한 *유지* 하는 게 안전하다.",
  },
  {
    id: "q11",
    axis: "C",
    direction: -1,
    text: "사회 변화는 점진적 수정보다 *과감한 전환* 이 필요하다.",
  },
  {
    id: "q12",
    axis: "C",
    direction: -1,
    text: "이민·다문화 수용 확대가 한국 사회의 활력에 도움이 된다.",
  },
];

export const LIKERT_SCALE = [
  { value: -2, label: "매우 반대" },
  { value: -1, label: "반대" },
  { value: 0, label: "보통" },
  { value: 1, label: "동의" },
  { value: 2, label: "매우 동의" },
] as const;
