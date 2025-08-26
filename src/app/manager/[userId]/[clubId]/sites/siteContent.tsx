"use client";

import { DeleteSite, UpdateSite } from "@/components/modals/manageSite";
import LockedButton from "@/components/ui/lockedButton";
import Spinner from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import useUserInfo from "@/lib/useUserInfo";
import { isCUID } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SiteContentProps = {
  userId: string;
  clubId: string;
  siteId: string;
};

export default function SiteContent({ clubId, siteId }: SiteContentProps) {
  const siteQuery = trpc.sites.getSiteById.useQuery(siteId, {
    enabled: isCUID(siteId),
  });

  useEffect(() => {
    if (siteQuery.data?.rooms?.length) {
      setRoomId(siteQuery.data?.rooms?.[0]?.id ?? "");
    }
  }, [siteQuery.data]);

  // const calendarQuery = trpc.calendars.getCalendarForSite.useQuery(
  //   {
  //     siteId,
  //     clubId,
  //   },
  //   { enabled: isCUID(clubId) && isCUID(siteId) }
  // );

  const t = useTranslations("club");
  const { features } = useUserInfo();
  const pathname = usePathname();
  const [roomId, setRoomId] = useState("");
  const actualRoom = siteQuery.data?.rooms?.find((r) => r.id === roomId);

  const root = pathname.split("/");
  root.pop();
  const path = root.reduce((a, r) => a.concat(`${r}/`), "");

  if (siteQuery.isLoading) return <Spinner />;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2>{siteQuery.data?.name}</h2>
          <p>({siteQuery.data?.address})</p>
        </div>
        <div className="flex items-center gap-2">
          <UpdateSite clubId={clubId} siteId={siteId} />
          {/* <CreateSiteCalendar siteId={siteId} clubId={clubId} /> */}
          <DeleteSite clubId={clubId} siteId={siteId} />
        </div>
      </div>
      {/* <CalendarWeek
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading}
      /> */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 rounded border border-primary p-4 ">
          <div className="mb-4 flex flex-row items-center justify-between gap-4">
            <h3>
              {t("room.room", { count: siteQuery?.data?.rooms?.length ?? 0 })}
            </h3>
            {features.includes("MANAGER_ROOM") ? (
              <Link
                className="btn btn-secondary"
                href={`${path}${siteId}/rooms`}
              >
                {t("room.manage")}
              </Link>
            ) : (
              <LockedButton label={t("room.manage")} />
            )}
          </div>
          {features.includes("MANAGER_ROOM") ? (
            <div className="flex gap-4">
              <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
                {siteQuery?.data?.rooms?.map((room) => (
                  <li key={room.id}>
                    <button
                      className={`flex w-full items-center justify-between text-center ${
                        roomId === room.id ? "active" : ""
                      }`}
                      onClick={() => setRoomId(room.id)}
                    >
                      <span>{room.name}</span>
                      {room.reservation === "MANDATORY" && (
                        <i className="bx bx-calendar-exclamation bx-sm text-secondary" />
                      )}
                      {room.reservation === "POSSIBLE" && (
                        <i className="bx bx-calendar-alt bx-sm text-secondary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex-1 rounded border border-primary p-4 ">
                Planning des activités
              </div>
              {actualRoom?.reservation !== "NONE" ? (
                <div className="flex-1 rounded border border-primary p-4 ">
                  Planning de réservation
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
