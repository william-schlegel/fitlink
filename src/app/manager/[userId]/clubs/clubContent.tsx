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
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  ReactNode,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CalendarX, ChevronRight, Euro, User } from "lucide-react";

import { toast } from "sonner";

import CalendarWeek from "@/components/calendarWeek";
import AddActivity from "@/components/modals/manageActivity";
import {
  CreateClubCalendar,
  UpdateClubCalendar,
} from "@/components/modals/manageCalendar";
import { DeleteClub, UpdateClub } from "@/components/modals/manageClub";
import CollapsableGroup from "@/components/ui/collapsableGroup";
import DeleteButton from "@/components/ui/deleteButton";
import LockedButton from "@/components/ui/lockedButton";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { activityGroup } from "@/db/schema/club";
import { ClubId, UserId } from "@/db/types";
import { trpc } from "@/lib/trpc/client";
import useUserInfo from "@/lib/useUserInfo";
import { cn, isCUID } from "@/lib/utils";

type ClubContentProps = {
  userId: UserId;
  clubId: ClubId;
};

export function ClubContent({ userId, clubId }: ClubContentProps) {
  const t = useTranslations("club");

  const clubQuery = trpc.clubs.getClubById.useQuery(
    { clubId, userId },
    {
      enabled: isCUID(clubId),
    },
  );

  const actualCalendar = trpc.calendars.getCalendarForClub.useQuery(clubId, {
    enabled: isCUID(clubId),
  });
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
      toast.success(t("activity.activity-removed"));
    },
  });
  const utils = trpc.useUtils();
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
        {actualCalendar.data ? (
          <UpdateClubCalendar
            clubId={clubId}
            calendarId={actualCalendar.data.id}
          />
        ) : null}
      </div>
      {calendarQuery.data ? (
        <CalendarWeek
          calendar={calendarQuery.data}
          isLoading={calendarQuery.isLoading}
        />
      ) : null}
      {/* Site Section */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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

      {/* Activity Assignment Section */}
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveActivityId(null)}
        sensors={sensors}
      >
        <div className="flex items-center gap-4 pt-2">
          <h3>{t("activity.manage-club-activities")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("activity.manage-club-activities-help")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          {/* Left Panel - Activities */}
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4">
              <h4 className="font-semibold">
                {t("activity.activity", {
                  count: clubQuery?.data?.activities?.length ?? 0,
                })}
              </h4>
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
            <div className="max-h-[500px] overflow-y-auto p-2">
              {groups.map((gp) => (
                <ActivityGroupCollapsible
                  key={gp.id}
                  groupName={gp.name}
                  activitiesCount={
                    clubQuery.data?.activities?.filter(
                      (a) => a.groupId === gp.id,
                    )?.length ?? 0
                  }
                >
                  <div className="flex flex-col gap-1 py-1 pl-4">
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
                  </div>
                </ActivityGroupCollapsible>
              ))}
            </div>
          </div>

          {/* Right Panel - Rooms/Sites */}
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4">
              <h4 className="font-semibold">{t("room.room", { count: 2 })}</h4>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2">
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
        "flex items-center gap-2 border border-neutral bg-card px-4 py-1",
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

type ActivityGroupCollapsibleProps = {
  groupName: string;
  activitiesCount: number;
  children: ReactNode;
};

function ActivityGroupCollapsible({
  groupName,
  activitiesCount,
  children,
}: ActivityGroupCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group">
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50">
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90",
          )}
        />
        <span className="flex-1 font-medium">{groupName}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {activitiesCount}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
