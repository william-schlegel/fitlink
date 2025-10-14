import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

import {
  getRoomById,
  getRoomsForSite,
  getSiteById,
} from "@/server/api/routers/sites";
import {
  CreateRoom,
  DeleteRoom,
  UpdateRoom,
} from "@/components/modals/manageRoom";
import createLink, { createHref } from "@/lib/createLink";
import { getUserById } from "@/server/api/routers/users";
import { RESERVATIONS } from "@/lib/data";
import { getHref } from "@/lib/getHref";
import Title from "@/components/title";
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
  const user = await getUserById(userId, { withFeatures: true });
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
  const roomQuery = await getRoomsForSite(siteId, userId);
  if (!roomId && roomQuery.length > 0)
    redirect(createLink({ roomId: roomQuery[0]?.id }, href));

  if (!user.features.includes("MANAGER_ROOM"))
    return (
      <div className="alert alert-error">
        {t("common.navigation.insufficient-plan")}
      </div>
    );

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title
        title={t("club.room.manage-my-rooms", {
          count: roomQuery?.length ?? 0,
        })}
      />
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-4">
            {t("club.room.manage-my-rooms", {
              count: roomQuery?.length ?? 0,
            })}
            <span className="text-secondary">{siteQuery?.name}</span>
          </h1>
          <CreateRoom siteId={siteId} variant={"Primary"} />
        </div>
        <Link
          className="btn-outline btn btn-primary"
          // onClick={() => {
          //   const path = `/manager/${sessionData?.user?.id}/${clubId}/sites?siteId=${siteId}`;
          //   router.push(path);
          // }}
          href={createHref(href, ["manager", userId, clubId, "sites"], {
            siteId: siteId,
          })}
        >
          {t("club.room.back-to-sites")}
        </Link>
      </div>
      <div className="flex gap-4">
        <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
          {roomQuery?.map((room) => (
            <li key={room.id}>
              <Link
                href={createLink({ roomId: room.id }, href)}
                className={twMerge(
                  "flex items-center justify-between",
                  roomId === room.id && "badge badge-primary",
                )}
              >
                <span>{room.name}</span>
                <span>
                  {room.reservation === "MANDATORY" && (
                    <i className="bx bx-calendar-exclamation bx-sm text-secondary" />
                  )}
                  {room.reservation === "POSSIBLE" && (
                    <i className="bx bx-calendar-alt bx-sm text-secondary" />
                  )}
                  {room.unavailable ? (
                    <span className="badge-error badge">
                      {t("club.room.closed")}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {roomId === "" ? null : (
          <RoomContent clubId={clubId} roomId={roomId} siteId={siteId} />
        )}
      </div>
    </div>
  );
}

type RoomContentProps = {
  clubId: string;
  siteId: string;
  roomId: string;
};

export async function RoomContent({
  clubId,
  siteId,
  roomId,
}: RoomContentProps) {
  if (!isCUID(roomId) || !isCUID(siteId) || !isCUID(clubId)) return null;
  const roomQuery = await getRoomById(roomId);
  // const calendarQuery = trpc.calendars.getCalendarForRoom.useQuery(
  //   {
  //     roomId,
  //     siteId,
  //     clubId,
  //   },
  //   { enabled: isCUID(roomId) && isCUID(siteId) && isCUID(clubId) }
  // );
  const t = await getTranslations("club");

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2>{roomQuery?.name}</h2>
        {roomQuery?.unavailable ? (
          <div className="alert alert-error w-fit">
            <i className="bx bx-x bx-xs" />
            <span>{t("room.closed")}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <UpdateRoom siteId={siteId} roomId={roomId} />
          {/* <CreateRoomCalendar roomId={roomId} clubId={clubId} siteId={siteId} /> */}
          <DeleteRoom roomId={roomId} siteId={siteId} />
        </div>
      </div>
      {/* <CalendarWeek
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading}
      /> */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="label">{t("room.reservation")}</label>
          <span>
            {t(
              RESERVATIONS.find((r) => r.value === roomQuery?.reservation)
                ?.label || "?",
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="label">{t("room.capacity")}</label>
          <span>{roomQuery?.capacity}</span>
        </div>
      </div>
      <div className="flex-1 rounded border border-primary p-4 ">
        Planning de la salle
      </div>
    </div>
  );
}
