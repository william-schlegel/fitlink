import { redirect, RedirectType } from "next/navigation";
import { inferProcedureOutput } from "@trpc/server";
import { getTranslations } from "next-intl/server";

import {
  AddCoachToClub,
  CoachDataPresentation,
} from "@/components/modals/manageClub";
import SelectClub from "../../../components/selectClub";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { AppRouter } from "@/server/api/root";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { isCUID } from "@/lib/utils";

export default async function CoachManagementForClub({
  searchParams,
}: {
  searchParams: Promise<{
    clubId: string;
    userId: string;
    coachId: string;
  }>;
}) {
  const { userId, clubId, coachId } = await searchParams;
  const user = await getActualUser();
  if (
    !user ||
    (user.internalRole !== "MANAGER" &&
      user.internalRole !== "MANAGER_COACH" &&
      user.internalRole !== "ADMIN")
  )
    redirect("/", RedirectType.replace);

  const t = await getTranslations();
  const href = await getHref();

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const queryClubs = await caller.clubs.getClubsForManager(userId ?? user.id);
  if (queryClubs.length && !clubId)
    redirect(
      createLink({ clubId: queryClubs[0]?.id, coachId }, href),
      RedirectType.replace,
    );

  let queryCoachs: inferProcedureOutput<
    AppRouter["coachs"]["getCoachsForClub"]
  > = [];
  if (isCUID(clubId)) {
    queryCoachs = await caller.coachs.getCoachsForClub(clubId);
    if (queryCoachs.length && !coachId)
      redirect(
        createLink({ clubId, coachId: queryCoachs[0]?.id }, href),
        RedirectType.replace,
      );
  }
  let queryCoach:
    | inferProcedureOutput<AppRouter["coachs"]["getCoachById"]>
    | undefined = undefined;
  if (isCUID(coachId)) {
    queryCoach = await caller.coachs.getCoachById(coachId);
  }

  const coachList = queryCoachs.map((coach) => ({
    id: coach.id,
    name: coach.name,
    link: createLink({ clubId, coachId: coach.id }, href),
  }));

  return (
    <LayoutPage
      preTitle={queryClubs[0]?.name}
      title={t("common.navigation.coach-management")}
      titleComponents={
        <div className="flex items-center gap-2 justify-between">
          <AddCoachToClub clubId={clubId} userId={userId} />
          <SelectClub clubId={clubId} clubs={queryClubs} />
        </div>
      }
    >
      <LayoutPage.Main>
        <LayoutPage.List
          list={coachList}
          itemId={coachId}
          noItemsText={t("coach.no-coachs")}
        />
        {queryCoach ? (
          <CoachDataPresentation
            url={queryCoach.imageUrl}
            activityGroups={
              queryCoach.coachData?.activityGroups?.map((ag) => ({
                id: ag.id,
                name: ag.name,
              })) ?? []
            }
            certifications={
              queryCoach?.certificationModules?.map((cert) => ({
                id: cert.id,
                name: cert.name,
                modules: cert.modules.map((mod) => ({
                  id: mod.id,
                  name: mod.name,
                })),
              })) ?? []
            }
            rating={queryCoach.coachData?.rating ?? 0}
            id={queryCoach.id ?? ""}
            pageId={queryCoach.coachData?.page?.id}
          />
        ) : null}
      </LayoutPage.Main>
    </LayoutPage>
  );
}
