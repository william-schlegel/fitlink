import { RoleEnum } from "@/db/schema/enums";
import { getActualUser } from "@/lib/auth/server";
import { ROLE_LIST } from "@/lib/data";
import { TRPCError } from "@trpc/server";

export async function isAdmin(throwError: boolean = true) {
  const user = await getActualUser();
  if (user?.role !== "ADMIN") {
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

export function getRoleName(role: RoleEnum) {
  return ROLE_LIST.find((r) => r.value === role)?.label ?? "???";
}
