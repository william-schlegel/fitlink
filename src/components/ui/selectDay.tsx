"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addDays, startOfToday, subDays } from "date-fns";
import { useRouter } from "next/navigation";

import { useTranslations } from "next-intl";

import { ButtonGroup, ButtonGroupText } from "./shadcn/button-group";
import { Button } from "@/components/ui/shadcn/button";
import { formatDateLocalized } from "@/lib/formatDate";
import { useDayName } from "@/lib/dates/useDayName";
import { DayName } from "@/lib/dates/data";

type SelectDayProps = {
  day: DayName;
  onNewDay?: (newDay: DayName) => void;
  redirectTo?: string;
};

export default function SelectDay({
  day,
  onNewDay,
  redirectTo,
}: SelectDayProps) {
  const { getName, getNextDay, getPreviousDay, getToday } = useDayName();
  const router = useRouter();
  const t = useTranslations("common");

  const handleClick = (newDay: DayName) => {
    if (redirectTo) {
      router.push(`${redirectTo}?day=${newDay}`);
    } else {
      onNewDay?.(newDay);
    }
  };

  return (
    <ButtonGroup>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleClick(getPreviousDay(day))}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <ButtonGroupText className="bg-primary text-primary-foreground">
        {getName(day)}
      </ButtonGroupText>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleClick(getToday())}
        title={t("today")}
      >
        <CalendarDays className="h-5 w-5" />
      </Button>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleClick(getNextDay(day))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </ButtonGroup>
  );
}

type SelectDateProps = {
  day: Date;
  onNewDay: (newDay: Date) => void;
};

export function SelectDate({ day, onNewDay }: SelectDateProps) {
  return (
    <div className="inline-flex rounded-md shadow-sm">
      <Button
        variant="default"
        size="icon"
        className="rounded-r-none"
        onClick={() => onNewDay(subDays(day, 1))}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="inline-flex items-center justify-center w-32 bg-primary text-primary-foreground text-sm font-medium">
        {formatDateLocalized(day, { dateFormat: "short", withDay: "short" })}
      </span>
      <Button
        variant="default"
        size="icon"
        className="rounded-none"
        onClick={() => onNewDay(startOfToday())}
      >
        <CalendarDays className="h-5 w-5" />
      </Button>
      <Button
        variant="default"
        size="icon"
        className="rounded-l-none"
        onClick={() => onNewDay(addDays(day, 1))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
