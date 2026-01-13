"use client";

import { startTransition, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { CalendarPlus, Plus } from "lucide-react";

import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/shadcn/table";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { Field, FieldLabel } from "../ui/shadcn/field";
import { Checkbox } from "../ui/shadcn/checkbox";
import { DayName, DAYS } from "@/lib/dates/data";
import { fieldSet } from "@/lib/fieldGetSet";
import { Input } from "../ui/shadcn/input";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import Modal from "../ui/modal";

type WorkingHoursSchema = {
  opening: string;
  closing: string;
};

type OpeningTimeSchema = {
  name: DayName;
  wholeDay: boolean;
  closed: boolean;
  workingHours: WorkingHoursSchema[];
};
type CalendarFormSchema = {
  startDate: Date;
  openingTime: OpeningTimeSchema[];
};

function useFormCalendar(initialCalendar?: CalendarFormSchema) {
  const calendarDefaultValues: CalendarFormSchema = {
    startDate: new Date(),
    openingTime: DAYS.map((day) => ({
      name: day.value,
      wholeDay: true,
      closed: false,
      workingHours: [
        {
          opening: "00:00",
          closing: "23:59",
        },
      ],
    })),
  };
  const [calendar, setCalendar] = useState(calendarDefaultValues);
  useEffect(() => {
    if (initialCalendar) {
      startTransition(() => {
        setCalendar(initialCalendar);
      });
    }
  }, [initialCalendar]);

  function updateCalendar(cal: CalendarFormSchema) {
    setCalendar(cal);
  }

  return { calendar, updateCalendar };
}

type FormCalendarProps = {
  calendarValues: CalendarFormSchema;
  onCalendarChange: (cal: CalendarFormSchema) => void;
};

function FormCalendar({ calendarValues, onCalendarChange }: FormCalendarProps) {
  const t = useTranslations("calendar");

  const onChange = (path: string, value: unknown) => {
    const cv = { ...calendarValues };
    fieldSet(cv, path, value);
    onCalendarChange(cv);
  };
  return (
    <>
      <Field>
        <FieldLabel htmlFor="calendar-start-date">{t("start-date")}</FieldLabel>
        <Input
          id="calendar-start-date"
          type="date"
          value={formatDateAsYYYYMMDD(calendarValues.startDate)}
          onChange={(e) => onChange("startDate", new Date(e.target.value))}
          className="text-center"
        />
      </Field>
      <Table className="w-full table-auto">
        {/* header */}
        <TableHeader>
          <TableRow>
            <TableHead>{t("day")}</TableHead>
            <TableHead>{t("whole-day")}</TableHead>
            <TableHead>{t("closed")}</TableHead>
            <TableHead>{t("times")}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DAYS.map((day, idx) => (
            <TableRow key={day.value}>
              <TableCell>{t(day.label)}</TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={calendarValues.openingTime[idx]?.wholeDay ?? true}
                  onCheckedChange={(checked) =>
                    onChange(`openingTime.${idx}.wholeDay`, !!checked)
                  }
                />
              </TableCell>
              {!calendarValues.openingTime[idx]?.wholeDay ? (
                <>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={calendarValues.openingTime[idx]?.closed ?? false}
                      onCheckedChange={(checked) =>
                        onChange(`openingTime.${idx}.closed`, !!checked)
                      }
                    />
                  </TableCell>

                  {!calendarValues.openingTime[idx]?.closed ? (
                    <>
                      <TableCell className="flex gap-2">
                        <Input
                          type="time"
                          value={
                            calendarValues.openingTime[idx]?.workingHours?.[0]
                              ?.opening
                          }
                          onChange={(e) =>
                            onChange(
                              `openingTime.${idx}.workingHours.0.opening`,
                              e.target.value,
                            )
                          }
                          className="w-fit text-center"
                        />
                        <Input
                          type="time"
                          value={
                            calendarValues.openingTime[idx]?.workingHours?.[0]
                              ?.closing
                          }
                          onChange={(e) =>
                            onChange(
                              `openingTime.${idx}.workingHours.0.closing`,
                              e.target.value,
                            )
                          }
                          className="w-fit text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <ButtonIcon
                          title={t("more-times")}
                          iconComponent={<Plus />}
                          size="icon"
                          variant="outlines"
                        />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell />
                      <TableCell />
                    </>
                  )}
                </>
              ) : (
                <>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

type ClubCalendarProps = {
  clubId: string;
};

export const CreateClubCalendar = ({ clubId }: ClubCalendarProps) => {
  const t = useTranslations("calendar");
  const utils = trpc.useUtils();
  const { calendar, updateCalendar } = useFormCalendar();
  const saveCalendar = trpc.calendars.createCalendar.useMutation();

  function onSubmit() {
    saveCalendar.mutate({ calendar, clubId });
  }

  useEffect(() => {
    utils.calendars.getCalendarForClub.invalidate(clubId);
  }, [saveCalendar.data, utils, clubId]);

  return (
    <Modal
      title={t("create-club-calendar")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-calendar")}
      buttonIcon={<CalendarPlus />}
      variant="outline"
      buttonSize="icon"
    >
      <h3>{t("create-club-calendar")}</h3>
      <FormCalendar
        calendarValues={calendar}
        onCalendarChange={updateCalendar}
      />
    </Modal>
  );
};

type SiteCalendarProps = {
  siteId: string;
  clubId: string;
};

export const CreateSiteCalendar = ({ siteId, clubId }: SiteCalendarProps) => {
  const t = useTranslations("calendar");
  const [showCalendar, setShowCalendar] = useState(false);
  const { calendar, updateCalendar } = useFormCalendar();
  const saveCalendar = trpc.calendars.createCalendar.useMutation();
  const utils = trpc.useUtils();

  function onSubmit() {
    saveCalendar.mutate({ calendar, siteId });
  }
  useEffect(() => {
    utils.calendars.getCalendarForSite.invalidate({ clubId, siteId });
  }, [saveCalendar.data, utils, clubId, siteId]);

  return (
    <Modal
      title={t("create-site-calendar")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-calendar")}
      buttonIcon={<CalendarPlus />}
      variant="outline"
      buttonSize="icon"
    >
      <h3>{t("create-site-calendar")}</h3>
      <Field orientation="horizontal">
        <Checkbox
          id="same-as-club"
          checked={!showCalendar}
          onCheckedChange={(checked) => setShowCalendar(!checked)}
        />
        <FieldLabel htmlFor="same-as-club">{t("same-as-club")}</FieldLabel>
      </Field>
      {showCalendar ? (
        <FormCalendar
          calendarValues={calendar}
          onCalendarChange={updateCalendar}
        />
      ) : null}
    </Modal>
  );
};

type RoomCalendarProps = {
  clubId: string;
  siteId: string;
  roomId: string;
};

export const CreateRoomCalendar = ({
  roomId,
  siteId,
  clubId,
}: RoomCalendarProps) => {
  const t = useTranslations("calendar");
  const [sameAsClub, setSameAsClub] = useState(true);
  const [sameAsSite, setSameAsSite] = useState(true);
  const { calendar, updateCalendar } = useFormCalendar();
  const utils = trpc.useUtils();

  const saveCalendar = trpc.calendars.createCalendar.useMutation({
    onSuccess() {
      utils.calendars.getCalendarForRoom.invalidate({
        clubId,
        roomId,
        siteId,
      });
      toast.success(t("calendar-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const updateRoom = trpc.sites.updateRoom.useMutation({
    onSuccess() {
      utils.calendars.getCalendarForRoom.invalidate({
        clubId,
        roomId,
        siteId,
      });
    },
  });

  function onSubmit() {
    if (sameAsClub || sameAsSite) {
      updateRoom.mutate({
        id: roomId,
        openWithClub: sameAsClub,
        openWithSite: sameAsSite,
      });
    } else {
      saveCalendar.mutate({ calendar, roomId });
    }
  }

  return (
    <Modal
      title={t("create-room-calendar")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-calendar")}
      buttonIcon={<CalendarPlus />}
      variant="outline"
      buttonSize="icon"
    >
      <h3>{t("create-room-calendar")}</h3>
      <Field orientation="horizontal">
        <Checkbox
          id="same-as-club"
          checked={sameAsClub}
          onCheckedChange={(checked) => setSameAsClub(!!checked)}
        />
        <FieldLabel htmlFor="same-as-club">{t("same-as-club")}</FieldLabel>
      </Field>
      {sameAsClub ? null : (
        <Field orientation="horizontal">
          <Checkbox
            id="same-as-site"
            checked={sameAsSite}
            onCheckedChange={(checked) => setSameAsSite(!!checked)}
          />
          <FieldLabel htmlFor="same-as-site">{t("same-as-site")}</FieldLabel>
        </Field>
      )}
      {!sameAsClub && !sameAsSite ? (
        <FormCalendar
          calendarValues={calendar}
          onCalendarChange={updateCalendar}
        />
      ) : null}
    </Modal>
  );
};
