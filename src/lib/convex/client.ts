import { ConvexReactClient } from "convex/react";
import { env } from "@/env";

const convexUrl =
  env.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

if (!convexUrl) {
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL is not set. Convex features will not work.",
  );
}

export const convex = new ConvexReactClient(convexUrl);

