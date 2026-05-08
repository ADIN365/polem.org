# Changelog

## 2026-05-09 — 네이버 OAuth 추가 + dynamic param decode 패치
- `lib/auth.ts` — 카카오 + 네이버 두 provider 동시 지원. 환경변수 미설정 시 자동 비활성
- `/login` — 두 버튼 노출 (카카오 #FEE500, 네이버 #03C75A)
- `.env.example` / README — 네이버 디벨로퍼스 셋업 단계 추가
- `app/boards/[id]/page.tsx` — Next.js 14.2 가 한글 dynamic param 자동 decode 안 해서 `decodeURIComponent` 명시. viewCount 증분도 fire-and-forget 처리

## 2026-05-09 — Phase 3 박제 + 동조 + 댓글 + 인용/도전
- API: `POST /api/pins` (박제 작성), `POST/DELETE /api/pins/[id]/endorse`, `GET/POST /api/pins/[id]/comments`, `POST /api/pins/[id]/challenge`
- `components/board/PinFormModal.tsx` — PRO/CON 박제 작성 + 인용 박제 (인용된 박제 본문/작성자 함께 표시). 8~1500자, 5분 이내 동일 본문 중복 방지(409)
- `components/board/CommentTree.tsx` — 무한 깊이 트리, 답글 인라인 폼, 자동 접힘 없음
- `components/board/ChallengeModal.tsx` — 출처 도전 (도전자도 sourceUrl 필수, 헌법 2.2)
- `components/board/Pin.tsx` → 클라이언트 컴포넌트로 전환. 동조 토글(낙관적 업데이트, 자기 박제 차단, 비추천 없음), 댓글 펼침, 인용/도전 트리거
- `app/boards/[id]/BoardClient.tsx` — 박제 작성 모달 상태 관리, 인용 흐름, 비로그인/닉네임 미설정 시 toast
- 박제 작성 시 board 의 proCount/conCount 증분 + participantCount 휴리스틱(첫 박제일 때만 +1)

## 2026-05-09 — Phase 2 의제 색인 + 게시판 (읽기 전용)
- `/` (홈) — 의제 색인 표. polem.html `view-index` 디자인 따름. 검색·카테고리·정렬(활동순/최신순/팽팽한 순/참여많은순)·페이지네이션
- `/boards/[id]` — 게시판 상세. polem.html `view-board` 디자인 따름. 좌우 분할(찬/반), 비율 막대, AI 50:50 요약 placeholder
- `components/board/BoardRow.tsx` — 색인 row (#번호, 카테고리 라벨, 새 의제/팽팽 태그, 비율 막대, 참여·관람 카운트)
- `components/board/Pin.tsx` — 박제 카드 (PRO=흰 카드, CON=잉크 카드). 인용 박제 표시·블라인드 동의율·출처 도전 배지·동조/댓글 카운트
- `components/board/BoardListFilters.tsx` — 검색/필터 (client, URL 동기화)
- `components/ui/Gauge.tsx` — 찬·반 비율 막대 (헌법 2.4 진영색 회피, 흰/잉크)
- `lib/format.ts` — `formatRelativeKo`, `formatCount` (1.2천, 4.7만)
- `prisma/seed.ts` — 14개 의제 + 65개 박제 시드 (한국 사회 실 찬반 사안: 보유세·의대정원·모병제·사형제·AI저작권·부유세·선거제·원전·주4일제·동성결혼·AI학습데이터·기본소득·한미일·탄소세)
- `package.json` — `db:migrate`, `db:seed`, `db:studio` 스크립트, `prisma.seed` 훅 (tsx)
- 박제 작성 버튼은 Phase 3 진입 전까지 disabled

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
