import { type Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: {
    template: "%s - Flick",
    default: "Connect - Flick",
  },
  description:
    "Connect with Flick about Principal Architect roles, production AI, platform leadership, or selected advisory work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
