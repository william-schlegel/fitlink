import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import {
  Award,
  Building,
  Dumbbell,
  Euro,
  ExternalLink,
  Star,
} from "lucide-react";

import { getCoachDataForUserId } from "@/server/api/routers/dashboard";
import { getCoachDailyPlanning } from "@/server/api/routers/planning";
import LockedButton from "@/components/ui/lockedButton";
import { Badge, Button } from "@/components/ui/shadcn";
import { getToday } from "@/lib/dates/serverDayName";
import { createTrpcCaller } from "@/lib/trpc/caller";
import ButtonIcon from "@/components/ui/buttonIcon";
import SelectDay from "@/components/ui/selectDay";
import CardGroup from "@/components/ui/cardGroup";
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
  if (
    !user ||
    (user.internalRole !== "COACH" &&
      user.internalRole !== "MANAGER_COACH" &&
      user.internalRole !== "ADMIN")
  )
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
          <Badge variant={published ? "success" : "warning"} size="lg">
            {published
              ? t("pages.page-published")
              : t("pages.page-unpublished")}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          {features.includes("COACH_CERTIFICATION") ? (
            <Button asChild>
              <Link href={`${userId}/certifications`}>
                {t("dashboard.manage-certifications")}
              </Link>
            </Button>
          ) : (
            <LockedButton label={t("dashboard.manage-certifications")} />
          )}
        </div>
      </h1>
      <CardGroup
        cards={[
          {
            title: t("dashboard.clubs", { count: clubCount }),
            value: clubCount,
            icon: Building,
          },
          {
            title: t("dashboard.certifications", { count: certificationCount }),
            value: certificationCount,
            icon: Award,
          },
          {
            title: t("dashboard.activities", { count: activityCount }),
            value: activityCount,
            icon: Dumbbell,
          },
          {
            title: t("dashboard.offers", { count: offerCount }),
            value: offerCount,
            icon: Euro,
          },
          {
            title: t("dashboard.rating", {
              count:
                coachQuery?.coachData?.rating?.toFixed(1) ??
                t("dashboard.unrated"),
            }),
            value:
              coachQuery?.coachData?.rating?.toFixed(1) ??
              t("dashboard.unrated"),
            icon: Star,
          },
        ]}
      />

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
          <div className="mb-2">
            <h2>{t("dashboard.planning")}</h2>
            <SelectDay day={day} redirectTo={`/coach/${userId}`} />
          </div>
          <DailyPlanning coachId={userId} day={day} />
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("dashboard.schedule")}</h2>
          {features.includes("COACH_MEETING") ? (
            <div className="text-center text-sm text-muted-foreground">
              (A venir)
            </div>
          ) : (
            <div className="alert alert-error">
              {t("common.navigation.insufficient-plan")}
            </div>
          )}
        </article>
        <article className="col-span-full rounded-md border border-primary p-2">
          <h2>{t("dashboard.chat-members")}</h2>
          <div className="text-center text-sm text-muted-foreground">
            (A venir)
          </div>
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
    <div className="card card-border bg-card">
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
            <p className="text-xs text-muted-foreground truncate">
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
                iconComponent={<ExternalLink />}
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
          className="flex flex-col items-center rounded border border-secondary bg-card"
        >
          <div className="w-full  bg-secondary text-center text-secondary-content">
            {plan.club.name}
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
            {plan.planningActivities.map((activity) => (
              <div key={activity.id} className="border border-border p-2">
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
