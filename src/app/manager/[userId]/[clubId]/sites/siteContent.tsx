"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import Link from "next/link";

import { DeleteSite, UpdateSite } from "@/components/modals/manageSite";
import LockedButton from "@/components/ui/lockedButton";
import CalendarWeek from "@/components/calendarWeek";
import { LayoutPage } from "@/components/layoutPage";
import Spinner from "@/components/ui/spinner";
import useUserInfo from "@/lib/useUserInfo";
import createLink from "@/lib/createLink";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

type SiteContentProps = {
  userId: string;
  clubId: string;
  siteId: string;
};

export default function SiteContent({ clubId, siteId }: SiteContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("roomId") as string;
  const pathname = usePathname();

  const siteQuery = trpc.sites.getSiteById.useQuery(siteId, {
    enabled: isCUID(siteId),
  });

  useEffect(() => {
    if (siteQuery.data?.rooms?.length && roomId === "") {
      router.push(`${pathname}?roomId=${siteQuery.data?.rooms?.[0]?.id ?? ""}`);
    }
  }, [siteQuery.data, roomId, pathname, router]);

  const calendarQuery = trpc.calendars.getCalendarForSite.useQuery(
    {
      siteId,
      clubId,
    },
    { enabled: isCUID(clubId) && isCUID(siteId) },
  );

  const t = useTranslations("club");
  const { features } = useUserInfo();
  const actualRoom = siteQuery.data?.rooms?.find((r) => r.id === roomId);

  const root = pathname.split("/");
  root.pop();
  const path = root.reduce((a, r) => a.concat(`${r}/`), "");

  const roomList =
    siteQuery.data?.rooms?.map((room) => ({
      id: room.id,
      name: room.name,
      link: createLink({ roomId: room.id }),
    })) ?? [];

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
      <CalendarWeek
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading}
      />
      <LayoutPage
        variant="section"
        title={t("room.room", { count: siteQuery?.data?.rooms?.length ?? 0 })}
        titleComponents={
          features.includes("MANAGER_ROOM") ? (
            <Link className="btn btn-secondary" href={`${path}${siteId}/rooms`}>
              {t("room.manage")}
            </Link>
          ) : (
            <LockedButton label={t("room.manage")} />
          )
        }
      >
        <LayoutPage.Main>
          {features.includes("MANAGER_ROOM") ? (
            <>
              <LayoutPage.List
                list={roomList}
                itemId={roomId}
                noItemsText={t("room.no-rooms")}
              />
              <div>
                <div className="flex-1 rounded border border-primary p-4 ">
                  Planning des activités
                </div>
                {actualRoom?.reservation !== "NONE" ? (
                  <div className="flex-1 rounded border border-primary p-4 ">
                    Planning de réservation
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </LayoutPage.Main>
      </LayoutPage>
    </div>
  );
}
