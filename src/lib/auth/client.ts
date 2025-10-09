import { magicLinkClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { GetUserByIdOptions } from "@/server/api/routers/users";
import { trpc } from "../trpc/client";
import { env } from "@/env";

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
