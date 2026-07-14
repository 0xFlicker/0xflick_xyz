import Image from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import clsx from "clsx";

interface FlickImageProps {
  src: string | StaticImport;
  alt: string;
  sizes: string;
  className?: string;
}

export function FlickImage({
  src,
  alt,
  sizes,
  className,
}: FlickImageProps) {
  return (
    <div className="lg:pl-8">
      <div className="max-w-xs px-2.5 lg:max-w-none">
        <Image
          src={src}
          alt={alt}
          sizes={sizes}
          className={clsx(
            "aspect-square rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800",
            className
          )}
        />
      </div>
    </div>
  );
}
