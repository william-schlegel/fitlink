import { TRPCError } from "@trpc/server";

import { getActualUser } from "@/lib/auth/server";
import { RoleEnum } from "@/db/schema/enums";
import { ROLE_LIST } from "@/lib/data";

export async function isAdmin(throwError: boolean = true) {
  const user = await getActualUser();
  if (user?.internalRole !== "ADMIN") {
    if (throwError) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not admin",
      });
    }
    return null;
  }
  return user;
}

export async function hasRole(roles: RoleEnum[], throwError: boolean = true) {
  const user = await getActualUser();
  if (!roles.includes(user?.internalRole ?? "MEMBER")) {
    if (throwError) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not allowed to do this",
      });
    }
    return null;
  }
  return user;
}

export function getRoleName(internalRole: RoleEnum) {
  return ROLE_LIST.find((r) => r.value === internalRole)?.label ?? "???";
}
