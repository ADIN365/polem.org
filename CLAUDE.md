# 폴렘 (polem.org) — 찬반 근거 아카이브 + 익명 투표

> 2026-07-24 피벗. 이전엔 "끝장토론"이라는 로그인 기반 정치 토론 UGC 플랫폼이었으나,
> 트래픽 콜드스타트·모더레이션 부담·수익화 난이도로 **무인 운영 가능한 콘텐츠 사이트**로
> 전환. 옛 플랫폼 문서는 `docs/legacy-debate-platform/` (MAPPING.md, polem.html) 참조.

## 1. 정체성

- **이름:** 폴렘 · **도메인:** polem.org
- **한 줄:** 하나의 쟁점을 두고 찬성·반대 양측 근거를 균형 있게 정리 + 익명 투표 + 전체 분포 공개
- **차별화:** 판정하지 않는다(양측 대등). 로그인 없이 클릭 한 번 투표. "내 선택 vs 전체 분포"가 공유 훅.
- **주제 범위:** 사회쟁점(사형제·기본소득·정년) + 일상 밸런스(전세vs월세·워라밸vs연봉·취향). **특정 정당·후보 지지/비방 금지** (선거법·명예훼손 리스크 회피).
- **수익 모델:** 트래픽 붙으면 애드센스 (정치 당파 콘텐츠 배제로 광고 적격성 유지). 고단가 제휴는 없음.

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) + TypeScript |
| DB | Neon PostgreSQL + Prisma (로그인 없음, 익명 쿠키 투표) |
| 스타일 | Tailwind + CSS Variables (종이·신문 톤, `app/globals.css`) |
| AI 발행 | claude 헤드리스(무과금) — `scripts/generate-issue.ts` |
| 호스팅(현재) | Vercel |
| 호스팅(광고 붙일 때) | **Cloudflare Pages로 이전 필수** — Vercel Hobby는 광고 금지(Fair Use). Neon DB는 그대로 |

## 3. 구조

```
prisma/schema.prisma        # Issue, Vote (+ Category/IssueStatus enum)
prisma/seed-issues.ts       # 시드 8개 (사회+밸런스 혼합), npm run db:seed
lib/categories.ts           # 5개 카테고리 메타 (SOCIETY/MONEY/WORK/LOVE/LIFE)
lib/issues.ts               # 모든 Issue 조회 (홈/카테고리/상세/sitemap)
lib/anon.ts                 # 익명 투표자 해시 (쿠키 polem_vid + VOTE_SALT, IP 저장 안 함)
app/page.tsx                # 홈 (뜨거운 쟁점 + 최신)
app/c/[category]/page.tsx   # 카테고리 목록
app/issue/[slug]/page.tsx   # 쟁점 상세 (투표 위젯 + 좌우 찬반 근거 + 균형 요약)
app/api/vote/route.ts       # 투표 POST (쿠키 dedup, 변경 불가)
components/VoteBox.tsx       # 클라 투표 위젯 (투표 후 결과+공유)
components/ResultBar.tsx     # 분포 막대 · IssueCard.tsx · TopNav/Footer
scripts/generate-issue.ts   # AI 쟁점 생성: npm run gen:issue -- "주제" CATEGORY
```

## 4. 데이터 모델

- **Issue**: slug, title(SEO), question(투표질문), summary, body(배경), category, proLabel/conLabel, proArgs/conArgs(Json string[]), aiBalance(균형요약), proVotes/conVotes/viewCount 캐시, status
- **Vote**: issueId, side("PRO"|"CON"), voterHash(익명), `@@unique([issueId, voterHash])` — 1인 1표, 변경 불가(분포 오염 방지)

## 5. 발행 (AI)

```bash
npm run gen:issue -- "정년 70세 연장" SOCIETY
npm run gen:issue -- "아침형 vs 저녁형" LIFE
```
- claude 헤드리스가 각 측 근거 4개 + 균형 요약 생성 → 금지어(진영 비방) 게이트 → DB upsert
- 자동화(cron/launchd) 미등록 — 트래픽 검증(아래 손절 기준) 후 결정

## 6. 배포 (현재 Vercel — git 연동)

```bash
DATABASE_URL 은 .env / Vercel 환경변수. VOTE_SALT 도 프로덕션 시크릿으로 설정 필요.
git push → Vercel 자동 빌드
```
- **광고 붙이는 순간 CF Pages 이전 필요** (Vercel Hobby 광고 금지). next-on-pages 경로는 zoz-ai에서 검증됨.

## 7. 운영 원칙 / 손절 기준

- **판정 금지**: 근거 정리는 양측 대등. UI에 "어느 쪽이 옳다" 카피 금지.
- **당파 배제**: 특정 정당·정치인 소재 지양. 쟁점의 '정책·가치' 층위로만.
- **손절 기준 (12주)**: 발행 지속 후 GSC 주간 클릭이 두 자릿수도 안 되면 발행 중단·방치(zoz-ai B 모드와 동일). 바이럴/검색 어느 쪽도 안 터지면 미련 없이.

## 8. 기록

- 배경·전략: Claude 메모리 `polem-rebuild-balance-archive`
- 옛 데이터 백업: `backups/pre-rebuild-*.json` (gitignore, 로컬 보존)
- 변경 이력: CHANGELOG.md
