import { PortfolioHome } from "@/components/PortfolioHome";
import { SiteShell } from "@/components/SiteShell";
import { createPageMetadata, siteDescription, siteTitle } from "@/lib/site";

export const metadata = createPageMetadata({
  title: siteTitle,
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
