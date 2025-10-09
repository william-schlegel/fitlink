import { getDay, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";

import { DayName, DAYS } from "./data";

export function useDayName() {
  const t = useTranslations("calendar");
  function getLabel(value?: DayName | null) {
    return DAYS.find((d) => d.value === value)?.label ?? "monday";
  }

  function getName(value?: DayName | null) {
    return t(getLabel(value));
  }

  function getDayNumber(value?: DayName | null) {
    return DAYS.find((d) => d.value === value)?.number ?? 0;
  }

  function getToday() {
    const today = getDay(startOfToday());
    return DAYS.find((d) => d.number === today)?.value ?? "MONDAY";
  }

  function getNextDay(value?: DayName | null) {
    const n = (DAYS.find((d) => d.value === value)?.number as number) ?? 0;
    let next: DayName = "MONDAY";
    if (n === 6) next = DAYS.find((d) => d.number === 0)?.value ?? "SUNDAY";
    else next = DAYS.find((d) => d.number === n + 1)?.value ?? "MONDAY";
    return next;
  }
  function getPreviousDay(value?: DayName | null) {
    const n = (DAYS.find((d) => d.value === value)?.number as number) ?? 0;
    let next: DayName = "MONDAY";
    if (n === 0) next = DAYS.find((d) => d.number === 6)?.value ?? "SATURDAY";
    else next = DAYS.find((d) => d.number === n - 1)?.value ?? "MONDAY";
    return next;
  }

  function getDayForDate(dt: Date) {
    const day = getDay(dt);
    return DAYS.find((d) => d.number === day)?.value ?? "MONDAY";
  }

  return {
    getName,
    getLabel,
    getNextDay,
    getPreviousDay,
    getToday,
    getDayForDate,
    getDayNumber,
  };
}
