"use client";

import { activityGroup } from "@/db/schema/club";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { useState, useEffect, ReactNode } from "react";
import {
  Data,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import useUserInfo from "@/lib/useUserInfo";
import Spinner from "@/components/ui/spinner";
import Image from "next/image";
import Link from "next/link";
import ButtonIcon from "@/components/ui/buttonIcon";
import LockedButton from "@/components/ui/lockedButton";
import CollapsableGroup from "@/components/ui/collapsableGroup";
import { DeleteClub, UpdateClub } from "@/components/modals/manageClub";

type ClubContentProps = {
  userId: string;
  clubId: string;
};

export function ClubContent({ userId, clubId }: ClubContentProps) {
  const clubQuery = trpc.clubs.getClubById.useQuery(
    { clubId, userId },
    {
      enabled: isCUID(clubId),
    }
  );
  useEffect(() => {
    const groups = new Map();
    for (const act of clubQuery.data?.activities || [])
      groups.set(act.group.id, act.group);
    setGroups(Array.from(groups.values()));
  }, [clubQuery.data]);

  // const calendarQuery = trpc.calendars.getCalendarForClub.useQuery(clubId, {
  //   enabled: isCUID(clubId),
  // });
  const addActivity = trpc.activities.affectToRoom.useMutation({
    onSuccess() {
      utils.clubs.getClubById.invalidate({ clubId, userId });
    },
  });
  const removeActivity = trpc.activities.removeFromRoom.useMutation({
    onSuccess() {
      utils.clubs.getClubById.invalidate({ clubId, userId });
    },
  });
  const [groups, setGroups] = useState<(typeof activityGroup.$inferSelect)[]>(
    []
  );
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const { features } = useUserInfo(userId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  function handleDragEnd(e: DragEndEvent) {
    const roomId = e.over?.id.toString();
    const activityId = e.active.data.current?.activityId;
    const actualRoom = e.active.data.current?.roomId;
    if (actualRoom === roomId) return;
    if (actualRoom && actualRoom !== roomId && activityId)
      removeActivity.mutate({ activityId, roomId: actualRoom });
    if (roomId && activityId) addActivity.mutate({ activityId, roomId });
  }

  function handledeleteActivity(roomId: string, activityId: string) {
    removeActivity.mutate({ activityId, roomId });
  }

  if (clubQuery.isLoading) return <Spinner />;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {clubQuery.data?.logoUrl ? (
            <div className="h-12">
              <Image
                src={clubQuery.data.logoUrl}
                alt="club logo"
                width={200}
                height={200}
                className="h-full w-fit object-contain"
              />
            </div>
          ) : null}
          <h2>{clubQuery.data?.name}</h2>
          {/* <p>({clubQuery.data?.address})</p> */}
        </div>
        <div className="flex items-center gap-2">
          <UpdateClub clubId={clubId} />
          {/* <CreateClubCalendar clubId={clubId} /> */}
          <DeleteClub clubId={clubId} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {features.includes("MANAGER_COACH") ? (
          <Link href={`/manager/${userId}/${clubId}/coach`}>
            <ButtonIcon
              iconComponent={<i className="bx bx-user bx-sm" />}
              title={t("club.manage-coachs")}
              buttonVariant="Icon-Primary"
              buttonSize="md"
              fullButton
            />
          </Link>
        ) : (
          <LockedButton label={t("club.manage-coachs")} limited />
        )}
        <Link href={`/manager/${userId}/${clubId}/subscription`}>
          <ButtonIcon
            iconComponent={<i className="bx bx-euro bx-sm" />}
            title={t("subscription.manage-subscriptions")}
            buttonVariant="Icon-Primary"
            buttonSize="md"
            fullButton
          />
        </Link>
      </div>
      {/* <CalendarWeek
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading}
      /> */}
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 rounded border border-primary p-4 ">
            <div className="flex flex-row items-center justify-between gap-4">
              <h3>
                {t("site.site", { count: clubQuery?.data?.sites?.length ?? 0 })}
              </h3>
              <Link
                className="btn btn-secondary"
                href={`/manager/${userId}/${clubId}/sites`}
              >
                {t("site.manage")}
              </Link>
            </div>
            {clubQuery?.data?.sites?.map((site) => (
              <div key={site.id} className="my-2 flex items-center gap-4">
                <span>
                  {site.name} ({site.address})
                </span>
                <div className="pill">
                  {site.rooms.length > 0 && (
                    <span className="mr-2 text-lg text-primary">
                      {site.rooms.length}
                    </span>
                  )}
                  {t("room.room", { count: site.rooms.length })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 rounded border border-primary p-4 ">
            <div className="mb-4 flex flex-row items-center justify-between gap-4">
              <h3>
                {t("activity.activity", {
                  count: clubQuery?.data?.activities?.length ?? 0,
                })}
              </h3>
              {/* <AddActivity
                clubId={clubId}
                userId={userId}
                onSuccess={() => {
                  utils.clubs.getClubById.invalidate(clubId);
                }}
                withAdd
                withUpdate
              /> */}
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              {groups.map((gp) => (
                <CollapsableGroup key={gp.id} groupName={gp.name}>
                  {clubQuery.data?.activities
                    ?.filter((a) => a.groupId === gp.id)
                    ?.map((a) => (
                      <DraggableElement
                        key={a.id}
                        elementId={a.id}
                        data={{ activityId: a.id, roomId: "" }}
                      >
                        <span>
                          {a.name}
                          {a.noCalendar ? (
                            <i className="bx bx-calendar-x bx-xs ml-2 text-primary" />
                          ) : null}
                        </span>
                      </DraggableElement>
                    ))}
                </CollapsableGroup>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded border border-primary p-4">
          <div className="flex items-center gap-4">
            <h3>{t("activity.manage-club-activities")}</h3>
            <p>{t("activity.manage-club-activities-help")}</p>
          </div>
          <div className="flex flex-col gap-2">
            {clubQuery.data?.sites?.map((site) => (
              <div
                key={site.id}
                className="collapse-arrow rounded-box collapse border border-secondary bg-base-100"
              >
                <input type="checkbox" defaultChecked={true} />
                <h4 className="collapse-title">{site.name}</h4>
                <div className="collapse-content">
                  {site.rooms?.map((room) => (
                    <DroppableArea
                      key={room.id}
                      areaId={room.id}
                      title={room.name}
                    >
                      {room.activities?.map((a) => (
                        <DraggableElement
                          key={a.id}
                          elementId={`${a.id} ${room.id}`}
                          data={{ activityId: a.id, roomId: room.id }}
                        >
                          {a.activity.name}
                          {a.activity.noCalendar ? (
                            <i className="bx bx-calendar-x bx-xs text-primary" />
                          ) : null}
                          <div
                            className="tooltip"
                            data-tip={t("activity.remove")}
                          >
                            <i
                              className="bx bx-x bx-sm cursor-pointer rounded-full bg-base-100 text-secondary hover:bg-secondary hover:text-secondary-content"
                              onClick={(e) => {
                                e.stopPropagation();
                                handledeleteActivity(room.id, a.id);
                              }}
                            />
                          </div>
                        </DraggableElement>
                      ))}
                    </DroppableArea>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

type DroppableAreaProps = {
  areaId: string;
  title: string;
  children?: ReactNode;
};

function DroppableArea({ areaId, title, children }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: areaId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-16 relative m-1 flex flex-wrap items-center gap-2 rounded border border-neutral p-2 ${
        isOver ? "bg-base-300" : "bg-base-100"
      }`}
    >
      <span className="absolute right-4 text-secondary opacity-70">
        {title}
      </span>
      {children}
    </div>
  );
}

type DraggableElementProps = {
  elementId: string;
  data: Data<{ activityId: string; roomId: string }>;
  children: ReactNode;
};

function DraggableElement({
  elementId,
  children,
  data,
}: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: elementId,
    data,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={`z-50 ${
        transform ? "cursor-grabbing" : "cursor-grab"
      } flex items-center gap-2 rounded-full border border-neutral bg-base-100 px-4 py-1`}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
