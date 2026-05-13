import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // 1시간 캐시

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Latest Pin.createdAt represents the freshest activity on a board (new opinion).
  // Board.updatedAt only fires on board-field edits, so we MAX with the latest pin time.
  const boards = await prisma.board.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      updatedAt: true,
      pins: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/proposal`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const boardEntries: MetadataRoute.Sitemap = boards.map((b) => {
    const latestPinAt = b.pins[0]?.createdAt;
    const lastModified =
      latestPinAt && latestPinAt > b.updatedAt ? latestPinAt : b.updatedAt;
    return {
      url: `${SITE_URL}/boards/${encodeURIComponent(b.id)}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    };
  });

  return [...base, ...boardEntries];
}
