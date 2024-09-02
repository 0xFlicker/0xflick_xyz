"use client";
import { FC, useEffect, useState } from "react";
import { useSpring, animated } from "react-spring";
import NextLink from "next/link";
import Image from "next/image";
import React from "react";
import clsx from "clsx";

const AnimatedDiv = animated.div;

interface LinkCardProps {
  to: string;
  content: string | JSX.Element;
  headerTitle: string;
  CardMediaProps?: {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
  };
  delay: number;
}

const createSpringProps = (
  delay: number,
  isMounted: boolean
): Parameters<
  typeof useSpring<{
    to: {
      opacity: number;
      x: string;
    };
    from: {
      opacity: number;
      x: string;
    };
    delay: number;
  }>
>[0] => ({
  to: {
    opacity: isMounted ? 1 : 0,
    x: isMounted ? "0%" : "200%",
  },
  from: {
    opacity: 0,
    x: "200%",
  },
  delay,
});

export const AnimatedLinkCard: FC<LinkCardProps> = ({
  to,
  content,
  headerTitle,
  CardMediaProps,
  delay,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const springProps = useSpring(createSpringProps(delay, isMounted));
  const AnimatedDiv = animated.div;

  return (
    <AnimatedDiv
      className="border border-brand-light dark:border-brand-dark hover:shadow-lg rounded-lg overflow-hidden h-full flex flex-col "
      style={springProps}
    >
      <NextLink
        href={to}
        className="transition block hover:border-brand-dark dark:border-brand-light hover:text-brand-dark dark:hover:text-brand-light-400  h-full flex flex-col"
      >
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{headerTitle}</h2>
        </div>

        {CardMediaProps && (
          <div className="flex-grow flex items-center justify-center bg-gray-950 ">
            <Image
              src={CardMediaProps.src}
              alt={CardMediaProps.alt}
              className={clsx(
                "object-contain object-center w-full h-full",
                CardMediaProps.className
              )}
              width={CardMediaProps.width ?? 400}
              height={CardMediaProps.height ?? 400}
            />
          </div>
        )}
        <div className="p-4">{content}</div>
      </NextLink>
    </AnimatedDiv>
  );
};
