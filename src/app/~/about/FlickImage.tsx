"use client";
import { FC, use, useEffect, useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import Image from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";

interface AnimatedImageProps {
  src: string | StaticImport;
  alt: string;
  sizes: string;
  className?: string;
  delay?: number;
}

export const FlickImage: FC<AnimatedImageProps> = ({
  src,
  alt,
  sizes,
  className,
  delay
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isMdScreen = window.matchMedia("(min-width: 768px)").matches;

  const springProps = useSpring({
    from: {
      transform: `${
        isMdScreen ? "translateX(200%)" : "translateX(400%)"
      } rotate(0deg)`,
    },
    to: async (next) => {
      if (isMounted) {
        await next({ transform: "translateX(0%) rotate(0deg)" });
        await next({ transform: "translateX(0%) rotate(3deg)" });
      }
    },
    delay,
    config: { tension: 200, friction: 15 },
  });
  return (
    <animated.div style={springProps} className="lg:pl-20">
      <div className="max-w-xs px-2.5 lg:max-w-none">
        <Image
          src={src}
          alt={alt}
          sizes={sizes}
          className={`aspect-square rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800 ${className}`}
        />
      </div>
    </animated.div>
  );
};
