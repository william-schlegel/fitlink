import { headers } from "next/headers";

import { getActualUser } from "../auth/server";
import { appRouter } from "@/server/api/root";

export async function createTrpcCaller() {
  if (!appRouter) return;
  const user = await getActualUser();

  const caller = appRouter.createCaller({
    headers: await headers(),
    user,
  });
  return caller;
}
