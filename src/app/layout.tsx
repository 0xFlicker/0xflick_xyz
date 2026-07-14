import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/tailwind.css";
import { siteDescription, siteTitle } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_URL!),
  title: {
    template: "Flick - %s",
    default: siteTitle,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Flick",
    images: [
      {
        url: `/flick-cp.png`,
        width: 400,
        height: 400,
        alt: "Flick",
      },
    ],
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    creator: "@0xflick",
    images: [
      {
        url: `/flick-cp.png`,
        width: 400,
        height: 400,
        alt: "Flick",
      },
    ],
    description: siteDescription,
    title: siteTitle,
  },
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
        {children}
      </body>
    </html>
  );
}
