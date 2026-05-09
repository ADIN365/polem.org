import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/boards/", "/login", "/terms", "/privacy", "/policy"],
        disallow: ["/api/", "/admin", "/admin/", "/onboarding/", "/me", "/three", "/three/reveal", "/notifications", "/post-login", "/banned"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
