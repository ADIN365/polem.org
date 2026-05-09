import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";

import { prisma } from "@/lib/prisma";

/**
 * 한국 OAuth 표준 — 카카오 + 네이버. 환경변수 미설정 시 자동 비활성.
 */
const kakaoEnabled =
  !!process.env.KAKAO_CLIENT_ID && !!process.env.KAKAO_CLIENT_SECRET;
const naverEnabled =
  !!process.env.NAVER_CLIENT_ID && !!process.env.NAVER_CLIENT_SECRET;

const providers: Provider[] = [];
if (kakaoEnabled) {
  providers.push(
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  );
}
if (naverEnabled) {
  providers.push(
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // jwt 전략 — 매 페이지 마다 Session 테이블 SELECT 안 하게. nickname/role 변경 시 update() 필요.
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // 가입/로그인 직후, 그리고 update() 호출 시 호출됨
    async jwt({ token, user, trigger }) {
      // 첫 sign-in 또는 update() 트리거 시 DB 에서 최신 사용자 정보 동기화
      if (user) {
        // 가입 직후 — adapter 가 만든 Prisma User 가 user 로 들어옴
        token.id = user.id;
        const u = user as typeof user & {
          nickname?: string | null;
          role?: string;
          banned?: boolean;
        };
        token.nickname = u.nickname ?? null;
        token.role = u.role ?? "USER";
        token.banned = u.banned ?? false;
      } else if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { nickname: true, role: true, banned: true },
        });
        if (fresh) {
          token.nickname = fresh.nickname;
          token.role = fresh.role;
          token.banned = fresh.banned;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.nickname = (token.nickname as string | null) ?? null;
        session.user.role = (token.role as string) ?? "USER";
        session.user.banned = (token.banned as boolean) ?? false;
      }
      return session;
    },
  },
  events: {
    // 신규 가입 시 빈 PrismScore row 생성 — Phase 5 Likert 답변으로 채움.
    async createUser({ user }) {
      try {
        await prisma.prismScore.create({
          data: { userId: user.id },
        });
      } catch {
        // PrismScore 가 이미 있거나 race 상황은 무시 (기능 차단 아님)
      }
    },
  },
};
