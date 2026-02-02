"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { ReactNode, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Trash } from "lucide-react";

import {
  DeletePlanning,
  UpdatePlanning,
} from "@/components/modals/managePlanning";
import { PlanningName } from "@/components/planningName";
import Confirmation from "@/components/ui/confirmation";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@/components/ui/shadcn";
import { Field, FieldError, FieldLabel } from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/shadcn/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { room } from "@/db/schema/club";
import {
  ActivityId,
  ClubId,
  PlanningId,
  RoomId,
  SiteId,
  UserId,
} from "@/db/types";
import { DayName, DAYS } from "@/lib/dates/data";
import { useDayName } from "@/lib/dates/useDayName";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { PlanningItemData, PlanningSearchItemData } from "@/schemas";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

const HHOUR = "h-12"; // 3rem 48px
const HHOUR_PX = 48;
const LEADINGHOUR = "leading-12";
const START_HOUR = 7;
const NB_HOUR = 15;
const HSITE = "h-[45rem]";

type PlanningContentProps = {
  planningId: PlanningId;
  clubId: ClubId;
  userId: UserId;
};

type DropData = {
  day: DayName;
  dayName: string;
  siteName: string;
  activityId: ActivityId;
  activityName: string;
  siteId: SiteId;
  rooms: (typeof room.$inferSelect)[];
};

type DropFormData = {
  startTime: string;
  duration: number;
  activityId: ActivityId;
  roomId: RoomId;
  coachUserId: UserId;
  siteId: SiteId;
};

export function PlanningContent({
  planningId,
  clubId,
  userId,
}: PlanningContentProps) {
  const queryPlanning = trpc.plannings.getPlanningById.useQuery({ planningId });
  const t = useTranslations("planning");
  const queryClub = trpc.clubs.getClubById.useQuery({ clubId, userId });
  const queryActivities = trpc.activities.getActivitiesForClub.useQuery(
    {
      clubId,
      userId,
    },
    {
      enabled: isCUID(clubId) && Boolean(userId),
    },
  );

  const [isOpen, setIsOpen] = useState(false);
  const [dropData, setDropData] = useState<DropData>({
    day: "MONDAY",
    dayName: "",
    siteName: "",
    activityId: "" as ActivityId,
    activityName: "",
    siteId: "" as SiteId,
    rooms: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );
  const utils = trpc.useUtils();
  const addActivity = trpc.plannings.addPlanningActivity.useMutation({
    onSuccess() {
      utils.plannings.getPlanningById.invalidate({ planningId });
    },
  });
  const { getName } = useDayName();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;
    const dayName = getName(over.data.current?.day);
    const siteId = over.data.current?.site;
    const site = queryClub.data?.sites?.find((s) => s.id === siteId);
    const siteName = site?.name ?? "?";
    const activityName =
      queryActivities.data?.activities.find((a) => a.id === active.id)?.name ??
      "?";
    const rooms = site?.rooms ?? [];
    // reset();
    setDropData({
      day: over.data.current?.day ?? "MONDAY",
      dayName,
      siteName,
      activityName,
      siteId,
      rooms,
      activityId: active.id as ActivityId,
    });
    setIsOpen(true);
  }

  function handleSaveActivity(data: DropFormData) {
    const newPlanningItem: PlanningItemData = {
      slotId: crypto.randomUUID(),
      day: dropData.day,
      siteId: dropData.siteId,
      activityId: dropData.activityId,
      coachUserId: data.coachUserId ? data.coachUserId : null,
      roomId: data.roomId ? data.roomId : null,
      startTime: data.startTime,
      duration: data.duration,
      deleted: false,
      noCalendar: false,
    };
    addActivity.mutate({
      planningId,
      item: newPlanningItem,
    });
    setIsOpen(false);
  }

  if (queryPlanning.isLoading) return <Spinner />;
  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent size="sm">
          <DialogTitle>{t("add-activity")}</DialogTitle>
          <FormActivity
            clubId={clubId}
            handleSaveActivity={handleSaveActivity}
            {...dropData}
          />
        </DialogContent>
      </Dialog>
      {/* planning content */}
      <article className="flex grow flex-col gap-4">
        <section className="flex items-center justify-between">
          <h2 className="text-lg">
            {queryPlanning.data ? (
              <PlanningName actualPlanning={queryPlanning.data} />
            ) : (
              "-"
            )}
          </h2>
          <div className="flex items-center gap-2">
            <UpdatePlanning clubId={clubId} planningId={planningId} />
            <UpdatePlanning clubId={clubId} planningId={planningId} duplicate />
            <DeletePlanning clubId={clubId} planningId={planningId} />
          </div>
        </section>
        <section className="grid grid-cols-[auto_1fr] gap-2">
          <aside className="flex flex-col gap-1 border border-secondary">
            <span className="bg-title text-title-foregroundpx-4 text-center">
              {t("activities")}
            </span>
            {queryActivities.data?.activities.map((activity) => (
              <DraggableActivity
                key={activity.id}
                id={activity.id}
                name={activity.name}
              />
            ))}
          </aside>

          <div className="grid grid-cols-[auto_1fr]">
            <div>
              <div className="h-12"></div>
              <div>
                <div className="flex w-10 shrink-0 flex-col border-r border-border bg-card text-center">
                  {Array.from(
                    { length: NB_HOUR },
                    (_, k) => k + START_HOUR,
                  ).map((hour) => (
                    <p
                      key={hour}
                      className={`${HHOUR} border-b border-border text-xs ${LEADINGHOUR} text-primary-foreground`}
                    >
                      {`0${hour}`.slice(-2)}:00
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex max-w-full gap-px overflow-auto">
              {DAYS.map((day) => (
                <div key={day.value} className="shrink-0">
                  <div className="w-max-fit flex shrink-0 flex-col">
                    <DayLabel day={day.label} />
                    <div
                      className="grid gap-px"
                      style={{
                        gridTemplateColumns: `repeat(${
                          queryClub.data?.sites?.length ?? 1
                        }, minmax(0, 1fr)`,
                      }}
                    >
                      {queryClub.data?.sites?.map((site) => (
                        <div key={site.id}>
                          <div className="h-6 w-48 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap bg-secondary px-2 text-center leading-6 text-secondary-content">
                            {site.name}
                          </div>
                          <DropSite
                            key={site.id}
                            id={`${day.value} ${site.id}`}
                            data={{ day: day.value, site: site.id }}
                          >
                            <PlanningActivities
                              clubId={clubId}
                              planningId={planningId}
                              activities={
                                queryPlanning.data?.planningItems.filter(
                                  (pa) =>
                                    pa.day === day.value &&
                                    pa.siteId === site.id,
                                ) ?? []
                              }
                            />
                          </DropSite>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </article>
      <DragOverlay></DragOverlay>
    </DndContext>
  );
}

function DayLabel({ day }: { day: (typeof DAYS)[number]["label"] }) {
  const t = useTranslations("calendar");
  return (
    <span className="h-6 bg-primary text-center leading-6 text-accent-foreground">
      {t(day)}
    </span>
  );
}

type PlanningActivitiesProps = {
  activities: PlanningSearchItemData[];
  clubId: ClubId;
  planningId: PlanningId;
};

function PlanningActivities({
  activities,
  clubId,
  planningId,
}: PlanningActivitiesProps) {
  const HSlots = useMemo(() => {
    if (!activities) return [];
    const hs = activities.map((activity) => ({
      activity,
      position: 0,
      nbPosition: 1,
    }));

    for (let a = 0; a < hs.length; a++) {
      const hmA = hs[a]?.activity.startTime.split(":") ?? ["0", "0"];
      const startA = Number(hmA[0]) + Number(hmA[1]) / 60;
      const durationA = (hs[a]?.activity.duration ?? 0) / 60;
      for (let b = a + 1; b < hs.length; b++) {
        const hmB = hs[b]?.activity.startTime.split(":") ?? ["0", "0"];
        const startB = Number(hmB[0]) + Number(hmB[1]) / 60;
        const durationB = (hs[b]?.activity.duration ?? 0) / 60;
        if (
          (startB >= startA && startB < startA + durationA) ||
          (startB <= startA && startA < startB + durationB)
        ) {
          const elemB = hs[b];
          const elemA = hs[a];
          if (elemB && elemA) {
            elemB.position += 1;
            elemB.nbPosition += 1;
            elemA.nbPosition += 1;
          }
        }
      }
    }
    return hs;
  }, [activities]);

  return (
    <>
      {HSlots.map((slot) => (
        <PlanningActivity
          clubId={clubId}
          planningId={planningId}
          key={slot.activity.slotId}
          planningActivity={slot.activity}
          position={slot.position}
          nbPosition={slot.nbPosition}
        />
      ))}
    </>
  );
}

type PlanningActivityProps = {
  planningId: PlanningId;
  planningActivity: PlanningSearchItemData;
  position: number;
  nbPosition: number;
  clubId: ClubId;
};

function PlanningActivity({
  planningId,
  planningActivity,
  position,
  nbPosition,
  clubId,
}: PlanningActivityProps) {
  const hm = planningActivity.startTime.split(":");
  const top = HHOUR_PX * (Number(hm[0]) - START_HOUR + Number(hm[1]) / 60);
  const height = HHOUR_PX * (planningActivity.duration / 60);
  const w = 100 / nbPosition;
  const [open, setOpen] = useState(false);

  function onClose() {
    setOpen(false);
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        className="absolute"
        style={{ top, height, width: `${w}%`, left: `${position * w}%` }}
      >
        <Button variant="outline" onClick={() => setOpen(true)}>
          {planningActivity.activityName} ({planningActivity.duration}
          {"'"})
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopupActivityDetails
          planningId={planningId}
          slotId={planningActivity.slotId}
          siteId={planningActivity.siteId!}
          clubId={clubId}
          onClose={onClose}
        />
      </PopoverContent>
    </Popover>
  );
}

type PopupActivityDetailsProps = {
  planningId: PlanningId;
  slotId: string;
  clubId: ClubId;
  siteId: SiteId;
  onClose: () => void;
};

function PopupActivityDetails({
  planningId,
  slotId,
  clubId,
  siteId,
  onClose,
}: PopupActivityDetailsProps) {
  const t = useTranslations("calendar");

  const queryPlanning = trpc.plannings.getPlanningActivityById.useQuery(
    { planningId, slotId },
    { enabled: Boolean(slotId) },
  );
  const utils = trpc.useUtils();
  const updatePlanning = trpc.plannings.updatePlanningActivity.useMutation({
    onSuccess(data) {
      utils.plannings.getPlanningById.invalidate({ planningId: data?.[0]?.id });
      toast.success(t("activity-updated"));
    },
  });
  const deletePlanning = trpc.plannings.deletePlanningActivity.useMutation({
    onSuccess(data) {
      utils.plannings.getPlanningById.invalidate({
        planningId: Array.isArray(data) ? data?.[0]?.id : data?.id,
      });
      toast.success(t("activity-deleted"));
    },
  });
  function handleSaveActivity(data: DropFormData) {
    if (slotId)
      updatePlanning.mutate({
        planningId,
        item: {
          slotId,
          activityId: data.activityId,
          coachUserId: data.coachUserId ?? null,
          roomId: data.roomId ?? null,
          siteId,
          startTime: data.startTime,
          duration: data.duration,
        },
      });
    onClose();
  }
  function handleDelete() {
    if (slotId) deletePlanning.mutate({ planningId, slotId });
    onClose();
  }

  return (
    <div>
      {queryPlanning.isLoading ? (
        <Spinner />
      ) : (
        <FormActivity
          clubId={clubId}
          siteId={siteId}
          planningData={queryPlanning.data}
          handleSaveActivity={handleSaveActivity}
          handleDelete={handleDelete}
          update
        />
      )}
    </div>
  );
}

function DraggableActivity({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <Badge
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      size="lg"
      className="bg-card text-card-foreground w-full z-50 cursor-grab"
    >
      {name}
    </Badge>
  );
}

type DropSiteProps = {
  id: string;
  data: {
    day: string;
    site: string;
  };
  children: ReactNode;
};

function DropSite({ id, data, children }: DropSiteProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return (
    <div
      ref={setNodeRef}
      className={`relative ${HSITE} ${isOver ? "bg-muted" : "bg-card"}`}
    >
      {children}
    </div>
  );
}

type FormActivityProps = {
  handleSaveActivity: SubmitHandler<DropFormData>;
  handleDelete?: () => void;
  clubId: ClubId;
  siteId: SiteId;
  planningData?: PlanningSearchItemData | null;
  update?: boolean;
};

function FormActivity({
  handleSaveActivity,
  clubId,
  siteId,
  update = false,
  handleDelete,
  planningData,
}: FormActivityProps) {
  const t = useTranslations("planning");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DropFormData>({
    defaultValues: {
      startTime: planningData?.startTime,
      duration: planningData?.duration,
      activityId: planningData?.activityId,
      roomId: planningData?.roomId ?? ("" as RoomId),
      coachUserId: planningData?.coachUserId ?? ("" as UserId),
    },
  });
  const queryCoachs = trpc.coachs.getCoachsForClub.useQuery({ clubId });
  const rooms = trpc.sites.getRoomsForSite.useQuery(
    { siteId: siteId },
    { enabled: isCUID(planningData?.siteId) },
  );
  const { getName } = useDayName();

  return (
    <form onSubmit={handleSubmit(handleSaveActivity)} className="space-y-2">
      <h2 className="flex items-center gap-4">
        {t("day")}
        <span className="text-primary">{getName(planningData?.day)}</span>
      </h2>
      <div className="space-x-4">
        <label>{t("site")}</label>
        <span className="text-primary">{planningData?.siteName}</span>
      </div>
      <div className="space-x-4">
        <label>{t("activity")}</label>
        <span className="text-primary">{planningData?.activityName}</span>
      </div>
      <Field orientation="horizontal">
        <FieldLabel>{t("start-hour")}</FieldLabel>
        <Input
          type="time"
          {...register("startTime", {
            required: t("start-hour-mandatory") ?? true,
          })}
        />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("duration")}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            type="number"
            {...register("duration", {
              valueAsNumber: true,
              validate: (v) => Number(v) > 1,
              required: t("duration-mandatory") ?? true,
            })}
            className="w-auto flex-1"
          />
          <InputGroupAddon align="inline-end">{t("minutes")}</InputGroupAddon>
        </InputGroup>

        {errors.duration && <FieldError>{errors.duration.message}</FieldError>}
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("coach")}</FieldLabel>
        <Controller
          control={control}
          name="coachUserId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {queryCoachs.data?.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("room")}</FieldLabel>
        <Controller
          control={control}
          name="roomId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rooms?.data?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Separator />
      <div className="flex justify-end gap-2">
        {update ? (
          <Confirmation
            title={t("activity-deletion")}
            message={t("activity-deletion-message")}
            textConfirmation={t("activity-deletion-confirmation")}
            onConfirm={() => {
              if (typeof handleDelete === "function") handleDelete();
            }}
            variant="destructive"
            buttonSize="icon"
            buttonIcon={<Trash />}
          />
        ) : null}
        <Button>{t(update ? "update" : "validation")}</Button>
      </div>
    </form>
  );
}
