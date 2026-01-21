import { headers } from "next/headers";

import { appRouter } from "@/server/api/root";
import { getActualUser } from "../auth/server";

export async function createTrpcCaller() {
  if (!appRouter) return;
  const user = await getActualUser();

  const caller = appRouter.createCaller({
    headers: await headers(),
    user,
  });
  return caller;
}
