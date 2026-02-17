"use client";

import { inferProcedureOutput } from "@trpc/server";
import { startOfDay, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Trash } from "lucide-react";

import Confirmation from "@/components/ui/confirmation";
import { SelectDate } from "@/components/ui/selectDay";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { formatDateLocalized } from "@/lib/formatDate";
import { trpc } from "@/lib/trpc/client";
import { AppRouter } from "@/server/api/root";
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
    after: startOfDay(new Date()),
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

  const reservationDate = formatDateLocalized(reservation.date, {
    dateFormat: "short",
    withDay: "long",
  });
  const startTime = reservation.planningItem?.startTime ?? "--:--";
  const activityName = reservation.planningItem?.activity?.name ?? "-";
  const coachName = reservation.planningItem?.coach?.publicName ?? "-";
  const roomName = reservation.planningItem?.room?.name ?? "-";
  const siteName = reservation.planningItem?.site?.name ?? "-";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="w-full text-left">
          <Card className="h-full cursor-pointer transition-colors hover:bg-accent/30">
            <CardHeader>
              <CardTitle>{activityName}</CardTitle>
              <CardDescription>{reservationDate}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <p>{startTime}</p>
              <p className="text-muted-foreground">{coachName}</p>
              <p className="text-muted-foreground">{roomName}</p>
            </CardContent>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent size="xs">
        <DialogHeader>
          <DialogTitle>{activityName}</DialogTitle>
          <DialogDescription>{reservationDate}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">
              {t("reservation.time")}
            </span>
            <span>{startTime}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">
              {t("reservation.coach")}
            </span>
            <span>{coachName}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">
              {t("reservation.site")}
            </span>
            <span>{siteName}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">
              {t("reservation.room")}
            </span>
            <span>{roomName}</span>
          </div>
        </div>
        <DialogFooter>
          <Confirmation
            message={t("member.reservation-delete-message")}
            title={t("member.delete-reservation")}
            buttonIcon={<Trash className="size-4" />}
            onConfirm={() => handleDeleteReservation()}
            variant="destructive"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
