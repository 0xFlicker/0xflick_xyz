import type { Metadata } from "next";

export const professionalName = "John Dean";
export const brandName = "Flick";
export const publishingName = "0xFlicker";
export const siteName = `${professionalName} / ${brandName}`;
export const siteUrl = "https://www.flick.ing";
export const professionalTitle = "Principal Architect";
export const siteTitle = `${siteName} — ${professionalTitle}`;

export const siteDescription =
  "John Dean / Flick, Principal Architect and hands-on engineer building AI systems, developer tools, and games. Creator of The House. Based in Colorado.";

export const profileLinks = {
  github: "https://github.com/0xFlicker",
  originalGithub: "https://github.com/CaptEmulation",
  linkedIn: "https://www.linkedin.com/in/john-dean-iii-27190945",
  email: "mailto:me@0xflick.xyz",
} as const;

export const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${siteName}, ${professionalTitle} and creator of The House`,
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
