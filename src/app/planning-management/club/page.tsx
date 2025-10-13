import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { getPlanningsForClub } from "@/server/api/routers/planning";
import { PlanningName } from "@/components/planningName";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { PlanningContent } from "./planningContent";
import { getActualUser } from "@/lib/auth/server";
import SelectClub from "@/components/selectClub";
import createLink from "@/lib/createLink";

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
      <LayoutPage.Main>
        <LayoutPage.List
          list={planningList}
          itemId={planningId}
          noItemsText={t("no-plannings")}
        />
        <LayoutPage.Content>
          {planningId ? (
            <PlanningContent
              clubId={clubId}
              planningId={planningId}
              userId={userId ?? user.id}
            />
          ) : null}
        </LayoutPage.Content>
      </LayoutPage.Main>
    </LayoutPage>
  );
}
