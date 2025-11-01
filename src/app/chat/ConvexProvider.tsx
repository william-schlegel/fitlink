"use client";

import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex/client";

export function ChatConvexProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
