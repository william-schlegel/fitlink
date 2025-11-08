import { redirect, RedirectType } from "next/navigation";

import { getTranslations } from "next-intl/server";

import SelectCoachManager from "../manager-coach/selectCoachManager";
import { getActualUser } from "@/lib/auth/server";

export default async function PlanningManagement() {
  const user = await getActualUser();
  const t = await getTranslations("planning");
  if (user?.internalRole === "MANAGER_COACH" || user?.internalRole === "ADMIN")
    return (
      <div className="container mx-auto my-2 space-y-2 p-2">
        <h1>{t("planning-management")} </h1>
        <SelectCoachManager
          hrefCoach={"/planning-management/coach"}
          hrefManager={"/planning-management/club"}
        />
      </div>
    );
  if (user?.internalRole === "MANAGER")
    redirect("/planning-management/club", RedirectType.replace);
  if (user?.internalRole === "COACH")
    redirect("/planning-management/coach", RedirectType.replace);
  return <div>You are not allowed to use this page</div>;
}
