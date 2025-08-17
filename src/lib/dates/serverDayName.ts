import { getTranslations } from "next-intl/server";
import { DayName, DAYS } from "./data";
import { getDay, startOfToday } from "date-fns";

export function getLabel(value?: DayName | null) {
  return DAYS.find((d) => d.value === value)?.label ?? "monday";
}

export async function getName(value?: DayName | null) {
  const t = await getTranslations("calendar");
  return t(getLabel(value));
}

export function getDayNumber(value?: DayName | null) {
  return DAYS.find((d) => d.value === value)?.number ?? 0;
}

export function getToday() {
  const today = getDay(startOfToday());
  return DAYS.find((d) => d.number === today)?.value ?? "MONDAY";
}

export function getNextDay(value?: DayName | null) {
  const n = (DAYS.find((d) => d.value === value)?.number as number) ?? 0;
  let next: DayName = "MONDAY";
  if (n === 6) next = DAYS.find((d) => d.number === 0)?.value ?? "SUNDAY";
  else next = DAYS.find((d) => d.number === n + 1)?.value ?? "MONDAY";
  return next;
}
export function getPreviousDay(value?: DayName | null) {
  const n = (DAYS.find((d) => d.value === value)?.number as number) ?? 0;
  let next: DayName = "MONDAY";
  if (n === 0) next = DAYS.find((d) => d.number === 6)?.value ?? "SATURDAY";
  else next = DAYS.find((d) => d.number === n - 1)?.value ?? "MONDAY";
  return next;
}

export function getDayForDate(dt: Date) {
  const day = getDay(dt);
  return DAYS.find((d) => d.number === day)?.value ?? "MONDAY";
}
