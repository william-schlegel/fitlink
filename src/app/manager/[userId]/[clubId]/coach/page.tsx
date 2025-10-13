import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import {
  AddCoachToClub,
  CoachDataPresentation,
} from "@/components/modals/manageClub";
import createLink, { createHref } from "@/lib/createLink";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { CoachPlanning } from "./coachPlanning";

export default async function ManageCoachs({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; clubId: string }>;
  searchParams: Promise<{ coachId: string }>;
}) {
  const user = await getActualUser();
  if (!user) redirect("/");
  const t = await getTranslations("club");
  if (
    user.internalRole !== "MANAGER" &&
    user.internalRole !== "MANAGER_COACH" &&
    user.internalRole !== "ADMIN"
  )
    return <div>{t("manager-only")}</div>;
  const { userId, clubId } = await params;
  const coachId = (await searchParams).coachId;
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const clubQuery = await caller.clubs.getClubById({ clubId, userId });

  const coachsQuery = await caller.coachs.getCoachsForClub(clubId);
  const headerList = await headers();
  const href = headerList.get("x-current-href");
  if (coachsQuery.length && !coachId)
    redirect(createLink({ coachId: coachsQuery[0]?.id }, href));

  const coachList = coachsQuery.map((coach) => ({
    id: coach.id,
    name: coach.name,
    link: createLink({ coachId: coach.id }),
  }));

  return (
    <LayoutPage
      preTitle={clubQuery?.name}
      title={t("coach.manage-my-coachs", {
        count: coachsQuery?.length ?? 0,
      })}
      titleComponents={
        <div className="flex items-center gap-4 justify-between">
          <AddCoachToClub clubId={clubId} userId={userId} />
          <Link
            className="btn-outline btn btn-primary"
            href={createHref(href, ["manager", userId, "clubs"], { clubId })}
          >
            {t("coach.back-to-clubs")}
          </Link>
        </div>
      }
    >
      <LayoutPage.Main>
        <LayoutPage.List
          list={coachList}
          itemId={coachId}
          noItemsText={t("coach.no-coachs")}
        ></LayoutPage.List>

        {Boolean(coachId) ? (
          <CoachContent clubId={clubId} coachId={coachId} />
        ) : null}
      </LayoutPage.Main>
    </LayoutPage>
  );
}

type CoachContentProps = {
  clubId: string;
  coachId: string;
};

export async function CoachContent({ coachId, clubId }: CoachContentProps) {
  const t = await getTranslations("club");
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const queryCoach = await caller.coachs.getCoachById(coachId);
  if (!queryCoach) return <div>{t("coach.coach-unknown")}</div>;
  return (
    <section className="w-full space-y-4">
      <article className="flex gap-4">
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
      </article>
      <article className="rounded-md border border-primary p-2">
        <h2>{t("coach.weekly-planning")}</h2>
        <CoachPlanning coachId={coachId} clubId={clubId} />
      </article>
    </section>
  );
}
