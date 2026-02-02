"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  Controller,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";

import Modal from "@/components/ui/modal";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import {
  ActivityId,
  ClubId,
  PlanningId,
  RoomId,
  SiteId,
  UserId,
} from "@/db/types";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { Pencil } from "lucide-react";

type ManageCourseProps = {
  planningId: PlanningId;
  slotId: string;
  clubId: ClubId;
  userId: UserId;
  siteId: SiteId;
  date: Date | string;
  activityId: ActivityId;
  coachUserId: UserId | null;
  roomId: RoomId | null;
  startTime: string;
  activityName?: string;
  siteName?: string;
};

type CourseFormValues = {
  date: Date;
  startTime: string;
  activityId: ActivityId;
  coachUserId: UserId;
  roomId: RoomId;
};

function getTimeString(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function ManageCourse({
  planningId,
  slotId,
  clubId,
  userId,
  siteId,
  date,
  activityId,
  coachUserId,
  roomId,
  startTime,
  activityName,
  siteName,
}: ManageCourseProps) {
  const t = useTranslations("planning");
  const router = useRouter();
  const baseDate = useMemo(
    () => (typeof date === "string" ? new Date(date) : date),
    [date],
  );

  const courseQuery = trpc.plannings.getCourseForSlotDate.useQuery(
    { planningId, slotId, date: baseDate },
    { enabled: isCUID(planningId) && Boolean(slotId) },
  );

  const clubQuery = trpc.clubs.getClubById.useQuery(
    { clubId, userId },
    { enabled: isCUID(clubId) && isCUID(userId) },
  );
  const coachsQuery = trpc.coachs.getCoachsForClub.useQuery(
    { clubId },
    { enabled: isCUID(clubId) },
  );
  const roomsQuery = trpc.sites.getRoomsForSite.useQuery(
    { siteId },
    { enabled: isCUID(siteId) },
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<CourseFormValues>({
    defaultValues: {
      date: baseDate,
      startTime,
      activityId,
      coachUserId: coachUserId ?? ("" as UserId),
      roomId: roomId ?? ("" as RoomId),
    },
  });

  useEffect(() => {
    const course = courseQuery.data;
    const nextDate = course?.date ?? baseDate;
    reset({
      date: nextDate,
      startTime: course ? getTimeString(course.date) : startTime,
      activityId: course?.activityId ?? activityId,
      coachUserId: course?.coachUserId ?? coachUserId ?? ("" as UserId),
      roomId: course?.roomId ?? roomId ?? ("" as RoomId),
    });
  }, [
    activityId,
    baseDate,
    coachUserId,
    courseQuery.data,
    reset,
    roomId,
    startTime,
  ]);

  const utils = trpc.useUtils();
  const upsertCourse = trpc.plannings.upsertCourseForSlotDate.useMutation({
    onSuccess: (data) => {
      utils.plannings.getCourseForSlotDate.invalidate({
        planningId,
        slotId,
        date: data?.date ?? baseDate,
      });
      toast.success(t("update-course"));
      router.refresh();
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<CourseFormValues> = (data) => {
    const [hours, minutes] = data.startTime.split(":").map(Number);
    const courseDate = new Date(data.date);
    courseDate.setHours(
      Number.isNaN(hours) ? 0 : hours,
      Number.isNaN(minutes) ? 0 : minutes,
      0,
      0,
    );
    upsertCourse.mutate({
      courseId: courseQuery.data?.id,
      planningId,
      slotId,
      date: courseDate,
      activityId: data.activityId,
      siteId,
      roomId: data.roomId,
      coachUserId: data.coachUserId,
    });
  };

  const onError: SubmitErrorHandler<CourseFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("update-course")}
      buttonIcon={<Pencil />}
      handleSubmit={handleSubmit(onSubmit, onError)}
      variant="outline"
      buttonSize="icon"
      size="sm"
    >
      <h3 className="flex items-center gap-2">{t("update-course")}</h3>
      {siteName ? (
        <p className="text-xs text-muted-foreground">
          {t("site")}: {siteName}
        </p>
      ) : null}
      {activityName ? (
        <p className="text-xs text-muted-foreground">
          {t("activity")}: {activityName}
        </p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`course-date-${slotId}`}>
                {t("start-date")}
              </FieldLabel>
              <Controller
                control={control}
                name="date"
                rules={{ required: t("date-mandatory") ?? true }}
                render={({ field }) => (
                  <Input
                    id={`course-date-${slotId}`}
                    type="date"
                    value={field.value ? formatDateAsYYYYMMDD(field.value) : ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value
                          ? new Date(event.target.value)
                          : null,
                      )
                    }
                  />
                )}
              />
              {errors.date && <FieldError>{t("date-mandatory")}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor={`course-start-${slotId}`}>
                {t("start-hour")}
              </FieldLabel>
              <Input
                id={`course-start-${slotId}`}
                type="time"
                {...register("startTime", {
                  required: t("start-hour-mandatory") ?? true,
                })}
              />
              {errors.startTime && (
                <FieldError>{t("start-hour-mandatory")}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>{t("activity")}</FieldLabel>
              <Controller
                control={control}
                name="activityId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clubQuery.data?.activities?.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.activityId && <FieldError>{t("activity")}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>{t("coach")}</FieldLabel>
              <Controller
                control={control}
                name="coachUserId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {coachsQuery.data?.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.coachUserId && <FieldError>{t("coach")}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>{t("room")}</FieldLabel>
              <Controller
                control={control}
                name="roomId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomsQuery.data?.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.roomId && <FieldError>{t("room")}</FieldError>}
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </Modal>
  );
}
