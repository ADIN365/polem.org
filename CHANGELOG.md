# Changelog

## 2026-05-09 — Phase 7 의제별 자기 거울
- `lib/profile/mirror.ts` — 사용자 박제 입장 (PRO/CON) 과 블라인드 답변의 *효과적 입장* (AGREE+side / DISAGREE+반대side) 을 의제 단위로 집계
- 4 분류: *일치 / 살펴볼 만함 / 새 발견 / 갈림*. STANCE_THRESHOLD 0.7 (한쪽 비율 70%↑ 시 입장 인정)
- `components/profile/MirrorTable.tsx` — 의제별 row + 카운트 + 상태 태그 + 한 줄 힌트
- `/me` 의 *자기 거울* 섹션을 진짜 데이터로 교체. 누적 블라인드 답변 횟수 표시
- 헌법 §2.3 — 본인에게만 노출. 다른 사용자 자기 거울 접근 X

## 2026-05-09 — Phase 6 오늘의 3문항 (블라인드)
- `lib/ai/blind-convert.ts` + `scripts/convert-blind.ts` + `launchd/org.polem.blind.plist` — 박제 → 블라인드 질문 변환 cron (5분 주기, 5분 grace)
- `/three` — 답하지 않은 박제 50개 후보 셔플 → 3개. 진영 가린 질문 한 화면씩 진행
- `POST /api/three/answer` — BlindAnswer create + Pin.blindAgreeCount/blindDisagreeCount 증분 + PrismScore.blindCount 증분 (Phase 7 자기 거울 데이터 출처)
- `/three/reveal` — 최근 5분 답변 *원본 의제·박제* 공개 + 입장 일치 / 살펴볼 만함 태그
- 블라인드 자기 답이 박제 입장과 일치 X → 본인에게만 *살펴볼 만함* 노출 (헌법 §2.3 Private)

## 2026-05-09 — Phase 5 사상검증 12 Likert + 4축 PrismScore
- `lib/likert/questions.ts` — 4축(S/E_ethics/E_economy/C) × 3문항 = 12개. 한국 사회 맥락. direction 부호로 역코딩 처리
- `lib/likert/score.ts` — 답변 합산/정규화 (-1~+1). `formatPrismCode`, `scoreToPercent` 헬퍼
- `POST /api/likert` — 12문항 답변 받음 → upsert LikertAnswer + PrismScore. 누락 거절
- `/onboarding/ideology` — 사상검증 안내 + *시작/나중에* 버튼. 이미 완료한 사용자는 자동 next URL 로
- `/onboarding/likert` — 한 화면 한 문항 진행. 진행 막대 12칸, 자동 다음, 마지막 답변 시 자동 저장
- `/me` 의 4축 프리즘 — `PrismChart` 추가 (검정 마커 + 중앙선). 미완료 시 *측정하기* CTA
- 닉네임 설정 직후 자동으로 `/onboarding/ideology` 로 이동 (명세 §5 가입 흐름 일치)

## 2026-05-09 — Phase 4 의제 제안 + AI 정제 (cron 비실시간)
- `/proposal` — 자유 입력 폼 (rawTitle 5~80자, rawBody 0~2000자). 1시간 이내 동일 제목 중복 차단
- `POST /api/proposals` — Proposal row 생성 (status PENDING, ai* null)
- `lib/ai/` — provider 추상화 (`AiProvider` 인터페이스 + `claudeCli` 구현). Anthropic/OpenAI/Gemini 추가 자리 미리 둠
- `lib/ai/refine-proposal.ts` — claude -p 헤드리스로 정제. JSON 파싱 안전 처리
- `scripts/refine-proposals.ts` — 5분 cron worker (lock 파일 + dotenv/config + 5건씩 batch)
- `launchd/org.polem.refine.plist` — `~/Library/LaunchAgents/` 에 복사 후 `launchctl load`
- `/admin` 권한 가드 layout + 대시보드 (정제 대기·검토 대기·차단·활성 게시판·가입자 카운트)
- `/admin/proposals` — 정제·차단·정제 대기 3그룹 표시. 정제 결과 *수정 후 승인* 가능 + 거절 사유 입력
- `PATCH /api/admin/proposals/[id]` — 승인 시 Board 생성 + Notification 알림. 거절 시 사유 알림
- `/me` — 자기 제안 목록 + 알림 미리보기 추가 (Phase 8 알림 페이지 풀 구현 전 단계)
- TopNav — ADMIN role 사용자에게만 *관리자* 링크 노출

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
