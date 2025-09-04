import { getActualUser } from "@/lib/auth/server";
import { getClubById } from "@/server/api/routers/clubs";
import { getCoachById, getCoachsForClub } from "@/server/api/routers/coachs";
import createLink, { createHref } from "@/lib/createLink";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Title from "@/components/title";
import {
  AddCoachToClub,
  CoachDataPresentation,
} from "@/components/modals/manageClub";
import Link from "next/link";
import { headers } from "next/headers";
import { twMerge } from "tailwind-merge";
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
  const clubQuery = await getClubById(clubId, userId);
  const coachsQuery = await getCoachsForClub(clubId);
  const headerList = await headers();
  const href = headerList.get("x-current-href");
  if (coachsQuery.length && !coachId)
    redirect(createLink({ coachId: coachsQuery[0]?.id }, href));

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title
        title={t("coach.manage-my-coachs", {
          count: coachsQuery?.length ?? 0,
        })}
      />
      <header className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="space-x-2">
            <span className="text-secondary">{clubQuery?.name}</span>
            <span>
              {t("coach.manage-my-coachs", {
                count: coachsQuery?.length ?? 0,
              })}
            </span>
          </h1>
        </div>
        <div className="flex gap-4">
          <AddCoachToClub clubId={clubId} userId={userId} />
          <Link
            className="btn-outline btn btn-primary"
            href={createHref(href, ["manager", userId, "clubs"], { clubId })}
          >
            {t("coach.back-to-clubs")}
          </Link>
        </div>
      </header>
      <aside className="flex gap-4">
        <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
          {coachsQuery?.map((coach) => (
            <li key={coach.id}>
              <Link
                href={createLink({ coachId: coach.id })}
                className={twMerge(
                  "w-full text-center",
                  coachId === coach.id && "badge badge-primary"
                )}
              >
                {coach.name}
              </Link>
            </li>
          ))}
        </ul>

        {coachId === "" ? null : (
          <CoachContent clubId={clubId} coachId={coachId} />
        )}
      </aside>
    </div>
  );
}

type CoachContentProps = {
  clubId: string;
  coachId: string;
};

export async function CoachContent({ coachId, clubId }: CoachContentProps) {
  const t = await getTranslations("club");
  const queryCoach = await getCoachById(coachId);
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
