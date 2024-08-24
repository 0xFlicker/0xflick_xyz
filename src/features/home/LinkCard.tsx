import { CSSProperties, FC, ReactNode } from "react";
import NextLink from "next/link";
import Image from "next/image";

export const LinkCard: FC<{
  to: string;
  content: ReactNode;
  headerTitle: ReactNode;
  CardMediaProps?: {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
  };
  style?: CSSProperties;
}> = ({ to, content, headerTitle, CardMediaProps, style }) => {
  console.log("LinkCard", CardMediaProps);

  return (
    <div
      className="border border-gray-300 rounded-lg overflow-hidden"
      style={style}
    >
      <NextLink href={to} className="block hover:bg-gray-700">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{headerTitle}</h2>
        </div>  

        {CardMediaProps && (
          <Image
            src={CardMediaProps.src}
            alt={CardMediaProps.alt}
            className={`w-full ${CardMediaProps.className}`}
            width={CardMediaProps.width ?? 400}
            height={CardMediaProps.height ?? 400}
          />
        )}
        <div className="p-4">{content}</div>
      </NextLink>
    </div>
  );
};
