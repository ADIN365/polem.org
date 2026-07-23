# Changelog

## 2026-07-24 — 한 줄 의견(커뮤니티 씨앗) + 콘텐츠 30개

- **익명 한 줄 의견**: 로그인 없이 쟁점당 1글(140자). 투표한 사람은 "찬성/반대 측"
  뱃지 자동. 모더레이션: 한국어 욕설·혐오·진영비하 게이트 + 링크/연락처 스팸 필터
  + 사후 신고 3회 자동 숨김(무인 운영). `Comment` 모델 추가.
- **콘텐츠 30개**: 시드 8 + AI 발행 22(사회쟁점·직장·돈·연애·일상).
- **슬러그 버그 2건 수정**: (1) "X vs Y" 주제가 전부 `-vs-`로 충돌 → 한글 유지
  슬러그+충돌 접미사. (2) Next.js 14.2가 라우트 param을 퍼센트 인코딩 상태로
  넘기고 한글이 NFD로 왕복 → `normalizeSlug`(decodeURIComponent+NFC)로 DB(NFC) 일치.
- 배포·라이브 검증 완료(한글 슬러그 200, 투표·의견·모더레이션 실측). 테스트 데이터 정리.

## 2026-07-24 — 피벗: 찬반 아카이브 + 익명 투표 (v2)

로그인 기반 정치 토론 UGC 플랫폼 "끝장토론" → 무인 운영 콘텐츠 사이트 "폴렘"으로 전환.
(사유: 트래픽 콜드스타트·모더레이션 부담·수익화 난이도. 배경은 메모리 polem-rebuild-balance-archive)

- **스키마 교체**: 유저 중심(User/Board/Pin/BlindAnswer 등) → 익명 중심(Issue/Vote 2모델).
  옛 테이블 16개·enum 13개 드롭 전 전체 백업(backups/pre-rebuild-*.json, 로컬).
- **앱 재작성**: 홈/카테고리(/c/[cat])/쟁점상세(/issue/[slug]) + 투표 API. NextAuth·카카오 로그인 제거.
- **익명 투표**: 쿠키(polem_vid)+VOTE_SALT 해시로 1인 1표 dedup, IP 미저장, 변경 불가.
- **콘텐츠**: 시드 8개(사형제·기본소득·정년/전세vs월세·워라밸vs연봉·저축vs투자·파인애플피자·장거리연애).
  AI 발행기 scripts/generate-issue.ts (claude 헤드리스 무과금, 진영 비방 게이트).
- **SEO**: sitemap/robots/OG 메타. 옛 토론 플랫폼 문서는 docs/legacy-debate-platform/로 이관.
- 브랜치 rebuild-balance-archive. 광고 붙일 때 Vercel→CF Pages 이전 필요(Hobby 광고 금지).



Board 승인 `280cc7e3` 후 적용. apex(polem.org) prod TTFB 가 cold function alias 때문에 ~0.96s 였던 문제(www 는 ~0.39s)를 도메인 레벨 301 로 트래픽 집중해서 해소.

### 변경
- Vercel 프로젝트 `polem` 의 `www.polem.org` 도메인에 `redirect=polem.org`, `redirectStatusCode=301` 설정. 앱 코드 변경 0. Cloudflare DNS 변경 0.
- 결정 방향 (A) www→apex: `NEXTAUTH_URL`·Kakao 콜백·`metadataBase` 가 이미 apex 기준이라 auth 변경 없음.

### 검증
- `curl https://www.polem.org` → 301, `Location: https://polem.org/`, `num_redirects=1` (무한 루프 없음).
- apex TTFB 0.96s → **0.36s** (목표 <0.6s 달성).
- `/api/auth/providers`·`/api/auth/csrf` apex 200, TTFB 65–79ms.
- 헬스체크 probe 기본 대상은 그대로 apex (`scripts/healthcheck-fallback.ts:85`) — 이제 warm.

## 2026-05-27 — 헬스체크 routine-down 폴백 (launchd dead-man's-switch) [POL-209]

시간별 헬스체크 routine 이 11일간(2026-05-16~05-27) 조용히 멈췄던 사건(POL-194)의 재발 방지.
Paperclip 스케줄러/어댑터가 죽어도 **독립적으로** polem.org 상태를 확인하는 백스톱.

### 추가
- `scripts/healthcheck-fallback.ts` — routine 과 동일한 4대 점검: ①prod `curl`(200) ②Neon `SELECT 1` ③`launchd/*.log` 최근 1시간 fatal/error ④최신 Vercel prod 배포 상태. **degradation 시에만** P0 인시던트 이슈를 1건 연다(green 이면 완전 무음). 로컬 state + API 검색으로 중복 인시던트 방지(다중 시간 장애 = 인시던트 1건 + 후속 코멘트).
- `launchd/com.polem.healthcheck-fallback.plist` — KST `0 * * * *`(매시 정각, StartCalendarInterval Minute=0). `RunAtLoad=false`(백스톱은 로드 시 발화 안 함). `~/Library/LaunchAgents/` 에 복사·`launchctl load` 완료 → **가동 중**.

### 심각도 정책 (오탐 최소화)
- HARD(P0 발생): prod curl ≠ 200, DB `SELECT 1` 실패 — "사이트가 실제로 살아있나"의 권위 신호.
- WARN(단독으로는 P0 안 띄움): 최신 Vercel prod 배포가 **최근(≤6h)** ERROR/CANCELED, `launchd` 로그 최근 에러. 승격 환경변수: `HEALTHCHECK_VERCEL_IS_HARD=1`, `HEALTHCHECK_LOG_ERRORS_ARE_HARD=1`.

### 자격증명 / 보안
- prod/DB/Vercel 점검은 기존 시크릿(`~/polem/.env`, `~/.secrets/vercel.env`)만 사용 — 신규 시크릿 0.
- 인시던트 발행에만 durable Paperclip 키 필요 → `~/.secrets/polem-healthcheck.env`(600, repo 외부, 절대 커밋 안 함). 비밀-로테이션 렌즈상 키의 **유일한** 위치. **CEO 승인 대기 중(POL-209)** — 미설정 상태에서도 degradation 시 로컬 경보(`launchd/healthcheck-fallback.log` + 비정상 종료)는 동작.
- 로그 로테이션: 스크립트가 자체 로그를 ~1MB 에서 회전(`.1` 1세대). `launchd/*.log` 는 gitignore.

### 검증
- green 무음(exit 0), 강제 DB/prod 실패 → HARD 탐지 + 정확한 P0 페이로드(dry-run), 라이브 인시던트 생성·중복방지 경로(run-JWT 로 POL-228 생성→검증), launchd 경유 1회 실행 무음 확인, `tsc --noEmit` clean.

## 2026-05-14 — 헌법 정리 + "AI 의견정리" 명칭 통일 + 모바일 시간순 단일 컬럼

### 헌법 (CLAUDE.md §2)
- §2.1 "AI 양측 요약은 *반드시 50:50 비율로 동등하게*" 조항 폐기. AI 는 *게시판에 있는 그대로* 정리 (다수쪽이 많으면 많은 대로, 적으면 적은 대로)
- §2.4 "진영 색 회피" 절 전체 삭제. 흑백 디자인은 컴포넌트 결정으로만 유지, 헌법에서 광고하지 않음
- §2.2 예외 (`aiCitationCount`) 의 "50:50 균형" 표현 정리 — "한 작가당 1개 + 서로 다른 논점" 만 남김
- §2.5 4 대 함정 회피 → §2.4 로 번호 재정렬

### AI 동작 변경
- `lib/ai/prompts.ts` `BOARD_SUMMARY_SYSTEM` 프롬프트 재작성 — 50:50 강제 X, 있는 그대로 요약. 한쪽이 비면 빈 문자열
- `scripts/ai-summary-worker.ts` `buildPrompt` 동일하게 갱신. 다음 cron 부터 새 동작 (09:00 / 21:00 KST)

### UI 명칭 통일 — "AI 의견정리"
- "AI 요약" / "AI 내용정리" / "AI 50:50 요약" / "찬성·반대 요약" → 전부 "AI 의견정리" / "찬성 의견정리" / "반대 의견정리"
- 영향: `components/board/SummaryCards.tsx`, `SummaryRefreshButton.tsx`, `app/me/page.tsx`, `app/u/[nickname]/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/policy/page.tsx`
- DB 컬럼(`aiSummaryPro/Con/At`), API 경로(`/cron/ai-summary`), import 경로(`@/lib/ai-summary`) 는 그대로 유지

### 주석·문서 정리
- `components/ui/Gauge.tsx`, `prisma/seed.ts`, `lib/moderation/profanity.ts`, `lib/ai/providers/claude-cli.ts`, `prisma/analytics_views.README.md` — 헌법 §2.4 / 50:50 참조 제거
- `README.md`, `MAPPING.md` — 헌법 요약 5→4, "50:50 요약" → "AI 의견정리"

### 모바일 레이아웃
- `BoardClient.tsx` 통상 모드 모바일에서 찬/반 위·아래 스택 대신 *시간순 단일 컬럼* 으로 머지 (`MobileMergedList`). 카드 배경(흰/베이지)·도트로 진영 구분은 유지
- 데스크탑(md+) 과 트리 모드는 기존 좌우 2분할 유지

## 2026-05-14 — 반대 카드 배경 라이트 톤 통일

- 어두운 `bg-dark` 배경이 반대 의견을 부정적으로 보이게 하고 가독성을 떨어뜨려, 찬·반 카드 모두 종이톤으로 통일.
- 찬성: `bg-card`(#fff) / 반대: `bg-paper-cream`(#F5F1E8) — 둘 다 `text-ink` + 검정 보더.
- 진영 구분은 도트(찬성=베이지+검정보더, 반대=검정 채움)·보더·라벨로 유지. 헌법 2.4(흑백, 진영색 회피) 준수.
- 영향 파일: `components/board/Pin.tsx`, `components/board/SummaryCards.tsx`, `app/boards/[id]/BoardClient.tsx` (Connector).
- OG 이미지 비율 막대는 데이터 시각화이므로 그대로 둠.

## 2026-05-09 — Phase 8~13 (Sprint 3, Phase 12 보류)

### Phase 8 모더레이션 + 신고
- `lib/moderation/profanity.ts` — 한국어 비속어/혐오 정규식 + 광고 도배 휴리스틱
- 박제·댓글 작성 API 진입 시 자동 차단 (422 + 안내 메시지)
- `POST /api/reports` — Pin/Comment/User 대상 신고 (5사유), 24h 이내 동일 대상 중복 차단
- `components/board/ReportModal.tsx` + Pin 카드의 ⋯ 트리거
- `/notifications` + `POST /api/me/notifications` 모두 읽음 처리

### Phase 9 관리자 패널 풀
- `PATCH /api/admin/reports/[id]` — resolve(WARN/SUSPEND_7D/BAN, hideContent) / dismiss. 위반자 식별 → 차단 단계 적용 + Notification, 신고자에게도 결과 알림
- `/admin/reports` — PENDING 큐. 박제 본문 인용·신고 사유 표시·4가지 액션 버튼
- `/admin` 대시보드 — 신고 처리 대기·정지 사용자 카운트 추가
- `lib/session.isSuspended()` — suspendedUntil 통과 자동 해제 헬퍼

### Phase 10 AI 50:50 요약 cron
- `lib/ai/summarize-board.ts` — claude -p 헤드리스로 양측 한 줄씩 (헌법 §2.1 길이 균형)
- `scripts/summarize-boards.ts` — 24시간 이상 묵은 활성 게시판 5개씩, lock 파일
- `launchd/org.polem.summary.plist` — 매일 09:00, 21:00 KST

### Phase 11 약관·정책·법적 페이지
- `/terms` 이용약관 — 영구 보관 명시·금지 행위·차단 단계·임시조치
- `/privacy` 개인정보처리방침 — 수집 항목 최소화·AI 처리 위탁 명시·6개월 로그 보관
- `/policy` 운영정책 — 격렬한 논리 vs 욕설/인신공격 분리, 정보통신망법 §44조의2 임시조치, 선거 기간 강화
- `components/legal/LegalLayout.tsx` + globals.css `.legal-prose`

### Phase 12 (Meilisearch) 보류
- 명세대로 사용자 5천+ 시점에 도입. 현재 PostgreSQL ILIKE 검색 유지

### Phase 13 SEO·OG·sitemap·robots·analytics
- `app/sitemap.ts` — / + 게시판들 (5000개 한도, 1시간 캐시)
- `app/robots.ts` — 색인 허용/차단 명시 (api/admin/onboarding/me 등 차단)
- 게시판 페이지 generateMetadata — AI 50:50 요약 description + OG type article
- `@vercel/analytics` 통합 (cookieless, 개인정보 영향 X)

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
