import { SiteShell } from "@/components/SiteShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
