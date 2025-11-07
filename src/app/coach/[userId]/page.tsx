import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { getCoachDataForUserId } from "@/server/api/routers/dashboard";
import { getCoachDailyPlanning } from "@/server/api/routers/planning";
import LockedButton from "@/components/ui/lockedButton";
import { getToday } from "@/lib/dates/serverDayName";
import { createTrpcCaller } from "@/lib/trpc/caller";
import ButtonIcon from "@/components/ui/buttonIcon";
import SelectDay from "@/components/ui/selectDay";
import { getActualUser } from "@/lib/auth/server";
import { DayName } from "@/lib/dates/data";
import Title from "@/components/title";

export default async function CoachDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ day: DayName }>;
}) {
  const { userId } = await params;
  const searchParamsValue = await searchParams;
  const day = searchParamsValue?.day ?? getToday();
  const user = await getActualUser();
  if (!user || (user.internalRole !== "COACH" && user.internalRole !== "ADMIN"))
    redirect("/", RedirectType.replace);

  const coachQuery = await getCoachDataForUserId(userId);
  const t = await getTranslations();
  const clubCount = coachQuery?.coachData?.clubs?.length ?? 0;
  const certificationCount = coachQuery?.coachData?.certifications?.length ?? 0;
  const activityCount = coachQuery?.coachData?.activityGroups?.length ?? 0;
  const offerCount = coachQuery?.coachData?.coachingPrices?.length ?? 0;
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const { features } = await caller.users.getUserById({
    id: userId,
    options: {
      withFeatures: true,
    },
  });

  const published = coachQuery?.coachData?.page?.published;
  const clubs = coachQuery?.coachData?.clubs?.map((c) => c.club) ?? [];

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("dashboard.coach-dashboard")} />
      <h1 className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span>{t("dashboard.coach-dashboard")}</span>
          <span
            className={`rounded px-4 py-2 text-sm ${
              published
                ? "bg-success text-success-content"
                : "bg-warning text-warning-content"
            }`}
          >
            {published
              ? t("pages.page-published")
              : t("pages.page-unpublished")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {features.includes("COACH_CERTIFICATION") ? (
            <Link
              className="btn btn-secondary"
              href={`${userId}/certifications`}
            >
              {t("dashboard.manage-certifications")}
            </Link>
          ) : (
            <LockedButton label={t("dashboard.manage-certifications")} />
          )}
        </div>
      </h1>
      <section className="stats w-full shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-building bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.clubs", { count: clubCount })}
          </div>
          <div className="stat-value text-primary">{clubCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-award bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.certifications", { count: certificationCount })}
          </div>
          <div className="stat-value text-primary">{certificationCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-cycling bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.activities", { count: activityCount })}
          </div>
          <div className="stat-value text-primary">{activityCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-dollar bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.offers", { count: offerCount })}
          </div>
          <div className="stat-value text-primary">{offerCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-star bx-lg" />
          </div>
          <div className="stat-title">{t("dashboard.rating")}</div>
          <div className="stat-value text-primary">
            {coachQuery?.coachData?.rating?.toFixed(1) ??
              t("dashboard.unrated")}
          </div>
        </div>
      </section>
      {clubs.length > 0 && (
        <section className="rounded-md border border-primary p-2">
          <h2>{t("dashboard.clubs-working-with")}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        </section>
      )}
      <section className="grid auto-rows-auto gap-2 lg:grid-cols-2">
        <article className="rounded-md border border-primary p-2">
          <div className="flex items-center justify-between">
            <h2>{t("dashboard.planning")}</h2>
            <SelectDay day={day} redirectTo={`/coach/${userId}`} />
          </div>
          <DailyPlanning coachId={userId} day={day} />
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("dashboard.schedule")}</h2>
          {features.includes("COACH_MEETING") ? (
            <div></div>
          ) : (
            <div className="alert alert-error">
              {t("common.navigation.insufficient-plan")}
            </div>
          )}
        </article>
        <article className="col-span-full rounded-md border border-primary p-2">
          <h2>{t("dashboard.chat-members")}</h2>
        </article>
      </section>
    </div>
  );
}

async function ClubCard({
  club,
}: {
  club: { id: string; name: string; logoUrl: string | null; address: string };
}) {
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const t = await getTranslations("dashboard");
  const clubPages = await caller.clubs.getClubPagesForNavByClubId(club.id);
  const homePage = clubPages?.pages?.find((p) => p.target === "HOME");

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body">
        <div className="flex items-center gap-3">
          {club.logoUrl && (
            <div className="avatar">
              <div className="w-12 h-12 rounded-full">
                <Image
                  src={club.logoUrl}
                  alt={club.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base truncate p-0">{club.name}</h3>
            <p className="text-xs text-base-content/70 truncate">
              {club.address}
            </p>
          </div>
          {homePage && (
            <Link
              href={`/presentation-page/club/${club.id}/${homePage.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <ButtonIcon
                iconComponent={<i className="bx bx-link-external" />}
                title={t("view-club")}
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

async function DailyPlanning({
  coachId,
  day,
}: {
  coachId: string;
  day: DayName;
}) {
  const t = await getTranslations("dashboard");
  const planning = await getCoachDailyPlanning(coachId, day);
  if (!planning) return <div>{t("no-planning")}</div>;
  return (
    <div className="flex flex-col gap-2">
      {planning.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col items-center rounded border border-secondary bg-base-100"
        >
          <div className="w-full  bg-secondary text-center text-secondary-content">
            {plan.club.name}
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
            {plan.planningActivities.map((activity) => (
              <div key={activity.id} className="border border-base-300 p-2">
                <p>
                  <span className="text-xs">{activity.startTime}</span>
                  {" ("}
                  <span className="text-xs">{activity.duration}</span>
                  {"') "}
                  <span>{activity.activity.name}</span>
                </p>
                <p className="text-xs">
                  <span>{activity.site?.name}</span>
                  {" - "}
                  <span>{activity.room?.name}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
