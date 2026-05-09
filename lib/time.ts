// KST(UTC+9) 시간 헬퍼. cron dup-guard, 하루 첫 로그인 판정 등.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * KST 기준 오늘 자정의 UTC Date 반환. createdAt >= 이 값 = "오늘 KST"
 */
export function kstStartOfToday(): Date {
  const nowUtcMs = Date.now();
  const nowKstMs = nowUtcMs + KST_OFFSET_MS;
  const dayMs = 24 * 60 * 60 * 1000;
  const kstMidnightMs = Math.floor(nowKstMs / dayMs) * dayMs;
  return new Date(kstMidnightMs - KST_OFFSET_MS);
}
