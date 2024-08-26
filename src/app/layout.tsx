import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/tailwind.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_URL!),
  title: {
    template: "Flick - %s",
    default: "Building the future of the web",
  },
  description:
    "The personal website of Flick, an experienced software engineer in Colorado, USA",
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
    description:
      "The personal website of Flick, an experienced software engineer in Colorado, USA",
    title: "Building the future of the web",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
