import type { Metadata } from "next";
import isMobile from "is-mobile";
import { headers } from "next/headers";

import Home from "@/features/home/index";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Interactive intro",
  description:
    "The original John Dean / Flick WebGL introduction, preserved as an interactive design artifact.",
  path: "/intro",
});

export default function IntroPage() {
  const headerList = headers();

  return (
    <Home isMobile={isMobile({ ua: headerList.get("user-agent") ?? "" })} />
  );
}
