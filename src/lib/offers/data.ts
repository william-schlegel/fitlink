import { CoachingLevelListEnum } from "@/db/schema/enums";

export const COACHING_LEVEL: readonly {
  value: CoachingLevelListEnum;
  label: string;
}[] = [
  { value: "ALL", label: "level.all" },
  { value: "BEGINNER", label: "level.beginner" },
  { value: "INTERMEDIATE", label: "level.intermediate" },
  { value: "ADVANCED", label: "level.advanced" },
  { value: "EXPERT", label: "level.expert" },
  { value: "COMPETITOR", label: "level.competitor" },
  { value: "PROFESSIONAL", label: "level.professional" },
] as const;

export const COACHING_TARGET = [
  { value: "INDIVIDUAL", label: "target.individual" },
  { value: "COMPANY", label: "target.company" },
] as const;
