import { adminClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "@/env";
import { GetUserByIdOptions } from "@/server/api/routers/users";
import { trpc } from "../trpc/client";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_HOSTNAME,
  plugins: [magicLinkClient(), adminClient()],
});

export const { useSession } = authClient;

export function useUser(options?: GetUserByIdOptions) {
  const { data } = useSession();
  const userId = data?.user.id;
  const user = trpc.users.getUserById.useQuery(
    { id: userId ?? "", options },
    {
      enabled: !!userId && typeof userId == "string",
    },
  );
  return user;
}
