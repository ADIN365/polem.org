# 끝장토론 매핑 (MAPPING.md)

> *수정할 때 어디를 봐야 하는지* 한 곳에 모은 문서. 이름·색상 변경, 새 기능 추가, 트리·트윗 확장 시 *영향 범위* 빠르게 파악 가능.

목차:
1. [디자인 토큰](#1-디자인-토큰)
2. [화면 (Routes)](#2-화면-routes)
3. [컴포넌트 맵](#3-컴포넌트-맵)
4. [데이터 모델 (Prisma)](#4-데이터-모델-prisma)
5. [API 엔드포인트 맵](#5-api-엔드포인트-맵)
6. [AI 통합 포인트](#6-ai-통합-포인트)
7. [환경변수](#7-환경변수)
8. [확장 시 영향 범위](#8-확장-시-영향-범위)

---

## 1. 디자인 토큰

> **수정 시:** 모든 색·폰트·간격은 CSS Variables 로 관리. `app/globals.css` 에서 한 곳만 수정하면 전 사이트 적용.

### 1.1 색상 팔레트

```css
:root {
  /* 베이스 */
  --bg-page:     #F5F5F4;  /* 페이지 베이스 (크림) */
  --bg-card:     #fff;     /* 카드 베이스 */
  --bg-soft:     #FAFAF9;  /* 부드러운 보조 배경 */
  --bg-dark:     #2B2620;  /* 잉크 (검정 대신) */
  --bg-deep:     #3E342B;  /* 잉크 hover */

  /* 잉크 (글자) */
  --ink:         #2B2620;  /* 메인 글자 */
  --ink-2:       #4A4239;  /* 보조 글자 */
  --ink-3:       #6F665C;  /* 약한 글자 (메타) */
  --ink-4:       #A8A09A;  /* 매우 약한 글자 */
  --ink-soft:    #C8C2BC;  /* 잉크 카드 위 보조 */

  /* 종이 크림 (잉크 카드 위 글자) */
  --paper-cream:     #F5F1E8;
  --paper-cream-dim: #A8A4A0;

  /* 테두리 */
  --border:      #2B2620;  /* 강한 테두리 */
  --border-soft: #D4CFC8;  /* 부드러운 테두리 */

  /* 강조 (의도적으로 매우 절제) */
  --accent-warm:       #9B7B2C;  /* 황금 (블라인드 동의율 — 흰 카드) */
  --accent-warm-light: #C9A453;  /* 밝은 황금 (블라인드 — 잉크 카드) */
  --accent-warn:       #8B3D2E;  /* 테라코타 (살펴볼 만함, 경고만) */
}
```

**규칙 (헌법):**
- 정당색 (빨강·파랑) **절대 금지**
- 강조색 사용은 *극히 제한*: 황토색은 *블라인드 동의율*만, 테라코타는 *살펴볼 만함*만
- 그라디언트·강한 그림자 **거의 사용 X** (필요 시 매우 약한 box-shadow)

### 1.2 폰트 토큰

> **글자 크기 토글** 작동: `body.fs-large` 또는 `body.fs-xlarge` class 로 모든 토큰 swap. 새 폰트 사이즈 추가 시 *세 단계 모두* 정의 필요.

```css
:root {
  /* default — 15px base */
  --fs-base:         15px;
  --fs-small:        13px;
  --fs-tiny:         11px;
  --fs-meta:         12px;
  --fs-pin:          14px;
  --fs-button:       13px;
  --fs-button-large: 15px;
  --fs-eyebrow:      11px;
  --fs-eyebrow-tight:10px;
  --fs-input:        14px;
  --fs-question:     23px;
  --fs-title-h1:     26px;
  --fs-title-h2:     24px;
  --fs-title-h3:     22px;
  --fs-title-h4:     17px;
  --fs-title-modal:  30px;
  --fs-stat-num:     24px;
  --fs-brand:        23px;
}

body.fs-large {
  --fs-base:17px; --fs-small:15px; --fs-tiny:12px;
  --fs-meta:13px; --fs-pin:16px;   --fs-button:14px;
  --fs-button-large:16px; --fs-eyebrow:12px; --fs-eyebrow-tight:11px;
  --fs-input:15px; --fs-question:25px;
  --fs-title-h1:28px; --fs-title-h2:26px; --fs-title-h3:24px;
  --fs-title-h4:18px; --fs-title-modal:32px; --fs-stat-num:26px;
  --fs-brand:24px;
}

body.fs-xlarge {
  --fs-base:19px; --fs-small:16px; --fs-tiny:13px;
  --fs-meta:14px; --fs-pin:18px;   --fs-button:15px;
  --fs-button-large:17px; --fs-eyebrow:13px; --fs-eyebrow-tight:12px;
  --fs-input:16px; --fs-question:28px;
  --fs-title-h1:32px; --fs-title-h2:30px; --fs-title-h3:27px;
  --fs-title-h4:20px; --fs-title-modal:36px; --fs-stat-num:30px;
  --fs-brand:26px;
}
```

**Font Family:**
```css
--sans:  'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--serif: 'Noto Serif KR', Georgia, serif;
--mono:  'SF Mono', ui-monospace, Consolas, monospace;
```

- **본문:** `--sans` (Pretendard)
- **헤드라인·인용·통계 숫자:** `--serif` (Noto Serif KR)
- **코드·아이디:** `--mono`

### 1.3 간격·반경·전환

```css
:root {
  --radius-sm: 2px;   /* 라벨, 작은 버튼 */
  --radius-md: 3px;   /* 일반 버튼, 인풋, 카드 */
  --radius-lg: 6px;   /* 큰 카드, 모달 */
  --tr: 0.18s cubic-bezier(0.2,0.6,0.2,1);
}
```

### 1.4 디자인 톤 한 줄

> 흑백 미니멀, 신문 사설. *법정의 진지함* + *오래된 책의 잉크* 톤. 차분함이 우선, 임팩트는 절제.

---

## 2. 화면 (Routes)

| Route | 화면 | polem.html view | 권한 |
|---|---|---|---|
| `/` | 의제 색인 (홈) | `view-index` | 공개 |
| `/boards/[id]` | 게시판 (좌우 분할) | `view-board` | 공개 (작성은 로그인) |
| `/proposal` | 의제 제안 | `view-proposal` | 로그인 |
| `/me` | 내 정보 | `view-profile` | 본인만 |
| `/u/[nickname]` | 공개 프로필 | (데모 X, 새 디자인) | 공개 |
| `/login` | 로그인 (카카오 OAuth) | (데모 X) | 공개 |
| `/onboarding/nickname` | 닉네임 설정 | (데모 X) | 로그인 직후 |
| `/onboarding/ideology` | 사상검증 안내 | `view-ideology` | 로그인 직후 |
| `/onboarding/likert` | Likert 척도 진행 | `view-likert` | 로그인 직후 |
| `/three` | 오늘의 3문항 | `view-three` | 로그인 |
| `/three/reveal` | 3문항 결과 | `view-reveal` | 로그인 |
| `/notifications` | 알림 목록 | (데모 X, 새 디자인) | 로그인 |
| `/admin` | 관리자 대시보드 | (데모 X, 새 디자인) | 관리자만 |
| `/admin/proposals` | 의제 제안 승인 큐 | (데모 X) | 관리자만 |
| `/admin/reports` | 신고 처리 큐 | (데모 X) | 관리자만 |
| `/terms`, `/privacy`, `/policy` | 약관·정책 | (데모 X) | 공개 |

### 2.1 Next.js App Router 구조

```
app/
  layout.tsx                    # 전체 레이아웃 (TopNav, Toast)
  page.tsx                      # / 의제 색인
  boards/
    [id]/page.tsx               # 게시판 상세
  proposal/page.tsx
  me/page.tsx
  u/
    [nickname]/page.tsx
  three/
    page.tsx                    # 3문항
    reveal/page.tsx             # reveal
  onboarding/
    nickname/page.tsx
    ideology/page.tsx
    likert/page.tsx
  admin/
    layout.tsx                  # 권한 가드
    page.tsx
    proposals/page.tsx
    reports/page.tsx
  notifications/page.tsx
  terms/page.tsx
  privacy/page.tsx
  policy/page.tsx
  api/
    auth/[...nextauth]/route.ts
    boards/
      route.ts                  # GET 목록, POST 생성 (관리자)
      [id]/route.ts             # GET 상세
    pins/
      route.ts                  # POST 박제 생성
      [id]/
        endorse/route.ts        # POST/DELETE 동조
        comments/route.ts       # GET 목록, POST 댓글
        challenge/route.ts      # POST 출처 도전
        report/route.ts         # POST 신고
        quote/route.ts          # POST 인용 박제
    proposals/
      route.ts                  # GET 목록, POST 제안
      [id]/route.ts             # PATCH 승인/거절 (관리자)
    three/
      route.ts                  # GET 오늘의 3문항
      answer/route.ts           # POST 답변
    me/
      route.ts                  # GET 내 정보
      profile/route.ts          # PATCH 프로필 (닉네임 등)
      privacy/route.ts          # PATCH 공개·비공개 토글
    likert/route.ts             # POST Likert 답변
    notifications/route.ts      # GET 알림
    admin/
      reports/route.ts          # GET 신고 큐
      reports/[id]/route.ts     # PATCH 신고 처리
      users/[id]/ban/route.ts   # POST 차단
    cron/
      ai-summary/route.ts       # 50:50 요약 (배치)
      blind-questions/route.ts  # 박제 → 블라인드 변환 (배치)

components/
  layout/
    TopNav.tsx
    FontSizeToggle.tsx
    Toast.tsx
    MobileMenu.tsx
  board/
    BoardCard.tsx               # 의제 색인의 row
    BoardIndex.tsx              # 의제 색인 표
    BoardHeader.tsx             # 게시판 상단 (제목·비율 막대)
    BoardSummary.tsx            # AI 50:50 요약 박스
    Pin.tsx                     # 박제 카드 (pin-pro / pin-con variants)
    PinForm.tsx                 # 박제 작성 모달
    PinComments.tsx             # 댓글 트리 (깊이 무한)
    QuoteBlock.tsx              # 인용 박제 표시
    ChallengeBadge.tsx          # 출처 도전 배지
  proposal/
    ProposalForm.tsx            # 사용자 입력
    ProposalAiPanel.tsx         # AI 정제 결과 (실시간)
  survey/
    SurveyCard.tsx              # 공통 설문 카드
    SurveyProgress.tsx          # 진행 바
    SurveyQuestion.tsx          # 질문 텍스트
    LikertButtons.tsx           # 5단계 척도 버튼
    BinaryButtons.tsx           # 동의/반대 두 버튼
  reveal/
    RevealItem.tsx              # 3문항 결과 한 줄
    StatusTag.tsx               # 일치/살펴볼 만함/새 발견/갈림
  profile/
    ProfileStats.tsx            # 4개 활동 카운트
    PrismChart.tsx              # 4축 시각화
    PrismAxis.tsx               # 한 축 (S/E/E/C)
    MirrorTable.tsx             # 의제별 자기 거울 표
    MirrorRow.tsx
  modal/
    Modal.tsx                   # 공통 모달
    IdeologyCheck.tsx           # 사상검증 안내 모달
    PinFormModal.tsx
    ReportModal.tsx
  ui/
    Button.tsx                  # btn-primary / -secondary / -ghost
    Gauge.tsx                   # 비율 막대
    SearchBar.tsx
    Select.tsx
    Eyebrow.tsx                 # 작은 라벨
```

---

## 3. 컴포넌트 맵

### 3.1 Pin (박제 카드) — 두 variants

```tsx
// 핵심: pin-pro 는 흰색 카드, pin-con 은 잉크 카드
type PinVariant = 'pro' | 'con';

interface PinProps {
  variant: PinVariant;   // 'pro' | 'con'
  body: string;
  author: string;
  time: string;
  blindAgree?: number;   // 블라인드 동의율 (옵션)
  endorseCount: number;
  commentCount: number;
  challengeCount?: number;
  quote?: { author: string; body: string }; // 인용 박제 시
}
```

색상은 모두 CSS Variables. variant 만 바꾸면 자동 적용.

### 3.2 PrismChart (4축)

```tsx
interface PrismScore {
  S: number;  // -1.0 ~ +1.0
  E_ethics: number;
  E_economy: number;
  C: number;
}

// 각 축마다 PrismAxis 컴포넌트 + 게이지바 + Percentile + 라벨
```

### 3.3 MirrorTable (의제별 자기 거울)

```tsx
interface MirrorRow {
  boardId: string;
  boardTitle: string;
  category: string;
  myPins: { pro: number; con: number };
  blindAnswers: { agree: number; disagree: number };
  status: 'match' | 'warn' | 'new' | 'split';
}
```

### 3.4 FontSizeToggle

- body class swap: `''` / `'fs-large'` / `'fs-xlarge'`
- localStorage key: `'polem-fs'`
- 모바일: 햄버거 메뉴 안에 같이 포함

---

## 4. 데이터 모델 (Prisma)

> **확장 고려:** v1.0 모델 + v2/v3 자리 미리 표시. 트리·트윗 추가 시 *기존 모델 변경 X*, 새 테이블만 추가.

```prisma
// =========================================================
// v1.0 — Core Models
// =========================================================

model User {
  id           String   @id @default(cuid())
  kakaoId      String   @unique          // 카카오 OAuth ID (시스템 안에만)
  email        String?
  nickname     String   @unique          // 화면에 보이는 이름
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // privacy
  prismPublic  Boolean  @default(true)  // 4축 점수 공개 여부 (디폴트 공개, 토글 가능)

  // moderation
  warningCount Int      @default(0)
  suspendedUntil DateTime?
  banned       Boolean  @default(false)

  // relations
  pins             Pin[]
  comments         Comment[]
  endorsements     Endorsement[]
  challenges       Challenge[]
  reports          Report[]
  proposals        Proposal[]
  blindAnswers     BlindAnswer[]
  likertAnswers    LikertAnswer[]
  prismScore       PrismScore?
  notifications    Notification[]

  @@index([nickname])
}

enum Role {
  USER
  MODERATOR
  ADMIN
}

model Board {
  id          String   @id @default(cuid())
  title       String
  body        String?              // 의제 본문 (제안자가 적은 배경)
  category    Category
  proposerId  String?              // 제안자 (관리자가 직접 만든 경우 null)
  proposer    User?    @relation(fields: [proposerId], references: [id])
  proCount    Int      @default(0) // 찬성 박제 수
  conCount    Int      @default(0) // 반대 박제 수
  viewCount   Int      @default(0)
  participantCount Int @default(0) // 고유 참여자
  status      BoardStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // AI 50:50 요약 (배치 갱신)
  aiSummaryPro  String?
  aiSummaryCon  String?
  aiSummaryAt   DateTime?

  pins        Pin[]
  proposal    Proposal?

  @@index([category, updatedAt])
  @@index([status])
}

enum Category {
  POLITICS         // 정치
  ECONOMY          // 경제
  SOCIETY          // 사회
  CULTURE          // 문화
  FOREIGN_AFFAIRS  // 외교·안보
  ENVIRONMENT      // 환경·과학
}

enum BoardStatus {
  ACTIVE
  ARCHIVED
  HIDDEN
}

model Pin {
  id         String   @id @default(cuid())
  boardId    String
  board      Board    @relation(fields: [boardId], references: [id])
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  side       PinSide
  body       String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // 인용 박제 (다른 박제 인용)
  quotedPinId String?
  quotedPin   Pin?    @relation("Quotation", fields: [quotedPinId], references: [id])
  quotingPins Pin[]   @relation("Quotation")

  // 블라인드 질문 변환 (배치 작업 결과, 옵션)
  blindQuestion     String?     // AI 변환된 블라인드 질문
  blindQuestionAt   DateTime?
  blindAgreeCount   Int @default(0)   // 동의 수
  blindDisagreeCount Int @default(0)  // 반대 수

  // moderation
  hidden     Boolean  @default(false) // 신고 후 임시조치
  deleted    Boolean  @default(false)

  comments     Comment[]
  endorsements Endorsement[]
  challenges   Challenge[]
  reports      Report[]
  blindAnswers BlindAnswer[]

  @@index([boardId, side, createdAt])
  @@index([authorId])
}

enum PinSide {
  PRO  // 찬성
  CON  // 반대
}

model Comment {
  id        String   @id @default(cuid())
  pinId     String
  pin       Pin      @relation(fields: [pinId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  parentId  String?  // 무한 깊이 (자기참조)
  parent    Comment? @relation("CommentTree", fields: [parentId], references: [id])
  children  Comment[] @relation("CommentTree")
  body      String
  createdAt DateTime @default(now())

  hidden    Boolean  @default(false)
  deleted   Boolean  @default(false)

  @@index([pinId, createdAt])
  @@index([parentId])
}

model Endorsement {
  id        String   @id @default(cuid())
  pinId     String
  pin       Pin      @relation(fields: [pinId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@unique([pinId, userId])
  @@index([userId])
}

model Challenge {
  id          String   @id @default(cuid())
  pinId       String
  pin         Pin      @relation(fields: [pinId], references: [id])
  challengerId String
  challenger  User     @relation(fields: [challengerId], references: [id])
  body        String   // 도전 내용
  sourceUrl   String   // 도전자도 출처 첨부 필수
  createdAt   DateTime @default(now())

  @@index([pinId])
}

model Report {
  id           String   @id @default(cuid())
  reporterId   String
  reporter     User     @relation(fields: [reporterId], references: [id])
  targetType   ReportTargetType
  targetId     String
  pinId        String?
  pin          Pin?     @relation(fields: [pinId], references: [id])
  reason       ReportReason
  body         String?  // 자유 입력 (선택)
  status       ReportStatus @default(PENDING)
  resolvedById String?
  resolvedAt   DateTime?
  createdAt    DateTime @default(now())

  @@index([status, createdAt])
}

enum ReportTargetType {
  PIN
  COMMENT
  USER
}

enum ReportReason {
  PERSONAL_ATTACK   // 인신공격
  HATE_SPEECH       // 혐오
  AD_SPAM           // 광고·스팸
  FALSE_INFO        // 허위사실
  OTHER
}

enum ReportStatus {
  PENDING
  RESOLVED
  DISMISSED
}

model Proposal {
  id            String   @id @default(cuid())
  proposerId    String
  proposer      User     @relation(fields: [proposerId], references: [id])
  rawTitle      String   // 사용자 원본 입력
  rawBody       String?
  aiTitle       String?  // AI 정제 결과
  aiCategory    Category?
  aiDuplicateOfBoardId String? // AI 가 발견한 중복 후보
  aiFiltered    Boolean  @default(false) // 부적절 차단
  status        ProposalStatus @default(PENDING)
  reviewerId    String?
  reviewedAt    DateTime?
  rejectionReason String?
  createdBoardId String?  @unique
  createdBoard  Board?   @relation(fields: [createdBoardId], references: [id])
  createdAt     DateTime @default(now())

  @@index([status, createdAt])
}

enum ProposalStatus {
  PENDING       // 관리자 검토 대기
  APPROVED      // 승인 → 게시판 생성됨
  REJECTED
}

// =========================================================
// 가치관 프리즘 (4축)
// =========================================================

model PrismScore {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])

  // 4 axes (-1.0 ~ +1.0)
  society   Float    @default(0)  // S: 공동체 ↔ 개인
  ethics    Float    @default(0)  // E: 보편 원칙 ↔ 상황 맥락
  economy   Float    @default(0)  // E: 안정/분배 ↔ 성장/위험
  change    Float    @default(0)  // C: 전통/보존 ↔ 혁신/개방

  // 측정 출처
  likertCompletedAt DateTime?     // 사상검증 완료 시점
  blindCount        Int @default(0) // 블라인드 답변 수 (보정 측정)
  updatedAt         DateTime @updatedAt
}

model LikertAnswer {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  questionId String  // 질문 식별 (1-12)
  axis      String  // 'S' | 'E_ethics' | 'E_economy' | 'C'
  value     Int     // -2 ~ +2 (매우 반대 ~ 매우 동의)
  createdAt DateTime @default(now())

  @@unique([userId, questionId])
}

// =========================================================
// 블라인드 답변 (오늘의 3문항)
// =========================================================

model BlindAnswer {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  pinId           String   // 어느 박제의 블라인드 질문이었는지 (시스템은 알지만 사용자에게 명시 X)
  pin             Pin      @relation(fields: [pinId], references: [id])
  answer          BlindAnswerValue
  createdAt       DateTime @default(now())

  @@unique([userId, pinId])
  @@index([userId, createdAt])
  @@index([pinId])
}

enum BlindAnswerValue {
  AGREE
  DISAGREE
  UNSURE
}

// =========================================================
// 알림
// =========================================================

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      NotificationType
  body      String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, read, createdAt])
}

enum NotificationType {
  PROPOSAL_APPROVED
  PROPOSAL_REJECTED
  REPORT_RESOLVED
  PIN_CHALLENGED
  WARNING
  SUSPENSION
}

// =========================================================
// v2.0 — 논리 트리 (자리만 미리 표시)
// =========================================================

// model LogicNode {
//   id        String  @id @default(cuid())
//   boardId   String
//   board     Board   @relation(fields: [boardId], references: [id])
//   pinIds    String[] // 어느 박제들에서 추출되었는지
//   text      String   // AI 가 추출한 핵심 명제
//   side      PinSide
//   createdAt DateTime @default(now())
// }

// model LogicEdge {
//   id           String @id @default(cuid())
//   fromNodeId   String
//   toNodeId     String
//   relationType String  // 'supports' | 'rebuts' | 'qualifies'
// }

// =========================================================
// v3.0 — 트윗 (자리만 미리 표시)
// =========================================================

// model Tweet {
//   id        String   @id @default(cuid())
//   authorId  String
//   author    User     @relation(fields: [authorId], references: [id])
//   body      String
//   parentId  String?  // 답글 (깊이 1단계)
//   quotedTweetId String? // 인용 트윗
//   createdAt DateTime @default(now())
// }
```

**Migration 전략:**
- v1.0 만 enabled. v2/v3 모델은 *주석 처리*해서 미래 자리 표시
- 트리 추가 시 주석 풀고 마이그레이션
- *기존 v1.0 모델은 변경 안 됨* (Pin 에 logicNodeId 추가 같은 거 X)
- 대신 별도 모델 (LogicNode.pinIds 같이) 로 *옆에 붙임*

---

## 5. API 엔드포인트 맵

> **수정 시:** Route → Component → API → Prisma 모델 매핑이 1:1 가깝게. 화면 수정 시 어느 API 영향 받는지 즉시 파악.

| Route | API | Prisma 모델 |
|---|---|---|
| `/` | `GET /api/boards` | Board (list) |
| `/boards/[id]` | `GET /api/boards/[id]` | Board, Pin (relations) |
| `/boards/[id]` 박제 작성 | `POST /api/pins` | Pin (create) + Board (counter ++) |
| 박제 동조 | `POST /api/pins/[id]/endorse` | Endorsement |
| 박제 댓글 | `GET/POST /api/pins/[id]/comments` | Comment |
| 박제 인용 | `POST /api/pins/[id]/quote` | Pin (with quotedPinId) |
| 박제 도전 | `POST /api/pins/[id]/challenge` | Challenge |
| 박제 신고 | `POST /api/pins/[id]/report` | Report |
| `/proposal` | `POST /api/proposals` | Proposal (with AI fields) |
| `/three` | `GET /api/three` | Pin (블라인드 질문 변환된 것) |
| `/three` 답변 | `POST /api/three/answer` | BlindAnswer |
| `/me` | `GET /api/me` | User, Pin, BlindAnswer, PrismScore (집계) |
| `/onboarding/likert` | `POST /api/likert` | LikertAnswer + PrismScore (계산) |
| `/admin/proposals` | `GET /api/admin/proposals` | Proposal (PENDING) |
| 의제 승인 | `PATCH /api/admin/proposals/[id]` | Proposal + Board (생성) |
| `/admin/reports` | `GET /api/admin/reports` | Report (PENDING) |
| `/cron/ai-summary` | (Cron) | Board.aiSummaryPro/Con (배치 갱신) |
| `/cron/blind-questions` | (Cron) | Pin.blindQuestion (배치 변환) |

---

## 6. AI 통합 포인트

| 작업 | 시점 | LLM | 입력 | 출력 |
|---|---|---|---|---|
| 의제 정제 | 사용자 제안 시 (실시간) | gpt-4o-mini | 자유 입력 텍스트 | 정제된 제목·카테고리·중복 후보·필터 결과 |
| 50:50 요약 | 매일 1-2회 (Cron) | gpt-4o-mini | 게시판 박제 100-300개 | PRO 한 줄·CON 한 줄 (50:50) |
| 블라인드 질문 변환 | 박제 생성 후 (Cron, 비동기) | gpt-4o-mini | Pin.body | 의제명·고유명사 가린 질문 형태 |
| 부적절성 필터 | 모든 사용자 글 작성 시 | 한국어 비속어 사전 + 정규식 (LLM 아님) | 텍스트 | 차단/허용 |

**모든 AI 결과는 *수정 가능*하게:**
- 의제 정제 결과 → 사용자가 *틀렸어요* 신고 가능
- 50:50 요약 → 모더레이터가 수동 편집 가능
- 블라인드 질문 → 모더레이터가 수동 편집 가능

**LLM 호출 코드 위치:**
```
lib/ai/
  proposal-refine.ts      # 의제 정제
  summary-batch.ts         # 50:50 요약
  blind-convert.ts         # 블라인드 질문 변환
  prompts.ts               # 시스템 프롬프트 모음
```

---

## 7. 환경변수

```
# .env.local
DATABASE_URL=postgres://...
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://polem.org

# OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# AI
OPENAI_API_KEY=
# 또는
ANTHROPIC_API_KEY=

# 옵션
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
```

**Vercel 배포 시:** 위 변수들 모두 Vercel 대시보드에 등록.
**개발 시:** `.env.local` 사용. `.env.example` 만 git 에 올림.

---

## 8. 확장 시 영향 범위

> **수정 시:** 기능 추가·삭제할 때 어느 파일을 건드려야 하는지.

### 8.1 트윗 추가 (v3.0)

추가할 것:
- 모델: `Tweet`, `TweetEndorsement` (또는 Pin/Endorsement 와 다른 모델)
- 라우트: `/tweets` (메인 피드)
- API: `/api/tweets/*`
- 컴포넌트: `<Tweet />`, `<TweetForm />`, `<TweetFeed />`

영향 X:
- 기존 Board, Pin, BlindAnswer 모델
- 기존 게시판 화면

연결:
- 게시판 페이지 사이드바에 *관련 트윗* 섹션 (AI 매칭, 게시판 통계 영향 X)
- TopNav 에 *트윗* 링크 추가

### 8.2 논리 트리 (v2.0)

추가할 것:
- 모델: `LogicNode`, `LogicEdge`
- 라우트: `/boards/[id]/tree`
- API: `/api/boards/[id]/tree`, `/api/cron/tree-build` (Cron)
- 컴포넌트: `<LogicTree />`, `<LogicNode />`

영향 X:
- 기존 Pin, Board 모델 변경 없음
- 게시판 화면은 그대로. 트리는 *별도 화면* 으로 진입

### 8.3 NLP 자동 보정 (v2.5, 가치관 프리즘 v2)

추가할 것:
- `lib/ai/nlp-prism-update.ts` — 사용자 글·댓글 분석해서 PrismScore 보정
- Cron: `/api/cron/prism-update`

영향 X:
- 기존 PrismScore 모델 (값만 바뀜)
- 사용자 화면 (내 정보 페이지의 *시간 변화* 차트가 기존 데이터로 채워짐)

### 8.4 페르소나 분석 (v2.5)

추가할 것:
- 라우트: `/me/persona` (또는 내 정보 페이지 안 섹션)
- API: `/api/persona/simulate?topic=X`
- 컴포넌트: `<PersonaSimulator />`

영향 X:
- 모든 기존 모델

### 8.5 반대 콘텐츠 20% 섞기 (v2.5)

수정할 것:
- `/api/boards` (의제 색인) — 사용자 PrismScore 기반 *반대 의제* 일정 비율 노출
- `lib/feed-mixer.ts` 추가

영향:
- 기존 *최신순/팽팽한 순* 같은 정렬 옵션 유지하되 *기본*에 추가

### 8.6 디자인 토큰 변경 (예: 잉크 색 → 다른 색)

수정 위치:
- `app/globals.css` 의 `:root { ... }` 한 곳만
- 모든 컴포넌트는 `var(--ink)` 사용. 자동 적용

### 8.7 새 페이지 추가 (예: FAQ, 팀 소개)

추가:
- `app/[새경로]/page.tsx`
- TopNav 또는 Footer 에 링크

영향 X: 모든 기존 코드

### 8.8 사이트 이름 변경

수정 위치:
1. `app/layout.tsx` — `<title>` 태그
2. `components/layout/TopNav.tsx` — 브랜드 표시
3. `lib/constants.ts` — `SITE_NAME` 상수
4. SEO 메타 태그 (`app/layout.tsx` 의 `metadata`)

> 한 곳만 빠지면 일관성 깨짐. 변경 후 `grep -r "끝장토론"` 확인 필수.

---

## 9. 모더레이션 정책 (구현 위치)

| 정책 | 구현 위치 |
|---|---|
| 욕설 자동 필터 | `lib/moderation/profanity-filter.ts` (한국어 비속어 사전 + 정규식) |
| 신고 흐름 | `Report` 모델 + `/admin/reports` |
| 차단 단계 (경고 → 7일 → 영구) | `User.warningCount`, `User.suspendedUntil`, `User.banned` |
| 임시조치 (정보통신망법) | `Pin.hidden = true` (24시간 자동 또는 모더레이터 검토) |

---

## 10. 한 곳에서 봐야 할 일관성

다음 변경 시 *여러 파일* 동시 수정 필요. 자동화 스크립트나 grep 추천.

- **사이트 이름 변경** → 8.8 참조
- **카테고리 추가/변경** → Prisma `Category` enum + Board 라우트 필터 옵션 + 의제 색인 select + 의제 제안 select
- **블라인드 답변 종류 변경** (예: 5단계로) → `BlindAnswerValue` enum + 3문항 화면 버튼 + reveal 화면 표시 + 내 정보 거울 표 집계
- **새 모더레이션 사유 추가** → `ReportReason` enum + 신고 모달 + 관리자 패널

---

> 이 매핑은 *사이트가 자라면서* 함께 업데이트. 새 기능 추가 시 어느 섹션에 영향 가는지 *항상 명시 후 git commit*.
