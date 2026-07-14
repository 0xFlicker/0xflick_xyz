import { Providers } from "@/app/providers";
import { Layout } from "@/components/Layout";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen w-full">
        <Layout>{children}</Layout>
      </div>
    </Providers>
  );
}
