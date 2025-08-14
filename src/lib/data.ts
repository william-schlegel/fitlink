import { RoleEnum } from "@/db/schema/enums";

export const ROLE_LIST: Array<{ label: string; value: RoleEnum }> = [
  { label: "user", value: "MEMBER" },
  { label: "coach", value: "COACH" },
  { label: "manager", value: "MANAGER" },
  { label: "manager-coach", value: "MANAGER_COACH" },
  { label: "admin", value: "ADMIN" },
] as const;
