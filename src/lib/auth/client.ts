import { env } from "@/env";
import { createAuthClient } from "better-auth/react";
import { trpc } from "../trpc/client";
import { isCUID } from "../utils";
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_HOSTNAME,
});

export const { useSession } = authClient;

export function useUser() {
  const { data } = useSession();
  const userId = data?.user.id;
  const user = trpc.user.getById.useQuery(
    { id: userId ?? "" },
    {
      enabled: isCUID(userId),
    }
  );
  return user;
}
