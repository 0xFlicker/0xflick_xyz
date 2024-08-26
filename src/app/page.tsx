import Home from "@/features/home/index";
import isMobile from "is-mobile";
import { headers } from "next/headers";

export default async function Page() {
  const headerList = headers();
  return (
    <Home isMobile={isMobile({ ua: headerList.get("user-agent") ?? "" })} />
  );
}
