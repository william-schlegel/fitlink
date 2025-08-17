import { dayNameEnum } from "@/db/schema/enums";

export type DayName = (typeof dayNameEnum.enumValues)[number];

export const DAYS = [
  { value: dayNameEnum.enumValues[1], label: "monday", number: 1 },
  { value: dayNameEnum.enumValues[2], label: "tuesday", number: 2 },
  { value: dayNameEnum.enumValues[3], label: "wednesday", number: 3 },
  { value: dayNameEnum.enumValues[4], label: "thursday", number: 4 },
  { value: dayNameEnum.enumValues[5], label: "friday", number: 5 },
  { value: dayNameEnum.enumValues[6], label: "saturday", number: 6 },
  { value: dayNameEnum.enumValues[0], label: "sunday", number: 0 },
] as const;
