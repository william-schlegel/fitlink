import { headers } from "next/headers";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/lib/trpc/server";
import { getActualUser } from "../auth/server";

/**
 * Request-scoped caller: safe inside Server Components/Route Handlers.
 */
export async function createTrpcCaller() {
  if (!appRouter) return;
  const user = await getActualUser();

  const caller = appRouter.createCaller({
    headers: await headers(),
    user,
  });
  return caller;
}

/**
 * Build/ISR-safe caller: DOES NOT use next/headers().
 * Use this in generateStaticParams/generateMetadata or any pre-render code.
 */
export async function createTrpcCallerStatic() {
  if (!appRouter) return;
  const ctx = await createTRPCContext({ headers: new Headers() });
  return appRouter.createCaller(ctx);
}
