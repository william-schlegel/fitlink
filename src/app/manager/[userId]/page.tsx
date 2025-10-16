import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { startOfToday } from "date-fns";
import Link from "next/link";

import {
  CreateEvent,
  DeleteEvent,
  ShowEventCard,
  UpdateEvent,
} from "@/components/modals/manageEvent";
import { getManagerDataForUserId } from "@/server/api/routers/dashboard";
import { getClubDailyPlanning } from "@/server/api/routers/planning";
import { formatDateLocalized } from "@/lib/formatDate";
import { getToday } from "@/lib/dates/serverDayName";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import Title from "@/components/title";
/***
 *
 *  Manager dashboard
 *
 */

export default async function ManagerClubs({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await getActualUser();
  if (!user) redirect("/", RedirectType.replace);
  if (
    user.internalRole !== "MANAGER" &&
    user.internalRole !== "ADMIN" &&
    user.internalRole !== "MANAGER_COACH"
  )
    redirect("/", RedirectType.replace);

  const userId = (await params).userId;

  const managerQuery = await getManagerDataForUserId(userId);
  const t = await getTranslations();
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const { features } = await caller.users.getUserById({
    id: userId,
    options: {
      withFeatures: true,
    },
  });

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("dashboard.manager-dashboard")} />
      <h1 className="flex justify-between">
        {t("dashboard.manager-dashboard")}
        <Link className="btn btn-secondary" href={`${userId}/clubs`}>
          {t("dashboard.manage-club")}
        </Link>
      </h1>
      <section className="stats shadow w-full">
        <Link className="stat" href={`${userId}/clubs`}>
          <div className="stat-figure text-primary">
            <i className="bx bx-building bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.clubs", { count: managerQuery?.clubCount ?? 0 })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery?.clubCount ?? 0}
          </div>
        </Link>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-map-pin bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.sites", { count: managerQuery?.sites ?? 0 })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery?.sites ?? 0}
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-home bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.rooms", { count: managerQuery?.rooms ?? 0 })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery?.rooms ?? 0}
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-cycling bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.activities", {
              count: managerQuery?.activities ?? 0,
            })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery?.activities ?? 0}
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-euro bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.subscriptions", {
              count: managerQuery?.subscriptions ?? 0,
            })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery?.subscriptions ?? 0}
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-user bx-lg" />
          </div>
          <div className="stat-title">
            {t("dashboard.members", { count: managerQuery?.members ?? 0 })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery?.members ?? 0}
          </div>
        </div>
      </section>
      <section className="grid auto-rows-auto gap-2 lg:grid-cols-2">
        <article className="rounded-md border border-primary p-2">
          <div className="flex items-center justify-between gap-4">
            <h2>{t("dashboard.planning")}</h2>
            <span className="rounded-full bg-primary px-8 text-primary-content">
              {formatDateLocalized(startOfToday(), {
                dateFormat: "long",
                withDay: "long",
              })}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {managerQuery?.clubs?.map((club) => (
              <DailyPlanning key={club.id} clubId={club.id} />
            ))}
          </div>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("dashboard.event")}</h2>
          {features.includes("MANAGER_EVENT") ? (
            <div className="space-y-2">
              {managerQuery?.clubs?.map((club) => (
                <div
                  key={club.id}
                  className="rounded border border-secondary p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3>{club.name}</h3>
                    <CreateEvent clubId={club.id} />
                  </div>
                  <div className="flex gap-2">
                    {club.events.map((event) => (
                      <div key={event.id} className="border border-primary p-1">
                        <p className="text-center font-bold text-primary">
                          {event.name}
                        </p>
                        <p>
                          {formatDateLocalized(event.startDate, {
                            dateFormat: "number",
                            withTime: true,
                          })}
                        </p>
                        <div className="flex items-center justify-between gap-4">
                          <UpdateEvent clubId={club.id} eventId={event.id} />
                          <DeleteEvent clubId={club.id} eventId={event.id} />
                          <ShowEventCard eventId={event.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-error">
              {t("common.navigation.insufficient-plan")}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

async function DailyPlanning({ clubId }: { clubId: string }) {
  const t = await getTranslations("dashboard");
  const day = getToday();
  const planning = await getClubDailyPlanning(clubId, day);
  if (!planning) return <div>{t("no-planning")}</div>;
  return (
    <div className="flex flex-col items-center rounded border border-secondary bg-base-100">
      <div className="w-full  bg-secondary text-center text-secondary-content">
        {planning?.club?.name}
      </div>
      <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
        {planning.planningActivities.map((activity) => (
          <div key={activity.id} className="border border-base-300 p-2">
            <p>
              <span className="text-xs">{activity.startTime}</span>
              {" ("}
              <span className="text-xs">{activity.duration}</span>
              {"') "}
              <span>{activity.activity.name}</span>
            </p>
            <p className="text-xs">
              <span>{activity.room?.name}</span>
              {" - "}
              <span>{activity.coach?.user.name}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
