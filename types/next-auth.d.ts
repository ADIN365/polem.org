// NextAuth Session 에 끝장토론 고유 필드 추가 (callbacks.session 과 일치).
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      nickname: string | null;
      role: string;
      banned: boolean;
    };
  }
}
