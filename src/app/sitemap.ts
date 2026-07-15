import type { MetadataRoute } from "next";

import { navigationItems } from "@/lib/navigation";
import { siteUrl } from "@/lib/site";

const navigationRoutes = navigationItems.map(({ href }) => href);
const routes = [
  "",
  ...navigationRoutes.slice(0, 2),
  "/~/projects/archive",
  ...navigationRoutes.slice(2),
  "/intro",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "" ? "monthly" : "yearly",
    priority: route === "" ? 1 : route === "/intro" ? 0.2 : 0.7,
  }));
}
