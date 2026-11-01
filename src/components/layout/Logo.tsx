import Image from "next/image";

import { cn } from "@/utils/cn";

/** The HonyB drop mark on its own, for the loading state and small badges. Decorative: the brand name sits beside it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/honyb-mark.png"
      alt=""
      width={512}
      height={512}
      className={cn("size-9 object-contain", className)}
    />
  );
}

/** Full HonyB wordmark, with the drop as the O. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/honyb-wordmark.png"
      alt="HonyB"
      width={1200}
      height={396}
      className={cn("h-8 w-auto", className)}
    />
  );
}
