"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function useNavigationEvent(
  onEnter: (url: string) => void,
  onLeave: () => void
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const url = pathname + searchParams.toString();
    onEnter(url);
    return () => {
      onLeave();
    };
  }, [pathname, searchParams, onEnter, onLeave]);
}
