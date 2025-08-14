"use client";

import { FeatureEnum, RoleEnum } from "@/db/schema/enums";
import { useEffect, useState } from "react";
import { useSession } from "./auth/client";
import { trpc } from "./trpc/client";
import { differenceInDays, isDate } from "date-fns";

export const ROLE_LIST: Array<{ label: string; value: RoleEnum }> = [
  { label: "user", value: "MEMBER" },
  { label: "coach", value: "COACH" },
  { label: "manager", value: "MANAGER" },
  { label: "manager-coach", value: "MANAGER_COACH" },
  { label: "admin", value: "ADMIN" },
] as const;

export function getRoleName(role: RoleEnum) {
  return ROLE_LIST.find((r) => r.value === role)?.label ?? "???";
}

export default function useUserInfo(userId?: string | null) {
  const [remainTrial, setRemainTrial] = useState(0);
  const [features, setFeatures] = useState<FeatureEnum[]>([]);
  const { data: sessionData } = useSession();

  const uId = userId ?? sessionData?.user?.id ?? "";

  const u = trpc.users.getUserById.useQuery(
    { id: uId, options: { withFeatures: true } },
    {
      enabled: typeof uId === "string",
    }
  );

  useEffect(() => {
    if (u.data) {
      setRemainTrial(
        isDate(u.data.trialUntil)
          ? differenceInDays(u.data.trialUntil, new Date())
          : 0
      );
      setFeatures(u.data.features ?? []);
    }
  }, [u.data]);

  return { trial: remainTrial > 0, remainTrial, features, user: u.data };
}
