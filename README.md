# 끝장토론 (polem.org)

한국어 정치 토론 플랫폼. 의제별 *좌우 분할(찬/반)* 영구 보관 + AI 50:50 요약 + 블라인드 답변 자기 거울.

명세·디자인 데모는 같은 디렉토리의 `CLAUDE.md`, `MAPPING.md`, `polem.html` 참조. `MAPPING.md` 가 *architecture* 역할 — 라우트·Prisma 모델·API·컴포넌트 매핑을 한 곳에서 관리.

## 진행 상황 (Sprint 1, 2026-05-09~)

- [x] Phase 0 — Next.js 14 + Prisma + NextAuth 골격, 디자인 토큰, 레이아웃
- [x] Phase 1 — 카카오 OAuth + User 모델 + 닉네임 온보딩
- [x] Phase 2 — 의제 색인 + 게시판 읽기 전용 (시드 14의제 / 65박제)
- [x] Phase 3 — 박제 + 동조 + 댓글(무한 깊이) + 인용 박제 + 출처 도전

전체 Phase 0~13 은 `CLAUDE.md §6` 참조. Sprint 2 진입 전까지 *AI 통합 없음*.

---

## 로컬 셋업

### 1) 의존성

```bash
npm install
```

### 2) Neon (PostgreSQL)

1. <https://neon.tech> 가입 → 새 프로젝트 (region: Singapore 권장)
2. Connection string 두 개 복사 — *Pooled* (`-pooler` 접미사) 와 *Direct*
3. `.env` 생성 후 `DATABASE_URL` 에 *Pooled* URL 입력 (`.env.example` 참고)
4. 마이그레이션:
   ```bash
   npm run db:migrate -- --name init
   ```
5. 시드:
   ```bash
   npm run db:seed
   ```

### 3) NextAuth Secret

```bash
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
```

### 4) OAuth — 카카오 + 네이버

OAuth 둘 중 하나만 등록해도 작동. 둘 다 등록하면 `/login` 에 두 버튼 노출. 미등록 provider 는 NextAuth 가 자동 비활성.

> **수집 정보 최소화 (헌법 §2.3 + 개인정보보호법):** 닉네임은 우리 사이트 안에서 *사용자가 직접 입력*해야 하므로 OAuth 가 주는 본명·별명·프로필 사진은 사용하지 않음. **이메일만** 받는 걸 권장.

#### 카카오 (developers.kakao.com)

1. <https://developers.kakao.com> 로그인 → *내 애플리케이션* → 새 앱 (앱명: **끝장토론**)
2. *플랫폼 → Web → 사이트 도메인* — **두 개 다 등록**:
   ```
   http://localhost:3000
   https://polem.org
   ```
3. *카카오 로그인* → 활성화 → *Redirect URI* — **두 개 다 등록** (한 줄씩):
   ```
   http://localhost:3000/api/auth/callback/kakao
   https://polem.org/api/auth/callback/kakao
   ```
4. *동의항목* → **카카오계정(이메일) = 선택 동의**. 닉네임은 카카오가 기본 노출 (제어 X)
5. *보안* → Client Secret 활성화 → 코드 발급
6. `.env` 에:
   ```
   KAKAO_CLIENT_ID="..."     # REST API 키
   KAKAO_CLIENT_SECRET="..."
   ```

#### 네이버 (developers.naver.com)

1. <https://developers.naver.com> 로그인 → *Application → 애플리케이션 등록*
2. 애플리케이션 이름: **끝장토론**, 사용 API: *네이버 로그인*
3. **제공 정보: 이메일 주소만 *필수 동의***. 회원이름·별명·프로필 사진·생일·성별·휴대전화 모두 *사용 안함*
4. **로그인 오픈 API 서비스 환경 → PC웹 환경을 두 개 추가**:
   - *환경 1* — 서비스 URL `http://localhost:3000`, Callback URL `http://localhost:3000/api/auth/callback/naver`
   - *환경 2* — 서비스 URL `https://polem.org`, Callback URL `https://polem.org/api/auth/callback/naver`
5. 발급된 *Client ID*, *Client Secret* 을 `.env` 에:
   ```
   NAVER_CLIENT_ID="..."
   NAVER_CLIENT_SECRET="..."
   ```

### 5) 개발 서버

```bash
npm run dev
```

`http://localhost:3000` 접속. 다음을 확인:
- 의제 색인이 14개 표시되는가
- 게시판 상세에 박제들이 PRO/CON 으로 분할되어 보이는가
- 카카오로 로그인하면 닉네임 설정 화면으로 가는가
- 닉네임 설정 후 / 로 돌아오는가
- 박제 작성·동조·댓글·인용·도전이 모두 작동하는가

---

## Vercel 배포

### 1) GitHub push

```bash
git push origin main
```

### 2) Vercel 프로젝트 연결

1. <https://vercel.com/new> 에서 GitHub 의 `ADIN365/polem.org` 임포트
2. *Build Command*: `prisma generate && next build`
3. *Environment Variables* (Production / Preview):
   - `DATABASE_URL` — Neon Pooled URL
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` — `https://polem.org`
   - `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`

### 3) 도메인 연결

1. Vercel *Settings → Domains* → `polem.org` 추가
2. Cloudflare DNS:
   - `A @ → 76.76.21.21` (Vercel)
   - `CNAME www → cname.vercel-dns.com`
   - 두 레코드 모두 *Proxy status: DNS only* (회색 구름)
3. DNS 전파 후 Vercel 이 자동으로 SSL 발급

### 4) OAuth — 프로덕션 redirect

위 2.4 단계에서 카카오 사이트 도메인·Redirect URI 와 네이버 PC웹 환경에 이미 `https://polem.org` 도 함께 등록했다면 **추가 작업 없음**. 등록 안 했다면 지금 추가:

- **카카오** *카카오 로그인 → Redirect URI*: `https://polem.org/api/auth/callback/kakao` 추가, 플랫폼 *Web 사이트 도메인* 에도 `https://polem.org` 추가
- **네이버** *애플리케이션 → 로그인 오픈 API 서비스 환경 → PC웹 환경 추가*: 서비스 URL `https://polem.org`, Callback URL `https://polem.org/api/auth/callback/naver`

### 5) 프로덕션 마이그레이션

Vercel 빌드 시 `prisma generate` 만 실행됨. 스키마 변경 시:

```bash
DATABASE_URL=<neon-direct> npx prisma migrate deploy
```

(직접 URL 사용 — pooler 는 prepared statements 가 안 됨.)

---

## 기술 스택

- **Next.js 14.2** (App Router) + **TypeScript**
- **Prisma 6** + **PostgreSQL** (Neon)
- **NextAuth v4** + **카카오 OAuth**
- **Tailwind CSS** + CSS Variables (디자인 토큰)
- **react-hot-toast**
- 호스팅: **Vercel** + **Cloudflare DNS-only**

## 헌법 (CLAUDE.md §2 — 절대 위반 금지)

1. AI 는 사서지 판사가 아님 (50:50 요약, 우열 판정 X)
2. 점수 합산 거부 (비추천 X, 게이미피케이션 X)
3. Private-by-Design (4축 가치관·블라인드는 본인만)
4. 진영색(빨/파) X, 흑백 잉크/종이 톤
5. 4 대 함정 회피 (개인화·게이미피케이션·알림 폭격·광고)

## 다음 (Sprint 2)

`CLAUDE.md §6 Phase 4~7` — 주제 만들기(AI 정제) · 사상검증(12 Likert) · 오늘의 3문항(블라인드) · 내 정보 자기 거울. AI 통합은 초기에 *Max 요금제 안 `claude -p` 헤드리스* 로 시작, 나중에 Anthropic API + OpenAI + Gemini 3개 fallback router 로 확장.
