# Changelog

## 2026-05-09 — Phase 1 인증 + 사용자
- `/login` — 카카오 로그인 버튼 (`#FEE500` 카카오 브랜드 컬러)
- `/post-login` — OAuth 직후 라우터. 닉네임 미설정자는 `/onboarding/nickname` 으로 강제, 그 외는 next URL 로
- `/onboarding/nickname` — 신규 가입자 닉네임 입력 (2~12자, 한글·영문·숫자·_, 시스템 예약어 차단, 중복 거절)
- `/api/me/nickname` (POST) — 닉네임 설정. zod 검증 + 중복 충돌 시 409
- `/me` — 닉네임·이메일·권한 표시 + 로그아웃 (Phase 5~7 자기 거울은 placeholder)
- `/banned` — 이용 정지 안내 페이지
- `lib/session.ts` — `requireAuth()` / `requireOnboarded()` 게이트 헬퍼
- `lib/validation.ts` — 닉네임 정규식 + 시스템 예약어 + Phase 3+ 본문 길이 한도
- `lib/auth.ts events.createUser` — 신규 가입 시 빈 PrismScore row 생성 (Phase 5 Likert 로 채움)
- 세션 타입 확장 (`types/next-auth.d.ts`) — id · nickname · role · banned

## 2026-05-09 — Phase 0 골격
- Next.js 14.2 (App Router) + TypeScript + Tailwind 셋업
- Prisma 6 + PostgreSQL v1.0 schema (User, Board, Pin, Comment, Endorsement, Challenge, Report, Proposal, PrismScore, LikertAnswer, BlindAnswer, Notification + NextAuth Account/Session/VerificationToken). v2 LogicNode·v3 Tweet 자리는 주석으로 표시.
- NextAuth v4 골격 (`lib/auth.ts`) — KAKAO_CLIENT_ID/SECRET 미설정 시 Provider 비활성. Phase 1 에서 카카오 OAuth 활성.
- 디자인 토큰 (`app/globals.css`) — polem.html 의 CSS Variables 그대로 이전. Tailwind config 와 매핑.
- 글자 크기 토글 (`components/layout/FontSizeToggle.tsx`) — body class swap + localStorage 영속화.
- TopNav · Footer · Toast (`react-hot-toast`) 레이아웃.
- Pretendard Variable + Noto Serif KR 외부 CDN 로드.
- 환경변수 가이드 (`.env.example`) — DATABASE_URL · NEXTAUTH_SECRET · NEXTAUTH_URL · KAKAO_CLIENT_ID/SECRET.
