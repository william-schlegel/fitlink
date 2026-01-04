"use client";

import { add, isBefore, isEqual, startOfDay, startOfToday } from "date-fns";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { roomReservationEnum } from "@/db/schema/enums";
import { useDayName } from "@/lib/dates/useDayName";
import Spinner from "@/components/ui/spinner";
import Modal from "@/components/ui/modal";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

import type { AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type MemberDailyPlanning = RouterOutputs["plannings"]["getMemberDailyPlanning"];
type PlanningData = NonNullable<MemberDailyPlanning>[number];
type ActivityNoCalendar = PlanningData["withNoCalendar"][number];

// Extract nested types from query results
type Activity = ActivityNoCalendar;
type RoomReservation = (typeof roomReservationEnum.enumValues)[number];

// Room type from planning activity
type Room = {
  id: string;
  name: string;
  capacity: number;
  reservation: RoomReservation | null;
};
type CalendarData = RouterOutputs["calendars"]["getCalendarForClub"];
type DayOpeningTimeData =
  NonNullable<CalendarData>["dayOpeningTimes"][number]["dayOpeningTime"];
type DayOpeningTime = DayOpeningTimeData & {
  workingHours: Array<{
    opening: string;
    closing: string;
  }>;
};
type OpeningTime = DayOpeningTime["workingHours"][number];

type DailyPlanningProps = {
  memberId: string;
  day: Date;
};

export default function DailyPlanning({ memberId, day }: DailyPlanningProps) {
  const t = useTranslations("dashboard");
  const planning = trpc.plannings.getMemberDailyPlanning.useQuery({
    date: day,
    memberId,
  });
  if (planning.isLoading) return <Spinner />;
  if (!planning.data || planning.data.length === 0)
    return <div>{t("no-planning")}</div>;
  return (
    <div className="flex flex-col gap-2">
      {planning.data.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col items-center rounded border border-secondary bg-card"
        >
          <div className="w-full  bg-secondary text-center text-secondary-content">
            {plan.club.name}
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
            {plan.activities.map((activity) => (
              <div
                key={activity.id}
                className="border border-border bg-card p-2"
              >
                <p>
                  <span className="text-xs">{activity.startTime}</span>
                  {" ("}
                  <span className="text-xs">{activity.duration}</span>
                  {"') "}
                  <span>{activity.activity?.name}</span>
                </p>
                <p className="text-xs">
                  <span>{activity.site?.name}</span>
                  {" - "}
                  <span>{activity.room?.name}</span>
                </p>
                <MakeReservation
                  room={activity.room ?? null}
                  reservations={activity.reservations}
                  memberId={memberId}
                  planningActivityId={activity.id}
                  day={day}
                />
              </div>
            ))}
            {plan.withNoCalendar.map((activity) => (
              <Wnc
                key={activity.id}
                activity={activity}
                day={day}
                memberId={memberId}
                reservations={activity.reservations}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type MakeReservationProps = {
  room: Room | null;
  reservations: { id: string; date: Date }[];
  planningActivityId: string;
  memberId: string;
  day: Date;
};
function MakeReservation({
  room,
  reservations,
  planningActivityId,
  memberId,
  day,
}: MakeReservationProps) {
  const t = useTranslations("dashboard");
  const utils = trpc.useUtils();
  const createReservation =
    trpc.plannings.createPlanningReservation.useMutation({
      onSuccess() {
        utils.users.getReservationsByUserId.invalidate({
          userId: memberId,
          after: day,
        });
        utils.plannings.getMemberDailyPlanning.invalidate({
          memberId,
          date: day,
        });
      },
    });

  if (!room) return null;
  if (isBefore(day, startOfToday())) return null;

  const free =
    room.capacity > reservations.length
      ? room.capacity - reservations.length
      : 0;
  if (room.reservation === "NONE")
    return (
      <div className="text-center">
        <p className="btn-outline btn-disabled btn btn-xs">
          {t("member.free-access")}
        </p>
      </div>
    );

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs">
        {free
          ? t("member.remain", { free, capacity: room.capacity })
          : t("member.waiting-list")}
      </p>
      {reservations.find(
        (r) => r.id === planningActivityId && isEqual(day, r.date),
      ) ? (
        <span className="btn btn-accent btn-xs">{t("member.reserved")}</span>
      ) : (
        <button
          className="btn btn-primary btn-xs"
          onClick={() =>
            createReservation.mutate({
              planningActivityId,
              memberId,
              date: day,
            })
          }
        >
          {t("member.reserve")}
        </button>
      )}
    </div>
  );
}

type WncRoom = {
  id: string;
  name: string;
  capacity: number;
  reservation: RoomReservation;
};

type WncProps = {
  activity: Activity & {
    rooms: WncRoom[];
  };
  day: Date;
  memberId: string;
  reservations: { id: string; date: Date }[];
};

type TOpeningTime =
  | (DayOpeningTime & {
      workingHours: OpeningTime[];
    })
  | null;

function Wnc({ activity, day, memberId, reservations }: WncProps) {
  const t = useTranslations("dashboard");
  const { getDayForDate } = useDayName();
  const dayName = getDayForDate(day);
  const calClub = trpc.calendars.getCalendarForClub.useQuery(
    activity.clubId,

    { enabled: isCUID(activity.clubId) },
  );

  let openingText = "";
  let OT: TOpeningTime = null;
  if (calClub.data) {
    const dayOpeningTime = calClub.data.dayOpeningTimes.find(
      (d) => d.dayOpeningTime.name === dayName,
    );
    if (dayOpeningTime) {
      // Note: openingTimes are not included in the current query
      // For now, we'll create an empty workingHours array
      // TODO: Update calendar query to include openingTimes if needed
      OT = {
        ...dayOpeningTime.dayOpeningTime,
        workingHours: [],
      };
    }
  }

  if (OT?.wholeDay) openingText = t("member.all-day");
  else if (OT?.closed) openingText = t("member.closed");
  else {
    openingText =
      OT?.workingHours.map((wh) => `${wh.opening}-${wh.closing}`).join(" | ") ??
      "";
  }

  return (
    <>
      {activity.rooms.map((room) => (
        <div
          key={`${room?.name}-${activity.id}`}
          className="border border-border bg-card p-2"
        >
          <p>
            <span className="text-xs">{openingText}</span>&nbsp;
            <span>{activity.name}</span>
          </p>
          <p className="text-xs">
            {room?.name ? <span>{room.name}</span> : null}
          </p>
          <ReserveDuration
            activity={activity}
            room={room}
            reservations={reservations}
            day={day}
            memberId={memberId}
            workingHours={OT}
          />
        </div>
      ))}
    </>
  );
}

type ReserveDurationProps = {
  activity: Activity;
  room: WncRoom;
  reservations: { id: string; date: Date }[];
  day: Date;
  memberId: string;
  workingHours: TOpeningTime;
};

function ReserveDuration({
  room,
  activity,
  reservations,
  day,
  memberId,
  workingHours,
}: ReserveDurationProps) {
  const t = useTranslations("dashboard");
  const utils = trpc.useContext();
  const createReservation =
    trpc.plannings.createActivityReservation.useMutation({
      onSuccess() {
        utils.users.getReservationsByUserId.invalidate({
          userId: memberId,
          after: day,
        });
        utils.plannings.getMemberDailyPlanning.invalidate({
          memberId,
          date: day,
        });
      },
    });
  const [closeModal, setCloseModal] = useState(false);

  if (isBefore(day, startOfToday())) return null;

  const onSubmit = (slot: TSlot) => {
    const [hours, minutes] = getHour(setHour(slot.start));
    const date = add(startOfDay(day), { hours, minutes });
    createReservation.mutate({
      date,
      memberId,
      activityId: activity.id,
      roomId: room.id,
      activitySlot: slot.number,
    });
    setCloseModal(true);
  };

  if (
    (room as WncRoom)?.reservation === "NONE" ||
    !(room as WncRoom)?.reservation
  )
    return (
      <div className="text-center">
        <p className="btn-outline btn-disabled btn btn-xs">
          {t("member.free-access")}
        </p>
      </div>
    );
  const free =
    room.capacity > reservations.length
      ? room.capacity - reservations.length
      : 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs">
        {free
          ? t("member.remain", { free, capacity: room.capacity })
          : t("member.waiting-list")}
      </p>
      {reservations.find(
        (r) => r.id === activity.id && isEqual(day, r.date),
      ) ? (
        <span className="btn btn-accent btn-xs">{t("member.reserved")}</span>
      ) : (
        <Modal
          title={t("member.reserve")}
          variant="Primary"
          buttonSize="xs"
          cancelButtonText=""
          closeModal={closeModal}
          onCloseModal={() => setCloseModal(false)}
        >
          <h3>{t("member.reserve")}</h3>
          <label>{t("club.activity.slot")}</label>
          <AvailableSlots
            workingHours={workingHours}
            duration={activity.reservationDuration ?? 60}
            day={day}
            reservations={reservations}
            onSelect={(slot) => onSubmit(slot)}
          />
        </Modal>
      )}
    </div>
  );
}

type TSlot = {
  start: number;
  end: number;
  slot: string;
  number: number;
  available: boolean;
};
type AvailableSlotsProps = {
  workingHours: TOpeningTime;
  reservations: { id: string; date: Date }[];
  onSelect: (slot: TSlot) => void;
  duration: number;
  day: Date;
};

function getHour(workingHour: string | null | undefined) {
  if (workingHour == null || workingHour == undefined) return [0, 0];
  const hm = workingHour.split(":");
  if (hm.length < 2) return [0, 0];
  const h = Number(hm[0]);
  const m = Number(hm[1]);
  return [h, m];
}

function setHour(hm: number) {
  const h = Math.floor(hm);
  const m = (hm - h) * 60;
  return `${`0${h}`.slice(-2)}:${`0${m}`.slice(-2)}`;
}

function AvailableSlots({
  workingHours,
  reservations,
  duration,
  onSelect,
  day,
}: AvailableSlotsProps) {
  const t = useTranslations("dashboard");
  const slots: Array<TSlot> = [];
  if (!workingHours)
    return <span className="ml-4">{t("club.activity.no-slot")}</span>;
  const [hs, ms] = getHour(workingHours.workingHours[0]?.opening);
  let hStart = (hs ?? 0) + (ms ?? 0) / 60;
  const [he, me] = getHour(workingHours.workingHours[0]?.closing);
  const hEnd = (he ?? 0) + (me ?? 0) / 60;
  const durationDec = duration / 60;

  function checkAvailability(start: number) {
    const [hours, minutes] = getHour(setHour(start));
    const dtStart = add(startOfDay(day), { hours, minutes });
    const dtEnd = add(startOfDay(day), {
      hours,
      minutes: minutes ?? 0 + duration,
    });
    const reserved = reservations.find(
      (r) => r.date >= dtStart && r.date <= dtEnd,
    );
    return !reserved;
  }

  while (hStart < hEnd) {
    const end = Math.min(hStart + durationDec, hEnd);
    slots.push({
      start: hStart,
      end,
      slot: `${setHour(hStart)} : ${setHour(end)}`,
      available: checkAvailability(hStart),
      number: slots.length,
    });
    hStart += durationDec;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
      {slots.map((slot, idx) => (
        <span
          key={idx}
          className={`btn btn-sm ${
            slot.available ? "btn-primary" : "btn-disabled"
          }`}
          onClick={() => onSelect(slot)}
        >
          {slot.slot}
        </span>
      ))}
    </div>
  );
}
