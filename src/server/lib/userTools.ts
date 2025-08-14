import { getActualUser } from "@/lib/auth/server";
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
