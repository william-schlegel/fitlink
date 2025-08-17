import { dayNameEnum } from "@/db/schema/enums";
import { getDay } from "date-fns";

export function getDayName(dt: Date) {
  const day = getDay(dt);
  if (day <= dayNameEnum.enumValues.length) return dayNameEnum.enumValues[day];
  return dayNameEnum.enumValues[0];
}
