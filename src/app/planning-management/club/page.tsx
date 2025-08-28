import { PlanningName } from "@/components/planningName";
import SelectClub from "@/components/selectClub";
import Title from "@/components/title";
import { getActualUser } from "@/lib/auth/server";
import createLink from "@/lib/createLink";
import { getClubsForManager } from "@/server/api/routers/clubs";
import { getPlanningsForClub } from "@/server/api/routers/planning";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";
import { PlanningContent } from "./planningContent";
import { CreatePlanning } from "@/components/modals/managePlanning";

export default async function ClubPlanning({
  searchParams,
}: {
  searchParams: Promise<{
    clubId: string;
    userId: string;
    planningId: string;
  }>;
}) {
  const user = await getActualUser();
  if (!user) return redirect("/");
  if (
    user.internalRole !== "MANAGER" &&
    user.internalRole !== "MANAGER_COACH" &&
    user.internalRole !== "ADMIN"
  )
    return redirect("/", RedirectType.replace);
  const t = await getTranslations("planning");

  const { clubId, userId, planningId } = await searchParams;

  const headerList = await headers();
  const href = headerList.get("x-current-href");
  const queryClubs = await getClubsForManager(userId ?? user.id);
  if (queryClubs.length && !clubId)
    redirect(
      createLink({ clubId: queryClubs[0]?.id, planningId }, href),
      RedirectType.replace
    );

  const queryPlannings = await getPlanningsForClub(clubId);

  if (!planningId && queryPlannings.length)
    redirect(
      createLink({ clubId, planningId: queryPlannings[0]?.id }, href),
      RedirectType.replace
    );

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("planning-management")} />
      <h1 className="flex items-center">
        {t("planning-management")}
        <SelectClub clubs={queryClubs} clubId={clubId} />
      </h1>
      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="min-w-fit space-y-2 lg:max-w-xs">
          <h4>{t("plannings")}</h4>
          <CreatePlanning clubId={clubId} />
          <ul className="menu rounded border border-secondary bg-base-100">
            {queryPlannings?.map((planning) => (
              <li key={planning.id}>
                <div
                  className={`flex ${
                    planningId === planning.id ? "active" : ""
                  }`}
                >
                  <Link
                    href={createLink({ clubId, planningId: planning.id }, href)}
                    className="flex flex-1 items-center justify-between"
                  >
                    <PlanningName actualPlanning={planning} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {planningId ? (
          <PlanningContent
            clubId={clubId}
            planningId={planningId}
            userId={userId}
          />
        ) : null}
      </div>
    </div>
  );
}
