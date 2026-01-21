import { getTranslations } from "next-intl/server";
import { redirect, RedirectType } from "next/navigation";

import { getActualUser } from "@/lib/auth/server";
import SelectCoachManager from "../manager-coach/selectCoachManager";

export default async function PageCreation() {
  const user = await getActualUser();
  const t = await getTranslations("pages");
  if (user?.internalRole === "MANAGER_COACH" || user?.internalRole === "ADMIN")
    return (
      <div className="container mx-auto my-2 space-y-2 p-2">
        <h1>{t("page-creation")} </h1>
        <SelectCoachManager
          hrefCoach={"/create-page/coach"}
          hrefManager={"/create-page/club"}
        />
      </div>
    );
  if (user?.internalRole === "MANAGER")
    redirect("/create-page/club", RedirectType.replace);
  if (user?.internalRole === "COACH")
    redirect("/create-page/coach", RedirectType.replace);
  return <div>You are not allowed to use this page</div>;
}
