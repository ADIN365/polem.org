# 끝장토론 (polem.org)

한국어 정치 토론 플랫폼. 의제별 *좌우 분할(찬/반)* 영구 보관 + AI 50:50 요약 + 블라인드 답변 자기 거울.

명세 · 디자인 데모는 같은 디렉토리의 `CLAUDE.md`, `MAPPING.md`, `polem.html` 참조.

## 진행 상황 (Sprint 1, 2026-05-09~)

- [x] Phase 0 — Next.js 14 + Prisma + NextAuth 골격, 디자인 토큰, 레이아웃
- [ ] Phase 1 — 카카오 OAuth + User 모델 + 닉네임 온보딩
- [ ] Phase 2 — 의제 색인 + 게시판 읽기 전용
- [ ] Phase 3 — 박제 + 동조 + 댓글 + 인용 박제 + 출처 도전

전체 Phase 0~13 은 `CLAUDE.md §6` 참조.

## 시작하기

### 1) 의존성 설치

```bash
npm install
```

### 2) Neon (PostgreSQL) 연결

1. <https://neon.tech> 가입 → 새 프로젝트 (region: Singapore 권장)
2. Connection string 복사
3. `.env` 생성 후 `DATABASE_URL` 채우기 (`.env.example` 참고)
4. 마이그레이션 적용:
   ```bash
   npx prisma migrate dev --name init
   ```

### 3) NextAuth Secret

```bash
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
```

### 4) 카카오 OAuth (Phase 1 시작 전)

1. <https://developers.kakao.com> 로그인
2. *내 애플리케이션* → 새 앱 (앱명: 끝장토론)
3. *플랫폼 설정* → Web → 사이트 도메인 `http://localhost:3000` 추가 (런칭 시 `https://polem.org` 추가)
4. *카카오 로그인* → 활성화 → Redirect URI: `http://localhost:3000/api/auth/callback/kakao`
5. *카카오 로그인 → 동의항목* → 닉네임(필수), 이메일(선택)
6. *보안* → Client Secret 활성화 → 코드 발급
7. `.env` 에 `KAKAO_CLIENT_ID` (REST API 키), `KAKAO_CLIENT_SECRET` 채우기

### 5) 개발 서버

```bash
npm run dev
```

`http://localhost:3000` 접속.

## 기술 스택

- **Next.js 14.2** (App Router) + **TypeScript**
- **Prisma 6** + **PostgreSQL** (Neon)
- **NextAuth v4** + **카카오 OAuth**
- **Tailwind CSS** + CSS Variables (디자인 토큰)
- **react-hot-toast**
- 호스팅: **Vercel** + **Cloudflare DNS-only**

## 디자인 헌법 (CLAUDE.md §2 — 절대 위반 금지)

1. AI 는 사서지 판사가 아님 (50:50 요약, 우열 판정 X)
2. 점수 합산 거부 (비추천 X, 게이미피케이션 X)
3. Private-by-Design (4축 가치관·블라인드는 본인만)
4. 진영색(빨/파) X, 흑백 잉크/종이 톤
5. 4 대 함정 회피 (개인화·게이미피케이션·알림 폭격·광고)
