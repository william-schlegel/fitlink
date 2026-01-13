"use client";

import {
  Data,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  useState,
  useEffect,
  ReactNode,
  startTransition,
  useMemo,
} from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { CalendarX, Euro, User } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/shadcn";
import { CreateClubCalendar } from "@/components/modals/manageCalendar";
import { DeleteClub, UpdateClub } from "@/components/modals/manageClub";
import { ButtonGroup } from "@/components/ui/shadcn/button-group";
import CollapsableGroup from "@/components/ui/collapsableGroup";
import AddActivity from "@/components/modals/manageActivity";
import LockedButton from "@/components/ui/lockedButton";
import DeleteButton from "@/components/ui/deleteButton";
import CalendarWeek from "@/components/calendarWeek";
import ButtonIcon from "@/components/ui/buttonIcon";
import { activityGroup } from "@/db/schema/club";
import Spinner from "@/components/ui/spinner";
import useUserInfo from "@/lib/useUserInfo";
import { trpc } from "@/lib/trpc/client";
import { cn, isCUID } from "@/lib/utils";
import { toast } from "sonner";

type ClubContentProps = {
  userId: string;
  clubId: string;
};

export function ClubContent({ userId, clubId }: ClubContentProps) {
  const clubQuery = trpc.clubs.getClubById.useQuery(
    { clubId, userId },
    {
      enabled: isCUID(clubId),
    },
  );
  const [groups, setGroups] = useState<(typeof activityGroup.$inferSelect)[]>(
    [],
  );
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);

  useEffect(() => {
    const groupsMap = new Map();
    for (const act of clubQuery.data?.activities || [])
      groupsMap.set(act.group.id, act.group);
    startTransition(() => {
      setGroups(Array.from(groupsMap.values()));
    });
  }, [clubQuery.data]);

  const calendarQuery = trpc.calendars.getCalendarForClub.useQuery(clubId, {
    enabled: isCUID(clubId),
  });
  const addActivity = trpc.activities.affectToRoom.useMutation({
    onSuccess() {
      utils.clubs.getClubById.invalidate({ clubId, userId });
    },
  });
  const removeActivity = trpc.activities.removeFromRoom.useMutation({
    onSuccess() {
      utils.clubs.getClubById.invalidate({ clubId, userId });
      toast.success(t("activity-removed"));
    },
  });
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const { features } = useUserInfo(userId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const roomId = e.over?.id.toString();
    const activityId = e.active.data.current?.activityId;
    const actualRoom = e.active.data.current?.roomId;
    setActiveActivityId(null);
    if (actualRoom === roomId) return;
    if (actualRoom && actualRoom !== roomId && activityId)
      removeActivity.mutate({ activityId, roomId: actualRoom });
    if (roomId && activityId) addActivity.mutate({ activityId, roomId });
  }

  function handleDragStart(e: DragStartEvent) {
    const activityId = e.active.data.current?.activityId;
    setActiveActivityId(activityId ?? null);
  }

  const activeActivity = useMemo(() => {
    if (!activeActivityId) return null;
    const clubActivity = clubQuery.data?.activities?.find(
      (a) => a.id === activeActivityId,
    );
    if (clubActivity)
      return { name: clubActivity.name, noCalendar: clubActivity.noCalendar };
    const roomActivity = clubQuery.data?.sites
      ?.flatMap((site) => site.rooms)
      .flatMap((room) => room.activities ?? [])
      .find((a) => a.activityId === activeActivityId);
    if (roomActivity?.activity)
      return {
        name: roomActivity.activity.name,
        noCalendar: roomActivity.activity.noCalendar,
      };
    return null;
  }, [activeActivityId, clubQuery.data]);

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
          <p className="text-sm text-muted-foreground">
            ({clubQuery.data?.address})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UpdateClub clubId={clubId} />
          <CreateClubCalendar clubId={clubId} />
          <DeleteClub clubId={clubId} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {features.includes("MANAGER_COACH") ? (
          <Button asChild>
            <Link href={`/manager/${userId}/${clubId}/coach`}>
              <User />
              {t("club.manage-coachs")}
            </Link>
          </Button>
        ) : (
          <LockedButton label={t("club.manage-coachs")} limited />
        )}
        <Button asChild>
          <Link href={`/manager/${userId}/${clubId}/subscription`}>
            <Euro />
            {t("subscription.manage-subscriptions")}
          </Link>
        </Button>
      </div>
      {calendarQuery.data ? (
        <CalendarWeek
          calendar={calendarQuery.data}
          isLoading={calendarQuery.isLoading}
        />
      ) : null}
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveActivityId(null)}
        sensors={sensors}
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 rounded border border-primary p-4 ">
            <div className="flex flex-row items-center justify-between gap-4">
              <h3>
                {t("site.site", { count: clubQuery?.data?.sites?.length ?? 0 })}
              </h3>
              <Button asChild>
                <Link href={`/manager/${userId}/${clubId}/sites`}>
                  {t("site.manage")}
                </Link>
              </Button>
            </div>
            {clubQuery?.data?.sites?.map((site) => (
              <div key={site.id} className="my-2 flex items-center gap-4">
                <span>
                  {site.name} ({site.address})
                </span>
                <Badge variant="info">
                  {site.rooms.length > 0 && <span>{site.rooms.length}</span>}
                  {t("room.room", { count: site.rooms.length })}
                </Badge>
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
              <AddActivity
                clubId={clubId}
                userId={userId}
                onSuccess={() => {
                  utils.clubs.getClubById.invalidate({ clubId, userId });
                }}
                withAdd
                withUpdate
              />
            </div>
            <ButtonGroup>
              {groups.map((gp) => (
                <Button key={gp.id} asChild>
                  <CollapsableGroup groupName={gp.name}>
                    {clubQuery.data?.activities
                      ?.filter((a) => a.groupId === gp.id)
                      ?.map((a) => (
                        <DraggableElement
                          key={a.id}
                          elementId={a.id}
                          data={{ activityId: a.id, roomId: "" }}
                        >
                          <span className="flex items-center gap-2">
                            {a.name}
                            {a.noCalendar ? (
                              <CalendarX size={12} className="opacity-50" />
                            ) : null}
                          </span>
                        </DraggableElement>
                      ))}
                  </CollapsableGroup>
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded border border-primary p-4">
          <div className="flex items-center gap-4">
            <h3>{t("activity.manage-club-activities")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("activity.manage-club-activities-help")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {clubQuery.data?.sites?.map((site) => (
              <CollapsableGroup
                key={site.id}
                groupName={site.name}
                defaultOpen={site.rooms.length > 0}
              >
                {site.rooms?.map((room) => (
                  <DroppableArea
                    key={room.id}
                    areaId={room.id}
                    title={room.name}
                  >
                    {room.activities?.map((a) => (
                      <DraggableElement
                        key={a.id}
                        elementId={`${a.activity.id} ${room.id}`}
                        data={{ activityId: a.activity.id, roomId: room.id }}
                      >
                        {a.activity.name}
                        {a.activity.noCalendar ? (
                          <CalendarX size={12} className="opacity-50" />
                        ) : null}

                        <DeleteButton
                          label={t("activity.remove")}
                          icon
                          onClick={() =>
                            handledeleteActivity(room.id, a.activity.id)
                          }
                        />
                      </DraggableElement>
                    ))}
                  </DroppableArea>
                ))}
              </CollapsableGroup>
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeActivity ? (
            <div className="flex items-center gap-2 rounded-full border border-neutral bg-card px-4 py-1 shadow-lg">
              {activeActivity.name}
              {activeActivity.noCalendar ? (
                <CalendarX size={12} className="opacity-50" />
              ) : null}
            </div>
          ) : null}
        </DragOverlay>
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
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-16 relative m-1 rounded border border-neutral p-2",
        isOver ? "bg-muted" : "bg-card",
      )}
    >
      <CardTitle className="absolute right-4 opacity-70">{title}</CardTitle>
      <CardContent className="flex flex-wrap gap-2">{children}</CardContent>
    </Card>
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
      className={cn(
        "flex items-center gap-2 rounded-full border border-neutral bg-card px-4 py-1",
        transform ? "cursor-grabbing" : "cursor-grab",
      )}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
