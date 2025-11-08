import { redirect, RedirectType } from "next/navigation";

import { getActualUser } from "@/lib/auth/server";

export default async function CoachManagement() {
  const user = await getActualUser();

  if (
    user?.internalRole === "MANAGER" ||
    user?.internalRole === "MANAGER_COACH" ||
    user?.internalRole === "ADMIN"
  )
    redirect("/coach-management/club", RedirectType.replace);
  return <div>You are not allowed to use this page</div>;
}
