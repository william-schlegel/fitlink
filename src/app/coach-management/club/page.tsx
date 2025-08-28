import Title from "@/components/title";
import createLink from "@/lib/createLink";
import { getClubsForManager } from "@/server/api/routers/clubs";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import SelectClub from "./selectClub";
import { getActualUser } from "@/lib/auth/server";
import Link from "next/link";
import { getCoachById, getCoachsForClub } from "@/server/api/routers/coachs";
import { isCUID } from "@/lib/utils";
import {
  AddCoachToClub,
  CoachDataPresentation,
} from "@/components/modals/manageClub";

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
  const headerList = await headers();
  const href = headerList.get("x-current-href");

  const queryClubs = await getClubsForManager(userId ?? user.id);
  if (queryClubs.length && !clubId)
    redirect(
      createLink({ clubId: queryClubs[0]?.id, coachId }, href),
      RedirectType.replace
    );

  let queryCoachs: Awaited<ReturnType<typeof getCoachsForClub>> = [];
  if (isCUID(clubId)) {
    queryCoachs = await getCoachsForClub(clubId);
    if (queryCoachs.length && !coachId)
      redirect(
        createLink({ clubId, coachId: queryCoachs[0]?.id }, href),
        RedirectType.replace
      );
  }
  let queryCoach: Awaited<ReturnType<typeof getCoachById>> | undefined =
    undefined;
  if (isCUID(coachId)) {
    queryCoach = await getCoachById(coachId);
  }

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("common.navigation.coach-management")} />
      <h1 className="flex items-center">
        {t("common.navigation.coach-management")}

        <SelectClub clubId={clubId} clubs={queryClubs} />
      </h1>
      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="min-w-fit space-y-2 lg:max-w-xs">
          <h4>{t("club.coach.coachs")}</h4>
          <AddCoachToClub clubId={clubId} userId={userId} />
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryCoachs?.map((coach) => (
              <li key={coach.id}>
                <Link
                  href={createLink({ clubId, coachId: coach.id }, href)}
                  className={`w-full text-center ${
                    coachId === coach.id ? "active" : ""
                  }`}
                >
                  {coach.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
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
              queryCoach.coachData?.certifications?.map((cert) => ({
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
      </div>
    </div>
  );
}
