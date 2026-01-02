import { TRPCError } from "@trpc/server";

import { getActualUser } from "@/lib/auth/server";
import { RoleEnum } from "@/db/schema/enums";
import { ROLE_LIST } from "@/lib/data";

// ==================== ASYNC AUTH HELPERS (fetch user from session) ====================

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

// ==================== SYNC AUTH HELPERS (use with tRPC ctx.user) ====================

export type UserContext = {
  id: string;
  internalRole: RoleEnum | null | undefined;
};

/**
 * Requires the user to be an admin. Throws UNAUTHORIZED if not.
 */
export function requireAdmin(user: UserContext) {
  if (user.internalRole !== "ADMIN") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin access required",
    });
  }
}

/**
 * Requires the user to be an admin OR the target user (self).
 * Useful for operations where users can modify their own data.
 */
export function requireAdminOrSelf(user: UserContext, targetUserId: string) {
  if (user.internalRole !== "ADMIN" && user.id !== targetUserId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this resource",
    });
  }
}

/**
 * Requires the user to be an admin OR the owner of a resource (e.g., manager of a club).
 */
export function requireAdminOrOwner(
  user: UserContext,
  ownerId: string | undefined | null,
) {
  if (user.internalRole !== "ADMIN" && user.id !== ownerId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to modify this resource",
    });
  }
}

/**
 * Requires the user to have one of the specified roles.
 */
export function requireRole(user: UserContext, roles: RoleEnum[]) {
  if (!user.internalRole || !roles.includes(user.internalRole)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You do not have the required role",
    });
  }
}
