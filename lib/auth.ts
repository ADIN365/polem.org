import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import KakaoProvider from "next-auth/providers/kakao";

import { prisma } from "@/lib/prisma";

/**
 * Phase 0 골격 — KAKAO_CLIENT_ID/SECRET 미설정 시 Provider 비활성.
 * Phase 1 에서 카카오 디벨로퍼스 앱 등록 + 닉네임 온보딩 흐름 추가.
 */
const kakaoEnabled =
  !!process.env.KAKAO_CLIENT_ID && !!process.env.KAKAO_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: kakaoEnabled
    ? [
        KakaoProvider({
          clientId: process.env.KAKAO_CLIENT_ID!,
          clientSecret: process.env.KAKAO_CLIENT_SECRET!,
        }),
      ]
    : [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Prisma User 의 닉네임을 세션에 노출 (없으면 카카오 name 으로 fallback)
        const u = user as typeof user & {
          nickname?: string | null;
          role?: string;
          banned?: boolean;
        };
        session.user.nickname = u.nickname ?? null;
        session.user.role = u.role ?? "USER";
        session.user.banned = u.banned ?? false;
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
