import type { Metadata } from "next";

export const siteName = "Flick";
export const siteUrl = "https://www.flick.ing";
export const professionalTitle = "Principal Architect";
export const siteTitle = `${siteName} - ${professionalTitle}`;

export const siteDescription =
  "Flick is a Principal Architect and hands-on engineering leader who turns emerging platforms into production systems.";
export const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${siteTitle} turning emerging platforms into production systems`,
};

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}
