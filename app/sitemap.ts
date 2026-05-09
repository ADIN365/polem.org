import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // 1시간 캐시

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const boards = await prisma.board.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/proposal`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const boardEntries: MetadataRoute.Sitemap = boards.map((b) => ({
    url: `${SITE_URL}/boards/${encodeURIComponent(b.id)}`,
    lastModified: b.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...base, ...boardEntries];
}
