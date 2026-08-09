import type { MetadataRoute } from "next";

import { publicNavItems, siteUrl } from "@/lib/content/public-site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/request-access", ...publicNavItems.map((item) => item.href)];

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
