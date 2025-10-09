import { getDay } from "date-fns";

import { dayNameEnum } from "@/db/schema/enums";

export function getDayName(dt: Date) {
  const day = getDay(dt);
  if (day <= dayNameEnum.enumValues.length) return dayNameEnum.enumValues[day];
  return dayNameEnum.enumValues[0];
}
