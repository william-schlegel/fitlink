import { getTranslations } from "next-intl/server";
import { redirect, RedirectType } from "next/navigation";

import {
  LayoutPage,
  LayoutPageContent,
  LayoutPageList,
  LayoutPageMain,
} from "@/components/layoutPage";
import { CreatePlanning } from "@/components/modals/managePlanning";
import { PlanningName } from "@/components/planningName";
import SelectClub from "@/components/selectClub";
import { getActualUser } from "@/lib/auth/server";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getPlanningsForClub } from "@/server/api/routers/planning";
import { PlanningContent } from "./planningContent";

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

  const href = await getHref();
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const queryClubs = await caller.clubs.getClubsForManager(userId ?? user.id);
  if (queryClubs.length && !clubId)
    redirect(
      createLink({ clubId: queryClubs[0]?.id, planningId }, href),
      RedirectType.replace,
    );

  const queryPlannings = await getPlanningsForClub(clubId);

  if (!planningId && queryPlannings.length)
    redirect(
      createLink({ clubId, planningId: queryPlannings[0]?.id }, href),
      RedirectType.replace,
    );

  const planningList = queryPlannings.map((planning) => ({
    id: planning.id,
    name: <PlanningName actualPlanning={planning} variant="simple" />,
    link: createLink({ clubId, planningId: planning.id }, href),
  }));

  return (
    <LayoutPage
      title={t("planning-management")}
      titleComponents={<SelectClub clubs={queryClubs} clubId={clubId} />}
    >
      <CreatePlanning clubId={clubId} />
      <LayoutPageMain>
        <LayoutPageList
          list={planningList}
          itemId={planningId}
          noItemsText={t("no-plannings")}
        />
        <LayoutPageContent>
          {planningId ? (
            <PlanningContent
              clubId={clubId}
              planningId={planningId}
              userId={userId ?? user.id}
            />
          ) : null}
        </LayoutPageContent>
      </LayoutPageMain>
    </LayoutPage>
  );
}
