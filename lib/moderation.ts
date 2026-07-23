// 한 줄 의견 자동 모더레이션 — 욕설·혐오·스팸 1차 게이트.
// 사후 신고(auto-hide)와 함께 무인 운영을 지탱한다. 완벽하지 않으며 신고제가 보완.

// 한국어 비속어·혐오 표현(자모 분리·초성 회피는 완벽히 못 잡지만 노골적 표현 차단).
const BANNED = [
  "씨발", "시발", "씨빨", "ㅅㅂ", "병신", "ㅂㅅ", "지랄", "새끼", "새끼야",
  "좆", "존나", "ㅈㄴ", "개새", "썅", "닥쳐", "꺼져", "죽어",
  "빨갱이", "좌빨", "수구", "틀딱", "한남", "김치녀", "된장녀", "맘충",
  "홍어", "전라디언", "일베", "메갈", "느금", "니애미", "애미", "창녀", "걸레",
];

// 스팸 패턴 — URL, 반복 문자, 연락처 유도.
const SPAM = [
  /https?:\/\//i,
  /www\./i,
  /(.)\1{5,}/, // 같은 문자 6회 이상 반복
  /카톡|텔레|orang|010[-\s]?\d{3,4}/i,
];

export interface ModerationResult {
  ok: boolean;
  reason?: string;
}

export function moderateComment(raw: string): ModerationResult {
  const body = raw.trim();
  if (body.length < 2) return { ok: false, reason: "너무 짧습니다" };
  if (body.length > 140) return { ok: false, reason: "140자 이내로 써주세요" };

  const normalized = body.replace(/\s+/g, "");
  const hit = BANNED.find((w) => normalized.includes(w));
  if (hit) return { ok: false, reason: "부적절한 표현이 포함되어 있습니다" };

  if (SPAM.some((re) => re.test(body))) {
    return { ok: false, reason: "링크·연락처·도배는 등록할 수 없습니다" };
  }
  return { ok: true };
}

// 이 횟수 이상 신고되면 자동 숨김 처리.
export const AUTO_HIDE_REPORTS = 3;
