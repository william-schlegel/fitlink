import { getTranslations } from "next-intl/server";
import PublishPageButton from "./publisPageButton";
import Link from "next/link";
import Title from "@/components/title";
import { getActualUser } from "@/lib/auth/server";
import { redirect, RedirectType } from "next/navigation";
import { getPageForCoach } from "@/server/api/routers/page";
import { CoachCreation } from "@/components/sections/coach";

export default async function CoachPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getActualUser();
  if (!user) redirect("/", RedirectType.replace);
  if (
    user.internalRole !== "COACH" &&
    user.internalRole !== "ADMIN" &&
    user.internalRole !== "MANAGER_COACH"
  )
    redirect("/", RedirectType.replace);
  const t = await getTranslations("pages");
  const queryPage = await getPageForCoach(userId);

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("coach.manage-page")} />
      <h1 className="flex flex-wrap items-center justify-between">
        <span>{t("coach.manage-page")}</span>

        {queryPage?.id ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="pill">
              <PublishPageButton
                userId={userId}
                checked={queryPage.published ?? false}
                pageId={queryPage.id}
              />
            </div>

            <Link
              href={`/presentation-page/coach/${userId}/${queryPage.id}`}
              target="_blank"
              referrerPolicy="no-referrer"
              className="btn btn-primary flex gap-2"
            >
              {t("page-preview")}
              <i className="bx bx-link-external bx-xs" />
            </Link>
          </div>
        ) : null}
      </h1>
      {queryPage?.id ? (
        <CoachCreation userId={userId} pageId={queryPage.id} />
      ) : (
        <div>Error</div>
      )}
    </div>
  );
}
