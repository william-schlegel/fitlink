"use client";

import { startTransition, useEffect, useState } from "react";
import { differenceInDays, isDate } from "date-fns";

import { FeatureEnum } from "@/db/schema/enums";
import { useSession } from "./auth/client";
import { trpc } from "./trpc/client";

export default function useUserInfo(userId?: string | null) {
  const [remainTrial, setRemainTrial] = useState(0);
  const [features, setFeatures] = useState<FeatureEnum[]>([]);
  const { data: sessionData } = useSession();

  const uId = userId ?? sessionData?.user?.id ?? "";

  const u = trpc.users.getUserById.useQuery(
    { id: uId, options: { withFeatures: true } },
    {
      enabled: typeof uId === "string",
    },
  );

  useEffect(() => {
    if (u.data) {
      const userData = u.data;
      startTransition(() => {
        setRemainTrial(
          isDate(userData.trialUntil)
            ? differenceInDays(userData.trialUntil, new Date())
            : 0,
        );
        setFeatures(userData.features ?? []);
      });
    }
  }, [u.data]);

  return { trial: remainTrial > 0, remainTrial, features, user: u.data };
}
