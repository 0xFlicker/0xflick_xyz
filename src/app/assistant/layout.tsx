import type { Metadata } from "next";

import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Local AI Assistant",
  description:
    "A private, browser-local AI assistant powered by Chrome's on-device model.",
  alternates: { canonical: "/assistant" },
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
