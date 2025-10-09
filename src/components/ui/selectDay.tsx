"use client";

import { addDays, startOfToday, subDays } from "date-fns";
import { useRouter } from "next/navigation";

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
  console.log("day", day);

  const handleClick = (newDay: DayName) => {
    console.log("handleClick", newDay);

    if (redirectTo) {
      router.push(`${redirectTo}?day=${newDay}`);
    } else {
      onNewDay?.(newDay);
    }
  };

  return (
    <div className="btn-group">
      <button
        className="btn btn-primary"
        onClick={() => handleClick(getPreviousDay(day))}
      >
        <i className="bx bx-chevron-left bx-sm" />
      </button>
      <span className="btn btn-primary w-32 text-center">{getName(day)}</span>
      <button
        className="btn btn-primary"
        onClick={() => handleClick(getToday())}
      >
        <i className="bx bx-calendar-event bx-sm" />
      </button>
      <button
        className="btn btn-primary"
        onClick={() => handleClick(getNextDay(day))}
      >
        <i className="bx bx-chevron-right bx-sm" />
      </button>
    </div>
  );
}

type SelectDateProps = {
  day: Date;
  onNewDay: (newDay: Date) => void;
};

export function SelectDate({ day, onNewDay }: SelectDateProps) {
  return (
    <div className="btn-group">
      <button
        className="btn btn-primary"
        onClick={() => onNewDay(subDays(day, 1))}
      >
        <i className="bx bx-chevron-left bx-sm" />
      </button>
      <span className="btn btn-primary w-32 text-center">
        {formatDateLocalized(day, { withDay: true })}
      </span>
      <button
        className="btn btn-primary"
        onClick={() => onNewDay(startOfToday())}
      >
        <i className="bx bx-calendar-event bx-sm" />
      </button>
      <button
        className="btn btn-primary"
        onClick={() => onNewDay(addDays(day, 1))}
      >
        <i className="bx bx-chevron-right bx-sm" />
      </button>
    </div>
  );
}
