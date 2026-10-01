# polem.org (폴렘) — ARCHITECTURE


## 운영 메모 (전역 CLAUDE.md 에서 이관, 2026-10-01)

> 아래는 `~/.claude/CLAUDE.md` 프로젝트 표에 있던 설명을 그대로 옮긴 것이다. 전역 표에는 한두 줄 요약만 남는다.

**polem.org (폴렘)** — **2026-07-24 피벗**: 정치토론 UGC→쟁점별 찬반근거 아카이브+익명 투표+분포공개(무인 운영). Issue+Vote 2모델(로그인 없음, 쿠키 dedup). Next.js 14 + Prisma + Neon + Vercel. 사회쟁점+일상밸런스, 당파 배제. AI 발행기(claude 헤드리스). 광고 붙이면 CF Pages 이전 필수. 옛 토론 플랫폼은 docs/legacy-debate-platform/. 상세는 메모리 polem-rebuild-balance-archive

## 메모리에서 이관 (2026-10-01)

> 아래 Paperclip 관련 기록은 2026-05 시기(옛 토론 플랫폼 + Paperclip 에이전트 운영, POL-nnn 이슈)의 것이다. 2026-07-24 피벗 이후 옛 워처 5개가 unload 되었으므로 현재도 유효한지 쓰기 전에 확인할 것. 사실 자체는 원문 그대로 보존한다.
> 2026-10-01 점검 결과: Paperclip 은 `~/.paperclip` 마지막 갱신 2026-05-11 이후 구동 프로세스 없음, `launchctl list` 에 polem 항목 0건(`~/Library/LaunchAgents` 에도 없음), polem 플리스트 5개는 전부 `launchd-disabled/` 에 있다 → **Paperclip·POL-* 체계는 무효**(과거 기록). 현재 스키마는 Issue·Comment·Vote(`prisma/schema.prisma`), 앱 라우트는 `app/{c,issue,about,privacy,terms,api}`. 절별 판정: apex cold-start = 유효(현상 재확인), 배포 승인 문턱 = 낡음, 헬스체크 루틴 = 낡음, 자격증명 = 일부 유효, Paperclip API 요령 = 낡음.

### polem.org apex cold-start 와 canonical 정리 (2026-05-12 ~ 05-28)
- **(2026-10-01 점검: 유효. `www.polem.org` → 301 → `https://polem.org/` 그대로, apex 200 TTFB 0.57s, `app/layout.tsx` 에 `metadataBase`·`alternates.canonical` 있음. 단 POL-* 번호·PR/Board 승인 절차 서술은 Paperclip 시절 맥락이라 무효. Vercel 도메인 레벨 301 해법은 피벗 후에도 적용 중)**
- polem.org(apex)는 TTFB ~1.5-2.1s, www.polem.org 는 ~0.4-0.6s. 연결 시간은 둘 다 ~10ms, 둘 다 200 직접 응답(리다이렉트 체인 없음). 차이는 TTFB 뿐 — 같은 코드, Vercel 함수 온기만 다름.
- **Why:** apex 는 자체 Vercel 함수 alias 라 트래픽이 적어 인스턴스가 계속 식는다. www 는 시간별 헬스 프로브(POL-16)와 실사용자가 쓰는 데워진 alias. 매시 헬스체크가 apex 콜드를 잡았다.
- 상태(2026-05-28): 앱 레벨 canonical(`metadataBase=apex` + `alternates.canonical`)은 PR #1 / POL-18 로 들어갔고(prod 병합은 POL-281 로 게이트, 2026-05-27 병합), 성능용 리다이렉트는 **POL-280 으로 분리** — Vercel 도메인 레벨 301 + NextAuth/Kakao 콜백 변경이라 Board 승인 사안이지 코드 PR 이 아니다. **리다이렉트를 다시 코드 PR 에 섞지 말 것.**
- **해결(2026-05-28, POL-280):** Board 승인 `280cc7e3` 로 (A) www→apex 301 을 Vercel 프로젝트 도메인 레벨에서 적용(`PATCH /v9/projects/polem/domains/www.polem.org` + `redirect=polem.org, redirectStatusCode=301`). 결과: www → 단일 301 → apex, apex TTFB **0.36s**(전 0.96s), 인증 엔드포인트 65–79ms, 앱 코드 변경 없음, Cloudflare DNS 건드리지 않음. «www 가 데워져 있으니 www 로 리다이렉트» 직관은 틀렸다 — 온기는 alias 이름이 아니라 트래픽을 따라가므로 apex 로 합치자 apex 가 데워졌다.
- How to apply: canonical 하나(www 또는 apex)를 정하고 다른 쪽은 앱이 아니라 Vercel 도메인 레벨에서 301(콜드 함수가 깨어날 일이 없게). 사용자가 직접 도메인 입력 시 느리다고 하면 원인은 이것이고 해법은 코드 최적화가 아니라 같은 canonical 정리.
- 샘플 TTFB: 17:31 KST 2.03s, 18:33 1.16s, 20:20 2.07s, 21:21 1.91s, 22:23 1.95s. 리다이렉트 없는 프로브: apex starttransfer 1.85s vs www 0.36s (2026-05-12 22:23 KST).
- 원문이 가리킨 `[[polem-health-tracker]]`(POL-16 시간별 OK 로그)는 존재하지 않는 메모리 링크였음(2026-10-01 재확인: 현재 메모리 디렉터리에도 없음 — 해소, 더 추적할 것 없음).

### 배포 승인 문턱 (POL-281, CEO 판정 2026-05-27)
- **(2026-07-24 피벗 이후 무효: CEO·TechLead·Board 카드는 Paperclip 에이전트 체계의 역할이고 그 체계가 2026-05-11 이후 구동되지 않는다. 지금 배포 승인은 사용자 직접 승인(전역 «배포 전 명시 승인» 원칙). «저위험=추가만·빌드 검증·롤백 경로, 고위험=도메인·인증·스키마» 구분 기준만 참고용)**
- 저위험 prod 배포에는 `request_confirmation` Board 카드가 **필요 없다**. 저위험 = 추가(additive)만, route/Prisma 스키마/마이그레이션/Kakao-OAuth 변경 없음, 빌드 검증 완료(`prisma generate`/`tsc`/`next build` 통과), 롤백 경로 존재. 이런 건 **CEO 코멘트 go-signal** 로 나간다. 에이전트가 할 수 있는 일을 사람에게 넘기는 Board 카드는 규칙 #1 위반.
- Board(사람) 게이트는 고위험·비가역·지출·외부 계정·도메인·인증 변경에만 — 예: apex 301 + NextAuth 콜백(POL-280)은 Board 게이트가 맞다.
- Why: TechLead 가 POL-281(SEO 메타 + 읽기 전용 검색 API)을 Board 카드로 과잉 게이팅했고, CEO 가 코멘트로 뒤집으며 문턱을 바로잡았다.
- How to apply: TechLead 로서 추가·검증된 polem 배포는 CEO 코멘트 승인을 받는다. 실행 순서: go-signal 후 merge → Vercel prod Ready 모니터 → meta/JSON-LD/sitemap + API curl 검증 → 회귀 시 `vercel rollback` → `done` 처리.

### 시간별 헬스체크 루틴 (POL-16 → 루틴 12b5362b, 2026-05-17)
- **(2026-07-24 피벗 이후 무효: Paperclip 루틴·`skip_if_active` 재밍·POL-209 의 launchd 백스톱 `com.polem.healthcheck-fallback` 모두 `launchd-disabled/` 로 옮겨져 미등록. `healthcheck-fallback.ts` 는 `scripts/` 에 없다(스크립트는 `check_polem_recovery.sh`·`generate-issue.ts` 뿐). 지금 polem 에는 주기 헬스체크가 없다 — 필요하면 새로 설계)**
- 시간별 polem.org 헬스체크는 상시 `in_progress` 트래커(POL-16)에서 Paperclip 루틴으로 2026-05-17 KST 에 전환(POL-188, Board 오버라이드). 루틴 `Hourly polem.org health check` id `12b5362b-d9aa-48e9-9e90-d92eebcb25c2` — cron `0 * * * *` Asia/Seoul, `skip_if_active`, `skip_missed`.
- POL-16 은 `cancelled`. **새 OK 코멘트를 달지 말 것.** 과거 OK 17건은 아카이브로만 보존.
- cron 틱마다 TechLead 에게 배정된 새 실행 이슈가 생긴다. 하트비트: checkout → 헬스체크 4개(curl polem.org, Neon `select 1`, launchd 에러 스캔, `vercel ls polem --prod`) → OK/DEGRADED/INCIDENT 코멘트 → 한 하트비트 안에 `done`.
- AGENTS.md 는 2026-05-17 시점에 아직 옛 POL-16 패턴을 서술 — [POL-190](/POL/issues/POL-190) 이 문서 갱신 추적.
- **Why:** 상시 `in_progress` 트래커는 6시간마다 `long_active_duration` 생산성 리뷰가 다시 터진다(POL-29/45/187 순환). 루틴 모델은 실행당 5분 미만이라 그 트리거가 못 발동한다.
- How to apply: 범위 이슈 없이 깨어나 «시간별 헬스체크» 본능이 들면 POL-16 에 코멘트하지 말 것. 이후 주기 모니터링도 루틴이 기본, 상시 `in_progress` 트래커 재도입 금지. 루틴이 24시간 넘게 새 실행 이슈를 안 만들면 조용한 실패이니 POL-16 에 덧붙이지 말고 incident 이슈를 연다.
- **`skip_if_active` 재밍 — 2026-05-27 관측(공백 2026-05-16→27):** 비종료 실행 이슈 하나가 루틴 전체를 조용히 막는다. POL-194 의 실행이 2026-05-16 에 침묵(서버/맥미니 불안정), 워치독 연쇄(POL-196→198→200, CEO 배정)가 POL-194 를 영구 `blocked` 로 둬서 `skip_if_active` 가 11일간 매 시간 틱을 `skipped` 처리했고 경보도 없었다. 해결: POL-194 의 stale blocker 제거(`PATCH blockedByIssueIds:[]`) → checkout → `done` 닫기 → 수동 루틴 실행(`POST /api/routines/{id}/run`)이 `issue_created`(skipped 아님)를 반환하면 재밍 해소 확인. 진단: `GET /api/routines/{id}/runs` 에서 반복 `status:skipped` 가 전부 비종료 이슈에 연결된 한 실행으로 `coalescedInto` 되면 이 재밍. CEO 소유 `Review silent active run` 워치독 이슈(assignee 813cf739)는 blocker 링크는 지울 수 있지만 `PATCH status` 는 403 — 닫지 말고 에스컬레이션.
- 영구 완화책은 [POL-209](/POL/issues/POL-209): 루틴과 독립적으로 4개 점검을 돌리고 저하 시에만 incident 를 여는 launchd dead-man's-switch(`scripts/healthcheck-fallback.ts` + plist). 하트비트 아닌 컨텍스트의 영구 API 자격증명에 대해 CEO 설계 질문이 열려 있음.

### 운영 자격증명 현실 (POL-18 SEO 체인, 2026-05-27 검증)
- **(2026-10-01 재검증: Cloudflare 토큰은 `/user/tokens/verify` 가 active 로 응답 = 유효. GSC 는 아래 «확인 필요» 항목대로 해소. 네이버 건은 확인불가(콘솔 소유자 로그인 사안이라 코드로 재검증 못 함, 상태 불변으로 간주). «POL-32·TechLead» 맥락만 무효)**
- **Cloudflare API 토큰** `~/.secrets/cloudflare.env`(`CLOUDFLARE_API_TOKEN`)는 **활성**이며 `polem.org` zone(id `b85c5d15…`)을 관리한다. TechLead 가 사람 없이 API 로 DNS 레코드(도메인 인증용 TXT 포함)를 추가/삭제할 수 있다 → POL-32(GSC) 등 SEO 티켓의 «CEO/Board 가 DNS TXT 추가» 단계는 자동화 가능하고, 사람은 인증 토큰만 주면 된다.
- **GSC OAuth** `~/.secrets/best10-gsc`·`~/.secrets/webhardrank-gsc`(credentials.json+token.json)는 scope `webmasters.readonly` **뿐**이고 refresh token 이 **만료/폐기**(갱신 → HTTP 400, Testing 모드 7일 만료). polem 사이트 인증·사이트맵 제출 불가 — `siteverification`/`webmasters` scope 로 사람이 새로 동의해야 한다. `polem-gsc` 디렉터리는 없음.
- **polem.env** 의 `NAVER_CLIENT_ID/SECRET` 은 로그인 OAuth 전용이며 검색광고/서치어드바이저 API 키가 아님. 네이버 서치어드바이저 인증(HTML 파일/메타 태그)과 X 계정 생성은 사람 소유자의 콘솔 로그인이 필요 — Cloudflare 로 해결 안 됨.
- 결론: POL-18 체인에서 에이전트가 할 수 있는 건 DNS 단계뿐이고, 콘솔 소유권 인증(GSC/Naver/Bing)과 X 계정은 전부 사람 계정 로그인이 필요하다.
- (2026-10-01 확인 완료 — 해소: `~/.secrets/webhardrank-gsc/token.json` 의 scope 는 이제 `webmasters`+`siteverification`, mtime 오늘 11:00 = 자동 갱신 중이라 위 «readonly 뿐·만료» 서술은 낡음. `polem-gsc` 디렉터리는 여전히 없음 — 공용 토큰 1벌을 쓴다.)

### Paperclip API 요령 (2026-05)
- **(2026-07-24 피벗 이후 무효: Paperclip 서버 미구동(2026-05-11 이후 활동 없음), 아래 API·에이전트 규칙은 Paperclip 을 다시 켤 때만 참고)**
- **comment 필드:** `POST /api/issues/{id}/comments` 는 텍스트를 **`body`** 로 받는다(`comment` 아님; 틀리면 `{"error":"Validation error", path:["body"], "Required"}`). `PATCH /api/issues/{id}` 의 선택 코멘트는 **`comment`**. curl 은 HTTP 400 에도 exit 0 이라 `&& echo posted` 는 거짓말 — 응답 JSON 에서 `id`/`error` 를 파싱할 것. 마크다운 줄바꿈 보존하려면 `jq -Rs '{body: .}' file.md`. 다른 소유자의 활성 run 이 있는 이슈에 코멘트하면 `"Issue run ownership conflict"`(예: 활성 run 이 있던 POL-209) — 메모는 다른 곳에 남기고 링크.
- **in_progress 로 이슈 생성 시 잠김(2026-05-27, POL-278):** `POST /api/companies/{id}/issues` 에 `status:"in_progress"` + `assigneeAgentId: self` 를 주면 별도 실행 run 이 자동 생성돼 소유권을 가져간다. 생성한 run 에서 PATCH/코멘트는 **"Issue run ownership conflict"**, checkout/release 는 **"Issue checkout conflict"** — `GET` 은 `activeRun: null`(대기 중)인데도. Why: in_progress+assignee 조합이 «지금 실행 시작» 신호라 Paperclip 이 run 을 큐에 넣고 그 run 이 락을 쥔다. How: 같은 run 안에서 만들고 마무리할 이슈(감사/인시던트 기록 등)는 `status:"todo"`(또는 backlog)로 만든 뒤 checkout → 작업 → PATCH done. 생성 시 `in_progress` 는 *미래* 하트비트가 집어갈 일에만.
- **남의 이슈에서 @멘션(wake `PAPERCLIP_WAKE_REASON=issue_comment_mentioned`):** 다른 에이전트에 배정된 이슈에는 내 코멘트가 403(`Agent cannot mutate another agent's issue`) — 정상 동작이지 버그가 아니다. Why: 단일 담당자만 변경 가능, 멘션 ≠ 위임. 스킬 규칙: 코멘트가 명시적으로 맡으라고 할 때만 self-assign(checkout), 아니면 필요 시 코멘트로 응답하고 내 일 계속. How: 미래형 멘션(«X 끝난 뒤 넘기겠다»)은 하트비트 trace 에서 확인만 하고 코멘트하려고 self-assign 하지 않는다 / 행동 멘션(«@TechLead 지금 X 해줘»)은 checkout 후 실행 / 남의 이슈에 영속 정보를 남겨야 하면 내가 소유한 관련 이슈(부모 등)에 쓰거나 소유자가 자기 하트비트에서 중계하도록 요청 / 외부 입력(Board 수동 작업 등) 대기 중인 이슈에는 중복 «대기 중» 코멘트를 달지 않는다. 계기: POL-36(X 계정 생성) — CEO 가 Board 가 Vercel env 에 토큰을 등록한 뒤 넘기겠다고 멘션, 대기 코멘트는 API 가 정당하게 차단.
- **에이전트 코멘트 재기상 루프:** 에이전트 run 이 `x-paperclip-agent-id` 로 `/api/issues/{id}/comments` 에 POST 하면 응답이 `authorType:"user"`, `authorUserId:"local-board"`, `authorAgentId:null` 로 나오고, 하네스가 이를 Board 코멘트로 보고 같은 이슈에 `issue_commented` wake 를 같은 에이전트에 다시 쏜다(이후 PATCH 로 `done` 해도). `PATCH /api/issues/{id}` 의 `comment` 필드도 local-board 로 기록된다. 시간별 헬스체크 영향: ① «all green» 코멘트 → 이슈가 `in_progress` 로 재오픈 ② `done` PATCH ③ wake delta 에 내가 쓴 OK 코멘트가 «새 것» 으로 도착(continuation 의 latest comment id 가 방금 POST 한 것과 같음) ④ 코멘트를 또 달며 재실행/재마킹하면 루프 지속. How: resume wake 의 «새» 코멘트가 지난 하트비트에 내가 쓴 것(POST 응답 id 와 동일)뿐이면 헬스체크를 다시 돌리지 말고 상태만 확인, 필요 시 `done` 한 번 하고 종료 / 닫힌 이슈의 상태만 고칠 땐 `comment` 없이 `PATCH {"status":"done"}` / 시간별 cron 은 틱마다 새 이슈를 만들므로(위 루틴 절) 이 루프는 한 틱 안에서만 문제. API 귀속 특성일 뿐 손상 아님 — `authorAgentId` 나 다른 헤더로 에이전트 작성으로 표시되는지 탐색할 가치는 있으나 그때까지는 에코를 감안해 계획.
