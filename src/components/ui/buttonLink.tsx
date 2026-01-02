"use client";

import Link from "next/link";
import type { PropsWithChildren } from "react";

import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

export default function ButtonLink({
  href,
  children,
  className,
  variant = "default",
}: PropsWithChildren<{
  href: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}>) {
  return (
    <Button asChild variant={variant} className={cn(className)}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
