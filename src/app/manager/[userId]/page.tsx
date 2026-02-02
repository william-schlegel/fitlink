import {
  addDays,
  isAfter,
  isSameDay,
  startOfDay,
  startOfToday,
} from "date-fns";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";

import {
  BuildingIcon,
  Dumbbell,
  Euro,
  HomeIcon,
  MapPinIcon,
  TriangleAlert,
  UserIcon,
} from "lucide-react";

import { ManageCourse } from "@/components/modals/manageCourse";
import {
  CreateEvent,
  DeleteEvent,
  ShowEventCard,
  UpdateEvent,
} from "@/components/modals/manageEvent";
import Title from "@/components/title";
import CardGroup from "@/components/ui/cardGroup";
import SelectDay from "@/components/ui/selectDay";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn";
import { Alert, AlertTitle } from "@/components/ui/shadcn/alert";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/shadcn/item";
import { ClubId, UserId } from "@/db/types";
import { getActualUser } from "@/lib/auth/server";
import { DayName } from "@/lib/dates/data";
import { getDayNumber, getToday } from "@/lib/dates/serverDayName";
import { formatDateLocalized } from "@/lib/formatDate";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getManagerDataForUserId } from "@/server/api/routers/dashboard";
import { getClubDailyPlanning } from "@/server/api/routers/planning";
/***
 *
 *  Manager dashboard
 *
 */

export default async function ManagerClubs({
  params,
  searchParams,
}: {
  params: Promise<{ userId: UserId }>;
  searchParams: Promise<{ day?: DayName }>;
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

  const searchParamsValue = await searchParams;
  const day = searchParamsValue?.day ?? getToday();

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("dashboard.manager-dashboard")} />
      <h1 className="flex justify-between">
        {t("dashboard.manager-dashboard")}
        <Button asChild>
          <Link href={`${userId}/clubs`}>{t("dashboard.manage-club")}</Link>
        </Button>
      </h1>
      <CardGroup
        cards={[
          {
            title: t("dashboard.clubs", {
              count: managerQuery?.clubCount ?? 0,
            }),
            value: managerQuery?.clubCount ?? 0,
            icon: BuildingIcon,
            link: `${userId}/clubs`,
          },
          {
            title: t("dashboard.sites", { count: managerQuery?.sites ?? 0 }),
            value: managerQuery?.sites ?? 0,
            icon: MapPinIcon,
          },
          {
            title: t("dashboard.rooms", { count: managerQuery?.rooms ?? 0 }),
            value: managerQuery?.rooms ?? 0,
            icon: HomeIcon,
          },
          {
            title: t("dashboard.activities", {
              count: managerQuery?.activities ?? 0,
            }),
            value: managerQuery?.activities ?? 0,
            icon: Dumbbell,
          },
          {
            title: t("dashboard.subscriptions", {
              count: managerQuery?.subscriptions ?? 0,
            }),
            value: managerQuery?.subscriptions ?? 0,
            icon: Euro,
          },
          {
            title: t("dashboard.members", {
              count: managerQuery?.members ?? 0,
            }),
            value: managerQuery?.members ?? 0,
            icon: UserIcon,
          },
        ]}
      />

      <section className="grid auto-rows-auto gap-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-3">
              {t("dashboard.planning")}
              <SelectDay day={day} redirectTo={`/manager/${userId}`} />
            </CardTitle>
            <Badge>
              {formatDateLocalized(getDateForDay(day), {
                dateFormat: "long",
                withDay: "long",
              })}
            </Badge>
          </CardHeader>
          <CardContent>
            {managerQuery?.clubs?.map((club) => (
              <DailyPlanning
                key={club.id}
                clubId={club.id}
                userId={userId}
                day={day}
              />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.event")}</CardTitle>
          </CardHeader>
          <CardContent>
            {features.includes("MANAGER_EVENT") ? (
              managerQuery?.clubs?.map((club) => (
                <Card key={club.id}>
                  <CardHeader className="flex items-center justify-between gap-2">
                    <CardTitle>{club.name}</CardTitle>
                    <CreateEvent clubId={club.id} />
                  </CardHeader>
                  <CardContent>
                    {club.events.length > 0 ? (
                      club.events.map((event) => (
                        <Item key={event.id}>
                          <ItemTitle>{event.name}</ItemTitle>
                          <ItemContent>
                            {formatDateLocalized(event.startDate, {
                              dateFormat: "number",
                              withTime: true,
                            })}
                          </ItemContent>
                          <ItemActions>
                            <UpdateEvent clubId={club.id} eventId={event.id} />
                            <DeleteEvent clubId={club.id} eventId={event.id} />
                            <ShowEventCard eventId={event.id} />
                          </ItemActions>
                        </Item>
                      ))
                    ) : (
                      <Alert variant="info">
                        <AlertTitle>{t("no-events")}</AlertTitle>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>
                  {t("common.navigation.insufficient-plan")}
                </AlertTitle>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function getDateForDay(day: DayName) {
  const today = startOfToday();
  const todayNumber = getDayNumber(getToday());
  const targetNumber = getDayNumber(day);
  const diff = (targetNumber - todayNumber + 7) % 7;
  return addDays(today, diff);
}

async function DailyPlanning({
  clubId,
  userId,
  day,
}: {
  clubId: ClubId;
  userId: UserId;
  day: DayName;
}) {
  const t = await getTranslations("dashboard");
  const planning = await getClubDailyPlanning(clubId, day);
  const courseDate = getDateForDay(day);
  const canEdit =
    isAfter(startOfDay(courseDate), startOfToday()) ||
    isSameDay(courseDate, startOfToday());
  if (!planning || planning.planningItems.length === 0)
    return (
      <Alert variant="info">
        <AlertTitle>{t("no-planning")}</AlertTitle>
      </Alert>
    );
  return (
    <div className="flex flex-col items-center rounded border border-accent bg-card">
      <h4 className="w-full  bg-accent text-center text-accent-foreground">
        {planning.clubName}
      </h4>
      <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
        {planning.planningItems.map((item) => (
          <div
            key={item.slotId}
            className="border border-border p-2 bg-background text-foreground"
          >
            <p>
              <span className="text-xs">{item.startTime}</span>
              {" ("}
              <span className="text-xs">{item.duration}</span>
              {"') "}
              <span>{item.activityName}</span>
            </p>
            <p className="text-xs">
              <span>{item.roomName}</span>
              {" - "}
              <span>{item.coachName}</span>
            </p>
            {item.siteId && canEdit ? (
              <div className="mt-2 flex justify-end">
                <ManageCourse
                  planningId={planning.id}
                  slotId={item.slotId}
                  clubId={clubId}
                  userId={userId}
                  siteId={item.siteId}
                  date={courseDate}
                  activityId={item.activityId}
                  coachUserId={item.coachUserId}
                  roomId={item.roomId}
                  startTime={item.startTime}
                  activityName={item.activityName}
                  siteName={item.siteName}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
