"use client";

import { inferProcedureOutput } from "@trpc/server";
import { format, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";

import Confirmation from "@/components/ui/confirmation";
import { SelectDate } from "@/components/ui/selectDay";
import { formatDateLocalized } from "@/lib/formatDate";
import { getButtonSize } from "@/components/ui/modal";
import Spinner from "@/components/ui/spinner";
import { AppRouter } from "@/server/api/root";
import { trpc } from "@/lib/trpc/client";
import DailyPlanning from "./planning";

export default function PlanningAndReservations({
  userId,
}: {
  userId: string;
}) {
  const [day, setDay] = useState(startOfToday());
  const t = useTranslations("dashboard");

  return (
    <>
      <article className="rounded-md border border-primary p-2">
        <div className="mb-2">
          <h2>{t("member.my-planning")}</h2>
          <SelectDate day={day} onNewDay={(newDay) => setDay(newDay)} />
        </div>
        <DailyPlanning day={day} memberId={userId} />
      </article>
      <article className="rounded-md border border-primary p-2">
        <h2>{t("member.my-reservations")}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2">
          <Reservations userId={userId} day={day} />
        </div>
      </article>
    </>
  );
}

function Reservations({ userId, day }: { userId: string; day: Date }) {
  const t = useTranslations("dashboard");

  const queryReservations = trpc.users.getReservationsByUserId.useQuery({
    userId,
    after: day,
  });

  if (queryReservations.isLoading) return <Spinner />;
  if (!queryReservations.data?.length)
    return <div>{t("member.no-reservations")}</div>;

  return (
    <>
      {queryReservations.data?.map((reservation) => (
        <MyReservation
          key={reservation.id}
          reservation={reservation}
          memberId={userId}
          day={day}
        />
      ))}
    </>
  );
}

type MyReservationProps = {
  memberId: string;
  day: Date;
  reservation: inferProcedureOutput<
    AppRouter["users"]["getReservationsByUserId"]
  >[number];
};

function MyReservation({ reservation, memberId, day }: MyReservationProps) {
  const t = useTranslations("dashboard");
  const utils = trpc.useUtils();
  const deleteReservation = trpc.plannings.deleteReservation.useMutation({
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

  function handleDeleteReservation() {
    deleteReservation.mutate(reservation.id);
  }

  return (
    <div className="rounded border border-primary bg-shadcn-card">
      <div className="flex items-center justify-between gap-4 bg-primary px-3 py-1 text-center text-primary-content">
        <span>
          {formatDateLocalized(reservation.date, {
            dateFormat: "short",
            withDay: "long",
          })}
        </span>
        <Confirmation
          message={t("member.reservation-delete-message")}
          title={t("member.delete-reservation")}
          buttonIcon={<i className={`bx bx-trash ${getButtonSize("xs")}`} />}
          onConfirm={() => handleDeleteReservation()}
          buttonSize="xs"
          variant="Icon-Only-Secondary"
        />
      </div>
      {reservation?.planningActivity ? (
        <div className="p-2">
          <div className="space-x-2 text-center">
            <span className="font-semibold">
              {reservation.planningActivity?.activity?.name}
            </span>
            {reservation.planningActivity?.coach?.publicName ? (
              <span className="text-xs">
                {"("}
                {reservation.planningActivity?.coach?.publicName}
                {")"}
              </span>
            ) : null}
          </div>
          <div className="flex justify-between">
            <span>{reservation.planningActivity?.startTime}</span>
            <span>{reservation.planningActivity?.room?.name}</span>
          </div>
        </div>
      ) : null}
      {reservation?.activity ? (
        <div className="p-2">
          <div className="space-x-2 text-center">
            <span className="font-semibold">{reservation.activity?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="space-x-2">
              <span>{format(reservation?.date, "HH:mm")}</span>
              <span className="text-xs">
                {"("}
                {reservation.activity.reservationDuration}
                {"')"}
              </span>
            </span>
            <span>{reservation.room?.name}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
