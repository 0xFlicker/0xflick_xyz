import type { Metadata } from "next";
import isMobile from "is-mobile";
import { headers } from "next/headers";

import Home from "@/features/home/index";

export const metadata: Metadata = {
  title: "Interactive intro",
  description: "The original interactive WebGL introduction to flick.ing.",
};

export default function IntroPage() {
  const headerList = headers();

  return (
    <Home isMobile={isMobile({ ua: headerList.get("user-agent") ?? "" })} />
  );
}
