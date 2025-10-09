import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { getActualUser } from "@/lib/auth/server";

export default async function CoachManagement() {
  const user = await getActualUser();
  const t = await getTranslations("planning");
  if (user?.internalRole === "MANAGER_COACH" || user?.internalRole === "ADMIN")
    return (
      <div>
        <Link href={"/planning-management/coach"}>{t("coach")}</Link>
        <Link href={"/planning-management/club"}>{t("club")}</Link>
      </div>
    );
  if (user?.internalRole === "MANAGER")
    redirect("/coach-management/club", RedirectType.replace);
  return <div>You are not allowed to use this page</div>;
}
