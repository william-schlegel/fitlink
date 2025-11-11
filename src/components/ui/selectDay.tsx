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

  const handleClick = (newDay: DayName) => {
    if (redirectTo) {
      router.push(`${redirectTo}?day=${newDay}`);
    } else {
      onNewDay?.(newDay);
    }
  };

  return (
    <div className="join">
      <button
        className="btn btn-primary join-item"
        onClick={() => handleClick(getPreviousDay(day))}
      >
        <i className="bx bx-chevron-left bx-sm" />
      </button>
      <span className="btn btn-primary w-32 text-center join-item">
        {getName(day)}
      </span>
      <button
        className="btn btn-primary join-item"
        onClick={() => handleClick(getToday())}
      >
        <i className="bx bx-calendar-event bx-sm" />
      </button>
      <button
        className="btn btn-primary join-item"
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
    <div className="join">
      <button
        className="btn btn-primary join-item"
        onClick={() => onNewDay(subDays(day, 1))}
      >
        <i className="bx bx-chevron-left bx-sm" />
      </button>
      <span className="btn btn-primary w-32 text-center join-item">
        {formatDateLocalized(day, { dateFormat: "short", withDay: "short" })}
      </span>
      <button
        className="btn btn-primary join-item"
        onClick={() => onNewDay(startOfToday())}
      >
        <i className="bx bx-calendar-event bx-sm" />
      </button>
      <button
        className="btn btn-primary join-item"
        onClick={() => onNewDay(addDays(day, 1))}
      >
        <i className="bx bx-chevron-right bx-sm" />
      </button>
    </div>
  );
}
