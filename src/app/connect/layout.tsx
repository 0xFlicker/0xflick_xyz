import { type Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: {
    template: "%s - Flick",
    default: "Connect - Flick",
  },
  description:
    "Book time with Flick to discuss engineering leadership, AI systems, and platform work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
