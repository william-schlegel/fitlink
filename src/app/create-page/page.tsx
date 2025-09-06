import { getActualUser } from "@/lib/auth/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";

export default async function PageCreation() {
  const user = await getActualUser();
  const t = await getTranslations("planning");
  if (user?.internalRole === "MANAGER_COACH" || user?.internalRole === "ADMIN")
    return (
      <div>
        <Link href={"/create-page/coach"}>{t("coach")}</Link>
        <Link href={"/create-page/club"}>{t("club")}</Link>
      </div>
    );
  if (user?.internalRole === "MANAGER")
    redirect("/create-page/club", RedirectType.replace);
  if (user?.internalRole === "COACH")
    redirect("/create-page/coach", RedirectType.replace);
  return <div>You are not allowed to use this page</div>;
}
