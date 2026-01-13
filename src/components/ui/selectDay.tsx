"use client";

import { addDays, startOfToday, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { formatDateLocalized } from "@/lib/formatDate";
import { useDayName } from "@/lib/dates/useDayName";
import { DayName } from "@/lib/dates/data";
import { Button } from "@/components/ui/shadcn/button";

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

  const handleClick = (newDay: DayName) => {
    if (redirectTo) {
      router.push(`${redirectTo}?day=${newDay}`);
    } else {
      onNewDay?.(newDay);
    }
  };

  return (
    <div className="inline-flex rounded-md shadow-sm">
      <Button
        variant="default"
        size="icon"
        className="rounded-r-none"
        onClick={() => handleClick(getPreviousDay(day))}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="inline-flex items-center justify-center w-32 bg-primary text-primary-content text-sm font-medium">
        {getName(day)}
      </span>
      <Button
        variant="default"
        size="icon"
        className="rounded-none"
        onClick={() => handleClick(getToday())}
      >
        <CalendarDays className="h-5 w-5" />
      </Button>
      <Button
        variant="default"
        size="icon"
        className="rounded-l-none"
        onClick={() => handleClick(getNextDay(day))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
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
      <span className="inline-flex items-center justify-center w-32 bg-primary text-primary-content text-sm font-medium">
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
