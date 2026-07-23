import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { CATEGORIES } from "@/lib/categories";
import { getAllPublishedSlugs } from "@/lib/issues";

export const revalidate = 3600; // 1시간 캐시

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const issues = await getAllPublishedSlugs();

  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE_URL}/c/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...issues.map((i) => ({
      url: `${SITE_URL}/issue/${i.slug}`,
      lastModified: i.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
