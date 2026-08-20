import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import {
  assistantBrowserTitle,
  assistantDescription,
  assistantShareTitle,
  assistantSocialImage,
} from "@/features/assistant/metadata";

export const metadata: Metadata = {
  title: { absolute: assistantBrowserTitle },
  description: assistantDescription,
  alternates: { canonical: "/assistant" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: assistantBrowserTitle,
    title: assistantShareTitle,
    description: assistantDescription,
    url: "/assistant",
    images: [assistantSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: assistantShareTitle,
    description: assistantDescription,
    images: [assistantSocialImage],
  },
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
