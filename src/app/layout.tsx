import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/tailwind.css";
import {
  professionalTitle,
  siteDescription,
  siteName,
  socialImage,
  siteTitle,
  siteUrl,
} from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_URL ?? siteUrl),
  applicationName: siteName,
  title: {
    template: "Flick - %s",
    default: siteTitle,
  },
  description: siteDescription,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  keywords: [
    professionalTitle,
    "hands-on engineering leadership",
    "production AI systems",
    "platform engineering",
    "distributed systems",
    "developer experience",
    "monetization systems",
  ],
  icons: {
    icon: "/flick.png",
    apple: "/flick.png",
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: siteTitle,
    url: "/",
    description: siteDescription,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    description: siteDescription,
    title: siteTitle,
    images: [socialImage],
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteName,
  url: siteUrl,
  jobTitle: professionalTitle,
  description: siteDescription,
  sameAs: ["https://github.com/0xflicker", "https://x.com/0xflick"],
  knowsAbout: [
    "Production AI systems",
    "Platform engineering",
    "Distributed systems",
    "Developer experience",
    "Monetization systems",
    "Web3 systems",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} flex min-h-full bg-zinc-50 dark:bg-black`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
