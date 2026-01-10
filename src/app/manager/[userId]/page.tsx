import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { startOfToday } from "date-fns";
import Link from "next/link";

import {
  BuildingIcon,
  DollarSignIcon,
  Dumbbell,
  HomeIcon,
  MapPinIcon,
  TriangleAlert,
  UserIcon,
} from "lucide-react";

import {
  CreateEvent,
  DeleteEvent,
  ShowEventCard,
  UpdateEvent,
} from "@/components/modals/manageEvent";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/shadcn/item";
import { getManagerDataForUserId } from "@/server/api/routers/dashboard";
import { getClubDailyPlanning } from "@/server/api/routers/planning";
import { Alert, AlertTitle } from "@/components/ui/shadcn/alert";
import { formatDateLocalized } from "@/lib/formatDate";
import { getToday } from "@/lib/dates/serverDayName";
import { createTrpcCaller } from "@/lib/trpc/caller";
import CardGroup from "@/components/ui/cardGroup";
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
            icon: DollarSignIcon,
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
            <CardTitle>{t("dashboard.planning")}</CardTitle>
            <Badge>
              {formatDateLocalized(startOfToday(), {
                dateFormat: "long",
                withDay: "long",
              })}
            </Badge>
          </CardHeader>
          <CardContent>
            {managerQuery?.clubs?.map((club) => (
              <DailyPlanning key={club.id} clubId={club.id} />
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

async function DailyPlanning({ clubId }: { clubId: string }) {
  const t = await getTranslations("dashboard");
  const day = getToday();
  const planning = await getClubDailyPlanning(clubId, day);
  if (!planning) return <div>{t("no-planning")}</div>;
  return (
    <div className="flex flex-col items-center rounded border border-accent bg-card">
      <h4 className="w-full  bg-accent text-center text-accent-foreground">
        {planning?.club?.name}
      </h4>
      <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
        {planning.planningActivities.map((activity) => (
          <div key={activity.id} className="border border-border p-2">
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
