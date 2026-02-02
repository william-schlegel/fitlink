"use client";

import { isBefore, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { trpc } from "@/lib/trpc/client";

import { Badge, Button } from "@/components/ui/shadcn";

import { ReservationData } from "@/db/dal";
import { PlanningId, RoomId } from "@/db/types";
import { isCUID } from "@/lib/utils";
import { toast } from "sonner";

type DailyPlanningProps = {
  memberId: string;
  day: Date;
};

export default function DailyPlanning({ memberId, day }: DailyPlanningProps) {
  const t = useTranslations("dashboard");
  const memberPlanning = trpc.plannings.getMemberDailyPlanning.useQuery({
    date: day,
    memberId,
  });
  if (memberPlanning.isLoading) return <Spinner />;
  if (!memberPlanning.data || memberPlanning.data.planning.length === 0)
    return <div>{t("no-planning")}</div>;
  return (
    <div className="flex flex-col gap-2">
      {memberPlanning.data.planning.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col items-center rounded border border-secondary bg-card"
        >
          <div className="w-full  bg-secondary text-center text-secondary-content">
            {plan.clubName}
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
            {plan.planningItems.map((item) => (
              <div
                key={item.slotId}
                className="border border-border bg-card p-2"
              >
                <p>
                  <span className="text-xs">{item.startTime}</span>
                  {" ("}
                  <span className="text-xs">{item.duration}</span>
                  {"') "}
                  <span>{item.activityName}</span>
                </p>
                <p className="text-xs">
                  <span>{item.siteName}</span>
                  {" - "}
                  <span>{item.roomName}</span>
                </p>
                {item.roomId ? (
                  <MakeReservation
                    roomId={item.roomId}
                    reservations={memberPlanning.data.reservations.filter(
                      (r) => r.planningId === plan.id,
                    )}
                    memberId={memberId}
                    slotId={item.slotId}
                    day={day}
                    planningId={plan.id}
                  />
                ) : null}
              </div>
            ))}
            {/* plan.withNoCalendar.map((activity) => (
              <Wnc
                key={activity.id}
                activity={activity}
                day={day}
                memberId={memberId}
                reservations={activity.reservations}
              />
            )) */}
          </div>
        </div>
      ))}
    </div>
  );
}

type MakeReservationProps = {
  roomId: RoomId;
  planningId: PlanningId;
  slotId: string;
  reservations: ReservationData[];
  memberId: string;
  day: Date;
};
function MakeReservation({
  planningId,
  slotId,
  roomId,
  reservations,
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
        toast.success(t("member.reservation-created"));
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  const roomDetails = trpc.sites.getRoomById.useQuery(roomId, {
    enabled: isCUID(roomId),
  });

  if (isBefore(day, startOfToday())) return null;
  if (!roomId) return null;
  if (!roomDetails.data) return null;
  const room = roomDetails.data;

  const free =
    room.capacity > reservations.length
      ? room.capacity - reservations.length
      : 0;
  if (room.reservation === "NONE")
    return <Badge variant="info">{t("member.free-access")}</Badge>;

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs">
        {free
          ? t("member.remain", { free, capacity: room.capacity })
          : t("member.waiting-list")}
      </p>
      {reservations.find((r) => r.slotId === slotId) ? (
        <Badge variant="secondary">{t("member.reserved")}</Badge>
      ) : (
        <Button
          onClick={() =>
            createReservation.mutate({
              planningId,
              slotId,
              memberId,
              date: day,
            })
          }
        >
          {t("member.reserve")}
        </Button>
      )}
    </div>
  );
}

// type WncRoom = {
//   id: string;
//   name: string;
//   capacity: number;
//   reservation: RoomReservation;
// };

// type WncProps = {
//   activity: Activity & {
//     rooms: WncRoom[];
//   };
//   day: Date;
//   memberId: string;
//   reservations: { id: string; date: Date }[];
// };

// type TOpeningTime =
//   | (DayOpeningTime & {
//       workingHours: OpeningTime[];
//     })
//   | null;

// function Wnc({ activity, day, memberId, reservations }: WncProps) {
//   const t = useTranslations("dashboard");
//   const { getDayForDate } = useDayName();
//   const dayName = getDayForDate(day);
//   const calClub = trpc.calendars.getCalendarForClub.useQuery(
//     activity.clubId,

//     { enabled: isCUID(activity.clubId) },
//   );

//   let openingText = "";
//   let OT: TOpeningTime = null;
//   if (calClub.data) {
//     const dayOpeningTime = calClub.data.dayOpeningTimes.find(
//       (d) => d.dayOpeningTime.name === dayName,
//     );
//     if (dayOpeningTime) {
//       // Note: openingTimes are not included in the current query
//       // For now, we'll create an empty workingHours array
//       // TODO: Update calendar query to include openingTimes if needed
//       OT = {
//         ...dayOpeningTime.dayOpeningTime,
//         workingHours: [],
//       };
//     }
//   }

//   if (OT?.wholeDay) openingText = t("member.all-day");
//   else if (OT?.closed) openingText = t("member.closed");
//   else {
//     openingText =
//       OT?.workingHours.map((wh) => `${wh.opening}-${wh.closing}`).join(" | ") ??
//       "";
//   }

//   return (
//     <>
//       {activity.rooms.map((room) => (
//         <div
//           key={`${room?.name}-${activity.id}`}
//           className="border border-border bg-card p-2"
//         >
//           <p>
//             <span className="text-xs">{openingText}</span>&nbsp;
//             <span>{activity.name}</span>
//           </p>
//           <p className="text-xs">
//             {room?.name ? <span>{room.name}</span> : null}
//           </p>
//           <ReserveDuration
//             activity={activity}
//             room={room}
//             reservations={reservations}
//             day={day}
//             memberId={memberId}
//             workingHours={OT}
//           />
//         </div>
//       ))}
//     </>
//   );
// }

// type ReserveDurationProps = {
//   activity: Activity;
//   room: WncRoom;
//   reservations: { id: string; date: Date }[];
//   day: Date;
//   memberId: string;
//   workingHours: TOpeningTime;
// };

// function ReserveDuration({
//   room,
//   activity,
//   reservations,
//   day,
//   memberId,
//   workingHours,
// }: ReserveDurationProps) {
//   const t = useTranslations("dashboard");
//   const utils = trpc.useContext();
//   const createReservation =
//     trpc.plannings.createActivityReservation.useMutation({
//       onSuccess() {
//         utils.users.getReservationsByUserId.invalidate({
//           userId: memberId,
//           after: day,
//         });
//         utils.plannings.getMemberDailyPlanning.invalidate({
//           memberId,
//           date: day,
//         });
//       },
//     });
//   const [closeModal, setCloseModal] = useState(false);

//   if (isBefore(day, startOfToday())) return null;

//   const onSubmit = (slot: TSlot) => {
//     const [hours, minutes] = getHour(setHour(slot.start));
//     const date = add(startOfDay(day), { hours, minutes });
//     createReservation.mutate({
//       date,
//       memberId,
//       activityId: activity.id,
//       roomId: room.id,
//       activitySlot: slot.number,
//     });
//     setCloseModal(true);
//   };

//   if (
//     (room as WncRoom)?.reservation === "NONE" ||
//     !(room as WncRoom)?.reservation
//   )
//     return <Badge variant="info">{t("member.free-access")}</Badge>;
//   const free =
//     room.capacity > reservations.length
//       ? room.capacity - reservations.length
//       : 0;

//   return (
//     <div className="flex items-center justify-between gap-2">
//       <p className="text-xs">
//         {free
//           ? t("member.remain", { free, capacity: room.capacity })
//           : t("member.waiting-list")}
//       </p>
//       {reservations.find(
//         (r) => r.id === activity.id && isEqual(day, r.date),
//       ) ? (
//         <Badge variant="secondary">{t("member.reserved")}</Badge>
//       ) : (
//         <Modal
//           title={t("member.reserve")}
//           variant="default"
//           buttonSize="sm"
//           cancelButtonText=""
//           closeModal={closeModal}
//           onCloseModal={() => setCloseModal(false)}
//           size="sm"
//         >
//           <h3>{t("member.reserve")}</h3>
//           <label>{t("club.activity.slot")}</label>
//           <AvailableSlots
//             workingHours={workingHours}
//             duration={activity.reservationDuration ?? 60}
//             day={day}
//             reservations={reservations}
//             onSelect={(slot) => onSubmit(slot)}
//           />
//         </Modal>
//       )}
//     </div>
//   );
// }

// type TSlot = {
//   start: number;
//   end: number;
//   slot: string;
//   number: number;
//   available: boolean;
// };
// type AvailableSlotsProps = {
//   workingHours: TOpeningTime;
//   reservations: { id: string; date: Date }[];
//   onSelect: (slot: TSlot) => void;
//   duration: number;
//   day: Date;
// };

// function getHour(workingHour: string | null | undefined) {
//   if (workingHour == null || workingHour == undefined) return [0, 0];
//   const hm = workingHour.split(":");
//   if (hm.length < 2) return [0, 0];
//   const h = Number(hm[0]);
//   const m = Number(hm[1]);
//   return [h, m];
// }

// function setHour(hm: number) {
//   const h = Math.floor(hm);
//   const m = (hm - h) * 60;
//   return `${`0${h}`.slice(-2)}:${`0${m}`.slice(-2)}`;
// }

// function AvailableSlots({
//   workingHours,
//   reservations,
//   duration,
//   onSelect,
//   day,
// }: AvailableSlotsProps) {
//   const t = useTranslations("dashboard");
//   const slots: Array<TSlot> = [];
//   if (!workingHours)
//     return <Badge variant="warning">{t("club.activity.no-slot")}</Badge>;
//   const [hs, ms] = getHour(workingHours.workingHours[0]?.opening);
//   let hStart = (hs ?? 0) + (ms ?? 0) / 60;
//   const [he, me] = getHour(workingHours.workingHours[0]?.closing);
//   const hEnd = (he ?? 0) + (me ?? 0) / 60;
//   const durationDec = duration / 60;

//   function checkAvailability(start: number) {
//     const [hours, minutes] = getHour(setHour(start));
//     const dtStart = add(startOfDay(day), { hours, minutes });
//     const dtEnd = add(startOfDay(day), {
//       hours,
//       minutes: minutes ?? 0 + duration,
//     });
//     const reserved = reservations.find(
//       (r) => r.date >= dtStart && r.date <= dtEnd,
//     );
//     return !reserved;
//   }

//   while (hStart < hEnd) {
//     const end = Math.min(hStart + durationDec, hEnd);
//     slots.push({
//       start: hStart,
//       end,
//       slot: `${setHour(hStart)} : ${setHour(end)}`,
//       available: checkAvailability(hStart),
//       number: slots.length,
//     });
//     hStart += durationDec;
//   }

//   return (
//     <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
//       {slots.map((slot, idx) => (
//         <Button
//           key={idx}
//           variant={slot.available ? "default" : "ghost"}
//           onClick={() => onSelect(slot)}
//         >
//           {slot.slot}
//         </Button>
//       ))}
//     </div>
//   );
// }
