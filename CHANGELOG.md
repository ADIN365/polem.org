# Changelog

## 2026-05-09 — Phase 0 골격
- Next.js 14.2 (App Router) + TypeScript + Tailwind 셋업
- Prisma 6 + PostgreSQL v1.0 schema (User, Board, Pin, Comment, Endorsement, Challenge, Report, Proposal, PrismScore, LikertAnswer, BlindAnswer, Notification + NextAuth Account/Session/VerificationToken). v2 LogicNode·v3 Tweet 자리는 주석으로 표시.
- NextAuth v4 골격 (`lib/auth.ts`) — KAKAO_CLIENT_ID/SECRET 미설정 시 Provider 비활성. Phase 1 에서 카카오 OAuth 활성.
- 디자인 토큰 (`app/globals.css`) — polem.html 의 CSS Variables 그대로 이전. Tailwind config 와 매핑.
- 글자 크기 토글 (`components/layout/FontSizeToggle.tsx`) — body class swap + localStorage 영속화.
- TopNav · Footer · Toast (`react-hot-toast`) 레이아웃.
- Pretendard Variable + Noto Serif KR 외부 CDN 로드.
- 환경변수 가이드 (`.env.example`) — DATABASE_URL · NEXTAUTH_SECRET · NEXTAUTH_URL · KAKAO_CLIENT_ID/SECRET.
