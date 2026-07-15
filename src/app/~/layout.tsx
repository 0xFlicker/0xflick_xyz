import { type Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { siteDescription, siteTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    template: "%s - Flick",
    default: siteTitle,
  },
  description: siteDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
