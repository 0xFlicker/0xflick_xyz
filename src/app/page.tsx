import { PortfolioHome } from "@/components/PortfolioHome";
import { SiteShell } from "@/components/SiteShell";
import { createPageMetadata, siteDescription } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Principal Architect turning emerging platforms into production systems",
  description: siteDescription,
  path: "/",
});

export default function Page() {
  return (
    <SiteShell>
      <PortfolioHome />
    </SiteShell>
  );
}
