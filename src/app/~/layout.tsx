import { type Metadata } from "next";
import { Providers } from "@/app/providers";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
  title: {
    template: "%s - Flick",
    default: "Building the future of the web",
  },
  description:
    "The personal website of Flick, an experienced software engineer in Colorado, USA",
  alternates: {
    types: {
      "application/rss+xml": `/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  );
}
