# naver-blog-bot — polem.org 백링크 모듈 적용 가이드

> Tier 1 첫 분기. POL-20 가이드 §1.1 + POL-39 산출물.
> 적용 대상 repo: `~/naver-blog-bot` (Board 가 별도 PC 에서 처리).
> Source of truth 매처: 이 폴더의 `matcher.ts` (vendor copy).

---

## 0. 한눈에 보기

- 발행 직전 후크에서 글 본문 + 제목을 `findBoardMatches` 에 넘긴다.
- 가장 점수 높은 polem 의제 1건이 임계치를 넘으면 본문 *마지막* 에 인용 블록 1줄을 덧붙인다.
- 카테고리가 `politics` 또는 `policy` 가 아니면 삽입하지 않는다.
- 1글 1링크. 발행 주차 전체에서 폴렘 백링크 글 비율 ≤ 30%.
- `POLEM_ELECTION_FREEZE=1` 켜져 있을 때는 `politics` 카테고리 결과가 자동으로 빠진다 (matcher 가 처리).

---

## 1. 파일 복사

폴렘 레포의 `docs/polem-backlink/matcher.ts` 를 naver-blog-bot 의 `lib/polem-matcher.ts` 로 그대로 복사한다.

```bash
# in ~/naver-blog-bot
cp ~/polem/docs/polem-backlink/matcher.ts lib/polem-matcher.ts
```

> 절대 두 곳에서 따로 수정하지 않는다. 변경이 필요하면 polem 레포 `matcher.ts` 를 먼저 PR → 머지 후 다시 복사. naver-blog-bot 의 `lib/polem-matcher.ts` 첫 줄에 `// vendor-copy of polem-backlink/matcher.ts — do not edit, re-copy from upstream` 주석을 유지.

`tsx` 또는 ts-node 가 있으면 추가 의존성 없음. 매처는 `globalThis.fetch` 만 사용한다 (Node 18+ 내장).

---

## 2. 발행 후크 통합

naver-blog-bot 의 본문 생성 → 발행 큐 진입 사이에 `applyPolemBacklink(post)` 한 줄을 끼운다.

```ts
// lib/polem-backlink.ts (naver-blog-bot 내부 신규)
import { findBoardMatches, type BoardMatch } from "./polem-matcher";

const TIER1_MIN_SCORE = 0.65;
const NAVER_GATE_CATEGORIES = ["politics", "policy"] as const;

export type DraftPost = {
  title: string;
  body: string;            // 마크다운 본문 (발행 전 최종본)
  category: string;        // naver-blog-bot 자체 카테고리. "정치"|"정책"|"기타" 등
  polem_board_id?: string; // 매처가 채워 넣는 측정용 필드
};

export async function applyPolemBacklink(post: DraftPost): Promise<DraftPost> {
  // 게이트 1: naver-blog-bot 자체 카테고리가 정치/정책 일 때만 매칭 시도
  if (!isPoliticsOrPolicy(post.category)) return post;

  // 게이트 2: 주차 비율 ≤ 30%. 초과면 매칭 자체를 건너뜀.
  if (await weeklyBacklinkRatio() >= 0.30) return post;

  let matches: BoardMatch[] = [];
  try {
    matches = await findBoardMatches(`${post.title}\n${post.body}`, {
      minScore: TIER1_MIN_SCORE,
      categories: [...NAVER_GATE_CATEGORIES],
      limit: 1,
    });
  } catch {
    // matcher 는 throw 하지 않지만 import 자체 실패 같은 케이스 방어
    return post;
  }
  if (matches.length === 0) return post;

  const m = matches[0];
  return {
    ...post,
    body: post.body.trimEnd() + "\n\n" + renderBlock(m),
    polem_board_id: m.boardId,
  };
}

function renderBlock(m: BoardMatch): string {
  // POL-20 §1.1 톤 예시 그대로. 호객성 카피 금지.
  return `> 같은 사안의 찬·반 정리는 [polem.org 토론](${m.url}) 에 누적되어 있다.`;
}

function isPoliticsOrPolicy(c: string): boolean {
  return c === "정치" || c === "정책";
}

async function weeklyBacklinkRatio(): Promise<number> {
  // 발행 DB 에서 이번 주 (월~일) 발행된 글 중 polem_board_id IS NOT NULL 비율.
  // naver-blog-bot 의 DB 어댑터로 한 줄 쿼리 — 아래는 SQL 예시.
  // SELECT
  //   AVG(CASE WHEN polem_board_id IS NOT NULL THEN 1.0 ELSE 0 END)
  // FROM posts
  // WHERE published_at >= date_trunc('week', now());
  return 0;
}
```

발행 큐 코드에서:

```ts
import { applyPolemBacklink } from "./lib/polem-backlink";

const finalPost = await applyPolemBacklink(draftPost);
await publishToNaver(finalPost);
await persistPost(finalPost); // polem_board_id 도 같이 저장
```

---

## 3. DB 스키마 변경 (1줄)

발행 로그 테이블에 `polem_board_id` 컬럼 추가 (측정·중복 매칭 회피용).

```sql
ALTER TABLE posts
  ADD COLUMN polem_board_id text NULL;

CREATE INDEX IF NOT EXISTS posts_polem_board_id_idx
  ON posts(polem_board_id)
  WHERE polem_board_id IS NOT NULL;
```

목적:

- 어떤 발행 글이 어떤 polem 의제와 연결됐는지 추적 (POL-20 §5 측정 항목).
- 같은 의제로 한 주 안에 여러 글 반복 백링크되는 것을 추후 자동 차단할 수 있음 (선택).

---

## 4. 환경변수

`.env` (naver-blog-bot) 에 추가:

```env
# 선거 기간(D-23 ~ D-day) 정치 카테고리 백링크 자동 일시중단.
# matcher 가 자동으로 politics 카테고리 결과를 필터. CEO 가 켜고/끄기.
POLEM_ELECTION_FREEZE=0
```

POL-18 의 X publisher 와 같은 환경변수 이름을 의도적으로 공유한다 (cron 자동화는 두지 않고 CEO 토글).

---

## 5. 톤 / 카피 규칙 (절대 변경 금지)

POL-20 가이드 §1.1 의 톤 예시 외에는 자유 변형하지 않는다. 사용 금지 패턴:

- ❌ `polem.org 가서 토론하자!` (호객)
- ❌ `polem.org 에서 더 보기 ➜` (CTA 화살표/이모지)
- ❌ 진영 색 (빨강·파랑) 인용 블록 스타일 — 네이버 블로그 디자인 토큰은 흑백 유지.

허용 변형 (필요 시 1줄 변형):

- ✅ `> 같은 사안의 찬·반 정리는 [polem.org 토론]() 에 누적되어 있다.`
- ✅ `> 이 주제 관련 시민 토론은 [polem.org]() 에서 좌우 양측으로 정리 중.`

---

## 6. Acceptance (Board 자기 검증)

`~/naver-blog-bot` 에 적용 완료하면 다음 4가지로 본인 확인:

- [ ] `lib/polem-matcher.ts` 가 polem 레포 `matcher.ts` 와 바이트 동일 (`diff` 확인)
- [ ] 정치 카테고리 글 1편 dry-run → 본문 마지막에 인용 블록 1줄 추가됨, `polem_board_id` 채워짐
- [ ] 정치 외 카테고리 글 1편 dry-run → 매처 호출되지 않거나 빈 결과로 본문 변화 없음
- [ ] `POLEM_ELECTION_FREEZE=1` 켠 채 정치 글 dry-run → 백링크 *삽입되지 않음*

검증 끝나면 POL-39 코멘트에 "naver-blog-bot 적용 완료" + 처음 7일치 발행 로그의 백링크 비율을 적어 회신.

---

## 7. 다음 봇 핸드오프

같은 매처 (`docs/polem-backlink/matcher.ts`) 를 `wordpress-blog-bot` 에 적용. 차이점만:

- 삽입 위치: WordPress 발행 글 끝 *참고 출처* 섹션의 `<li>` (인용 블록 X)
- 카테고리 게이트: `["policy"]` 만. 정치 의제는 wordpress 색에서 빠지는 게 안전.
- rel 속성: `external noopener` (nofollow 는 붙이지 않음 — 자기 사이트 신뢰 백링크)

상세는 별도 child 이슈 `[POL-20·W1] wordpress-blog-bot 폴렘 백링크 모듈` 에서 진행.
