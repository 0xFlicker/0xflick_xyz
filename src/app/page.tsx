import type { Metadata } from "next";

import { PortfolioHome } from "@/components/PortfolioHome";
import { SiteShell } from "@/components/SiteShell";
import { siteDescription } from "@/lib/site";

export const metadata: Metadata = {
  title: "Principal engineer building AI platforms and internet-scale products",
  description: siteDescription,
};

export default function Page() {
  return (
    <SiteShell>
      <PortfolioHome />
    </SiteShell>
  );
}
