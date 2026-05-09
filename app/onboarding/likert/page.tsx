import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUESTIONS } from "@/lib/likert/questions";

import LikertRunner from "./LikertRunner";

export const metadata = { title: "가치관 측정" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: { next?: string };
}

export default async function LikertPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const next = sanitizeNext(searchParams.next) ?? "/me";

  if (!session?.user)
    redirect(`/login?callbackUrl=${encodeURIComponent(`/onboarding/likert?next=${next}`)}`);
  if (!session.user.nickname)
    redirect(`/onboarding/nickname?next=${encodeURIComponent(`/onboarding/likert?next=${next}`)}`);

  const score = await prisma.prismScore.findUnique({
    where: { userId: session.user.id },
    select: { likertCompletedAt: true },
  });
  if (score?.likertCompletedAt) redirect(next);

  return <LikertRunner questions={QUESTIONS} next={next} />;
}

function sanitizeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
