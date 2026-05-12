# polem.org 자기 사이트 백링크 삽입 가이드

> POL-20 산출물. 운영 중인 자기 사이트/봇에 polem.org 의제 링크를 **자연스럽게** 삽입하기 위한 사이트별 1줄 계획. 실제 삽입 코드는 각 사이트의 봇/관리자가 별도 child 이슈로 처리.

## 0. 헌법 (절대 위반 금지)

CLAUDE.md §2.5 의 광장 헌법 4 대 함정 그대로 적용:

- **스팸 톤 금지** — `polem.org 가서 토론하자!` 식 호객 X. `같은 사안의 찬·반 정리는 polem.org 토론에서` 같은 자연어로.
- **다중 계정·자동 클릭 금지** — 백링크 → polem.org 로 유입된 사용자가 회원 가입 시 동일 계정이면 의심 시그널 처리.
- **광고 X** — 외부 광고 네트워크에 polem 노출 X. 자기 사이트 본문 안에서만.
- **선거 기간 강화** — 선거 운동 기간 (D-23 ~ D-day) 에는 *특정 후보 / 캠프 관련 의제 URL 백링크 자동 삽입 일시 중단*. 봇에 `electionFreeze` 토글 필요 (POL-18 와 동일 정책).

## 1. Tier 1 — 정치/시사 직결 (즉시 후속 child 이슈 분기)

### `naver-blog-bot` (`~/naver-blog-bot`)

- **어디에 넣을지**: 발행 글 본문 마지막 *`> 관련 토론`* 인용 블록 (1회 / 글)
- **어떤 맥락에서**: 발행 글 키워드가 polem 의제 제목/태그와 매칭될 때. 발행 직전 `Board` 테이블 (분류=정치/시사) 에서 `title ILIKE '%키워드%'` 또는 임베딩 cosine ≥ 0.65 매칭 의제 1건 선택.
- **톤 예시**:

    ```
    > 같은 사안의 찬·반 정리는 [polem.org 토론](https://polem.org/boards/<id>) 에 누적되어 있다.
    ```

- **실행 게이트**: 자동 삽입 전, polem 의제 카테고리가 `정치` 또는 `정책` 인 경우만. 그 외(가십·연예) 카테고리는 매칭돼도 삽입 X.
- **삽입율 제한**: 한 글당 최대 1 백링크, 발행 주차 폴렘 백링크 비율 ≤ 30 %.
- **분기 이슈**: 별도 `[POL-20·N1] naver-blog-bot 폴렘 백링크 모듈` 으로 child 분기.

### `wordpress-blog-bot` (`~/wordpress-blog-bot`)

- **어디에 넣을지**: WordPress 발행 글 끝 *"참고 출처"* 섹션의 한 줄 (`<li><a href>` 형태).
- **어떤 맥락에서**: 카테고리 = 정책·복지·금융 정책 글. polem 의제 매칭은 naver-blog-bot 과 동일 키워드 / 임베딩 알고리즘 공용 모듈로.
- **톤 예시**:

    ```html
    <li>관련 시민 토론: <a href="https://polem.org/boards/<id>" rel="noopener external">polem.org — &lt;의제 제목&gt;</a></li>
    ```

- **rel 속성**: `external noopener`. **`nofollow` 는 붙이지 않는다** — 자기 사이트끼리 자연스러운 신뢰 백링크.
- **분기 이슈**: `[POL-20·W1] wordpress-blog-bot 폴렘 백링크 모듈`.

### `jjirasi-blog-bot` (`~/jjirasi-blog-bot`)

- **어디에 넣을지**: 글 footer "정식 입장 / 공식 보도" 박스 (이미 가십 톤 사이트가 자기 hedge 용도로 사용 중).
- **어떤 맥락에서**: 정치인·재계 인사 관련 글 + polem 매칭 의제가 있을 때만. **풍문(루머) 톤 글에는 삽입 X** (헌법 §2.1 — AI 가 판정자가 아니므로 사실/풍문 혼동 위험).
- **톤 예시**:

    ```
    참고. 본 글에서 다룬 인물·사건 관련해 정식 찬·반 시민 토론은 polem.org 의제 페이지에 누적되어 있다. → polem.org/boards/<id>
    ```

- **3단 Tier 정책 (jjirasi 자체) 준수**:
  - Tier 1 (메이저 보도 = 실명) → polem 백링크 OK
  - Tier 2 (단독·블라인드 보도) → polem 백링크 OK 단 의제 카테고리 = 정치/사회 한정
  - Tier 3 (풍문·짤·캡쳐) → polem 백링크 **X**
- **분기 이슈**: `[POL-20·J1] jjirasi-blog-bot 폴렘 백링크 모듈 (Tier 1·2 한정)`.

## 2. Tier 2 — 부분 적합, 조건부

### `zoz-blog-bot` (`~/zoz-blog-bot`)

- **어디에 넣을지**: 연예 카테고리 글에서 정치인·정책 언급이 감지될 때만. 본문 안 자연스러운 부연 링크.
- **어떤 맥락에서**: 글 텍스트에서 `대통령|국회의원|총선|대선|의원|장관|차관` 정규식 매칭 시. 매칭 없으면 삽입 X.
- **톤 예시**:

    ```
    같은 이슈는 polem.org에 의제로 올라가 있다.
    ```

- **삽입율 제한**: 발행 주차 ≤ 10 % (zoz 메인 색인은 생활정보·연예라 정치 비중 과도하면 본 사이트 색채 흐려짐).
- **분기 이슈**: 우선순위 낮음. Tier 1 봇 3개 안착 후 검토.

## 3. Tier 3 — 즉시 적용 보류 (도메인/타깃 불일치)

| 사이트 / 봇 | 사유 |
|---|---|
| `stock-blog-bot` (주식 급등락) | 정치 → 시장 반응 외 직결 케이스가 드물고, 잘못 끼우면 투자 어드바이스 톤 오해 |
| `webhardrank.kr` / `webhardrank.com` (웹하드 가이드) | 도메인 무관. 사이트 광고색 강화 위험 |
| `donmap` (수익화) | 타깃 SNS·이커머스 정보 위주 |
| `best10.kr` (P2P/유용한 사이트) | 도구 큐레이션. 정치 토론 사이트 노출 = 본 사이트 의도 흐림 |
| `filedal.com` (웹하드 + 영화/드라마 신작) | 도메인 무관 |
| `kdb-site` (영화 DB) | 도메인 무관 |
| `zoz-ai` (AI 소식) | AI 기술 위주. 단 *AI · 알고리즘 규제* 의제 등장 시 손익 검토 가치 있음 — 나중 후속으로만 |
| `parking-blog-bot` (내차찾기 홍보) | 도메인 무관 |

→ Tier 3 는 본 가이드 v1 범위 외. 만약 폴렘에 *AI 정책*, *주식·세제 정책* 의제가 누적되면 zoz-ai / stock-blog-bot 만 재검토.

## 4. 공용 매칭 모듈 설계 (자기 사이트 봇 공통)

세 Tier 1 봇이 같은 매칭 로직을 별도로 짜지 않게 공용 npm/Python 모듈 한 곳에 두고 import. 후속 child 이슈에서 결정:

- **언어**: TypeScript (자기 봇들 다수가 Node) — `@polem/backlink-matcher` 라는 사설 패키지명을 잠정 사용
- **인터페이스**:

    ```ts
    type BoardMatch = {
      boardId: string;
      title: string;
      url: string;
      score: number; // 0..1
      category: 'politics' | 'policy' | 'social' | 'other';
    };
    findBoardMatches(text: string, opts: { minScore?: number; categories?: BoardMatch['category'][] }): Promise<BoardMatch[]>;
    ```

- **데이터 소스**: polem.org 공개 API (`GET /api/boards/search?q=`) — 인증 불필요. 응답 캐시 1h.
- **임계치**: minScore 기본 0.6, Tier 1 봇은 0.65 권장.
- **장애 시 폴백**: API 실패하면 매칭 X (백링크 미삽입). 절대 throw 로 발행 자체를 멈추지 않는다.

## 5. 측정·관측

- polem.org 측: `Referer` 헤더로 `naver-blog-bot` / `wordpress-blog-bot` 등 출처별 유입 카운트. *Search Console impressions* 와 동일 지표로 누적.
- 자기 사이트 봇 측: 발행 글 메타에 `polem_board_id` 컬럼 추가 → 어느 글이 어느 의제와 연결됐는지 추적.
- 1 분기 종료 시 Tier 별 *유입 / 발행 비율* 1쪽 리포트 → POL-18 acceptance (Q2 impressions ≥ 1) 에 합산.

## 6. 다음 액션

1. 본 가이드 commit → POL-20 코멘트로 링크 첨부
2. POL-20 → `in_review` 핸드오프 (CEO 검토)
3. CEO 승인 후 Tier 1 봇 3개 각각 child 이슈 분기 (`[POL-20·N1/W1/J1]`)
4. 공용 매칭 모듈 (`@polem/backlink-matcher`) child 이슈 1건 추가
5. 선거 기간 `electionFreeze` 토글은 POL-18 의 X publisher 와 코드 공유 — 동일 환경변수 (`POLEM_ELECTION_FREEZE=1`) 로 묶기
