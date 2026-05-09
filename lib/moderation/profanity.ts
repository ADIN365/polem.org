// 한국어 비속어/혐오 자동 필터. 정규식 + 단어 사전.
// 헌법 §2.4 격렬한 *논리* 토론은 권장. *욕설·인신공격* 만 자동 차단.
// false positive 가능성 있어 *경고* 수준 차단 (사용자에게 본문 수정 요구).
//
// 강한 욕설은 즉시 차단, 인신공격성 표현은 경고. 명백한 혐오어는 즉시 차단.
//
// 이 사전은 *최소 셋업*. 운영 중 신고 누적으로 보완 필요.

const PROFANITY_HARD = [
  // 강한 욕설 (자모 변형 포함 정규식)
  /씨[^a-zA-Z0-9]?[발벌빨][^a-zA-Z0-9]?[놈년것]?/i,
  /[ㅅㅆ]ㅂ/,
  /존[^a-zA-Z0-9]?나/i,
  /개[^a-zA-Z0-9]?[새세][^a-zA-Z0-9]?[끼키]/i,
  /병[^a-zA-Z0-9]?신/i,
  /[ㅂㅄ]신/,
  /지랄/i,
  /엿[^a-zA-Z0-9]?먹/i,
  /닥[^a-zA-Z0-9]?쳐/i,
];

// 명백한 혐오 표현 (성·인종·지역). 신고 누적해서 보완 권장.
const HATE_TERMS = [
  /김치[^a-zA-Z0-9]?녀/i,
  /[한미일중]국[^a-zA-Z0-9]?충/i,
  /[ㅇ언]개미/, // 일부 비하 어투
  /(틀딱|잼민이|급식충)/i,
];

// 위반 시 안내 메시지
export interface FilterResult {
  ok: boolean;
  reason?: string;
}

export function checkProfanity(text: string): FilterResult {
  if (!text) return { ok: true };
  const normalized = text.replace(/\s+/g, "");
  for (const re of PROFANITY_HARD) {
    if (re.test(normalized) || re.test(text)) {
      return { ok: false, reason: "욕설·비속어가 감지됐어요. 표현을 다듬어 주세요." };
    }
  }
  for (const re of HATE_TERMS) {
    if (re.test(normalized) || re.test(text)) {
      return { ok: false, reason: "혐오·차별 표현이 감지됐어요. 사람이 아닌 *주장*에 대한 비판으로 다시 적어주세요." };
    }
  }
  return { ok: true };
}

// 광고 도배 휴리스틱 — URL 3개 이상 + 본문 비율
export function looksLikeSpam(text: string): boolean {
  const urls = text.match(/https?:\/\//gi);
  if (!urls) return false;
  if (urls.length >= 3 && text.length < 300) return true;
  return false;
}
