// 익명 투표자 식별 — 로그인 없이 중복 투표만 막는다.
// 쿠키에 임의 토큰을 심고, 그걸 서버 시크릿과 함께 해시해 voterHash 를 만든다.
// 개인 식별 목적이 아니며, IP·개인정보를 저장하지 않는다.
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

const COOKIE = "polem_vid";
const SECRET = process.env.VOTE_SALT ?? "polem-dev-salt";

// 읽기 전용(서버 컴포넌트)에서 현재 투표자 해시를 구한다. 쿠키가 없으면 null.
export function currentVoterHash(): string | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  return hashToken(raw);
}

// 투표 시(라우트 핸들러) 호출 — 없으면 쿠키를 발급하고 해시를 반환한다.
export function ensureVoterHash(): string {
  const jar = cookies();
  let raw = jar.get(COOKIE)?.value;
  if (!raw) {
    raw = randomBytes(16).toString("hex");
    jar.set(COOKIE, raw, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 2, // 2년
      path: "/",
    });
  }
  return hashToken(raw);
}

function hashToken(raw: string): string {
  return createHash("sha256").update(`${raw}:${SECRET}`).digest("hex");
}
