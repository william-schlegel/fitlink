import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { CalendarCheck, CalendarClock, ChevronLeft, X } from "lucide-react";

import {
  LayoutPage,
  LayoutPageMain,
  LayoutPageList,
} from "@/components/layoutPage";
import {
  CreateRoom,
  DeleteRoom,
  UpdateRoom,
} from "@/components/modals/manageRoom";
import { CreateRoomCalendar } from "@/components/modals/manageCalendar";
import { getRoomById, getSiteById } from "@/server/api/routers/sites";
import createLink, { createHref } from "@/lib/createLink";
import { Alert } from "@/components/ui/shadcn/alert";
import CalendarWeek from "@/components/calendarWeek";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { Button } from "@/components/ui/shadcn";
import { RESERVATIONS } from "@/lib/data";
import { getHref } from "@/lib/getHref";
import { isCUID } from "@/lib/utils";

export default async function ManageRooms({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; clubId: string; siteId: string }>;
  searchParams: Promise<{ roomId: string }>;
}) {
  const { clubId, userId, siteId } = await params;
  const { roomId } = (await searchParams) ?? {};
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const user = await caller.users.getUserById({
    id: userId,
    options: {
      withFeatures: true,
    },
  });

  if (!user) redirect("/", RedirectType.replace);
  const t = await getTranslations();
  const href = await getHref();
  if (
    user.internalRole !== "MANAGER" &&
    user.internalRole !== "MANAGER_COACH" &&
    user.internalRole !== "ADMIN"
  )
    return <div>{t("club.manager-only")}</div>;

  const siteQuery = await getSiteById(siteId);
  const roomQuery = await caller.sites.getRoomsForSite(siteId);
  if (!roomId && roomQuery.length > 0)
    redirect(createLink({ roomId: roomQuery[0]?.id }, href));

  if (!user.features.includes("MANAGER_ROOM"))
    return (
      <div className="alert alert-error">
        {t("common.navigation.insufficient-plan")}
      </div>
    );

  const roomList = roomQuery.map(
    (room: NonNullable<(typeof roomQuery)[number]>) => ({
      id: room.id,
      name: room.name,
      link: createLink({ roomId: room.id }, href),
      badgeIcon:
        room.reservation === "MANDATORY" ? (
          <CalendarCheck className="text-secondary" />
        ) : room.reservation === "POSSIBLE" ? (
          <CalendarClock className="text-primary" />
        ) : undefined,
      badgeText: room.unavailable ? t("club.room.closed") : null,
    }),
  );

  return (
    <LayoutPage
      preTitle={siteQuery?.name}
      title={t("club.room.manage-my-rooms", {
        count: roomQuery?.length ?? 0,
      })}
      titleComponents={
        <div className="flex flex-wrap items-center gap-4">
          <CreateRoom siteId={siteId} variant="default" buttonSize="default" />
          <Button asChild size="lg" variant="outline">
            <Link
              href={createHref(href, ["manager", userId, "clubs"], { clubId })}
            >
              <ChevronLeft />
              {t("club.room.back-to-sites")}
            </Link>
          </Button>
        </div>
      }
    >
      <LayoutPageMain>
        <LayoutPageList
          list={roomList}
          itemId={roomId}
          noItemsText={t("club.room.no-rooms")}
        />

        {siteId === "" ? null : (
          <RoomContent clubId={clubId} roomId={roomId} siteId={siteId} />
        )}
      </LayoutPageMain>
    </LayoutPage>
  );
}

type RoomContentProps = {
  clubId: string;
  siteId: string;
  roomId: string;
};

async function RoomContent({ clubId, siteId, roomId }: RoomContentProps) {
  if (!isCUID(roomId) || !isCUID(siteId) || !isCUID(clubId)) return null;
  const roomQuery = await getRoomById(roomId);
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const calendarQuery = await caller.calendars.getCalendarForRoom({
    roomId,
    siteId,
    clubId,
  });
  const t = await getTranslations("club");

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2>{roomQuery?.name}</h2>
        {roomQuery?.unavailable ? (
          <Alert variant="destructive" className="w-fit">
            <X className="stroke-destructive" />
            <span>{t("room.closed")}</span>
          </Alert>
        ) : null}
        <div className="flex items-center gap-2">
          <UpdateRoom siteId={siteId} roomId={roomId} />
          <CreateRoomCalendar roomId={roomId} clubId={clubId} siteId={siteId} />
          <DeleteRoom roomId={roomId} siteId={siteId} />
        </div>
      </div>
      <CalendarWeek calendar={calendarQuery} isLoading={false} />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="font-bold text-primary">
            {t("room.reservation")}
          </label>
          <span>
            {t(
              RESERVATIONS.find((r) => r.value === roomQuery?.reservation)
                ?.label || "?",
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-bold text-primary">{t("room.capacity")}</label>
          <span>{roomQuery?.capacity}</span>
        </div>
      </div>
      <div className="flex-1 rounded border border-primary p-4 ">
        Planning de la salle
      </div>
    </div>
  );
}
