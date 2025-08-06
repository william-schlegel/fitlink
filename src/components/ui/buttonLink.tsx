"use client";

import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function ButtonLink({
  href,
  children,
  className,
}: PropsWithChildren<{ href: string; className: string }>) {
  const router = useRouter();
  return (
    <button className={className} onClick={() => router.push(href)}>
      {children}
    </button>
  );
}
