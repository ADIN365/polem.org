// 입력값 검증 공통 모듈

// 닉네임: 2~12자, 한글·영문·숫자·언더스코어
export const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,12}$/;

// 닉네임 변경 게이트 — 첫 설정 후 30일에 1회
export const NICKNAME_CHANGE_GUARD_DAYS = 30;

// 이메일 (검증 메일 X. 형식만 가볍게 체크)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX = 254;

/**
 * 다음 닉네임 변경 가능 시점 계산.
 * nicknameUpdatedAt 이 NULL 이면 *변경한 적 없음* → 즉시 가능.
 */
export function nextNicknameChangeAt(
  nicknameUpdatedAt: Date | null,
): Date | null {
  if (!nicknameUpdatedAt) return null;
  const next = new Date(nicknameUpdatedAt);
  next.setUTCDate(next.getUTCDate() + NICKNAME_CHANGE_GUARD_DAYS);
  return next;
}

export function canChangeNicknameNow(nicknameUpdatedAt: Date | null): boolean {
  const next = nextNicknameChangeAt(nicknameUpdatedAt);
  return !next || next.getTime() <= Date.now();
}

// 박제·댓글 본문 길이 한도 (Phase 3 에서 사용)
export const PIN_BODY_MIN = 8;
export const PIN_BODY_MAX = 1500;
export const COMMENT_BODY_MIN = 1;
export const COMMENT_BODY_MAX = 800;

// 의제 본문 (주제 입력)
export const PROPOSAL_TITLE_MAX = 80;
export const PROPOSAL_BODY_MAX = 1000;

// 닉네임 차단 목록 (시스템 예약어)
const RESERVED_NICKNAMES = new Set([
  "admin",
  "administrator",
  "moderator",
  "system",
  "polem",
  "끝장토론",
  "운영자",
  "관리자",
  "탈퇴회원",
]);

export function isReservedNickname(nickname: string): boolean {
  return RESERVED_NICKNAMES.has(nickname.toLowerCase());
}
