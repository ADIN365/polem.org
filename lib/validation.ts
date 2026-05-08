// 입력값 검증 공통 모듈

// 닉네임: 2~12자, 한글·영문·숫자·언더스코어
export const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,12}$/;

// 박제·댓글 본문 길이 한도 (Phase 3 에서 사용)
export const PIN_BODY_MIN = 8;
export const PIN_BODY_MAX = 1500;
export const COMMENT_BODY_MIN = 1;
export const COMMENT_BODY_MAX = 800;

// 의제 본문 (제안)
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
