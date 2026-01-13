"use client";

import Link from "next/link";

import type { PropsWithChildren } from "react";

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from "@/components/ui/shadcn/button";

export default function ButtonLink({
  href,
  children,
  className,
  variant = "default",
  size = "default",
}: PropsWithChildren<{
  href: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}>) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
