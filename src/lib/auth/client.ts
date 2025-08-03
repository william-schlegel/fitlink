import { env } from "@/env";
import { createAuthClient } from "better-auth/react";
import { trpc } from "../trpc/client";
import { isCUID } from "../utils";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_HOSTNAME,
  plugins: [magicLinkClient()],
});

export const { useSession } = authClient;

export function useUser() {
  const { data } = useSession();
  const userId = data?.user.id;
  const user = trpc.users.getUserById.useQuery(userId ?? "", {
    enabled: isCUID(userId),
  });
  return user;
}
