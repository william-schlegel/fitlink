import { useTranslations } from "next-intl";

import { CoachingLevelListEnum, CoachingTargetEnum } from "@/db/schema/enums";
import { COACHING_LEVEL, COACHING_TARGET } from "./data";

export function useCoachingLevel() {
  const t = useTranslations("coach");
  function getLabel(value?: CoachingLevelListEnum | null) {
    return COACHING_LEVEL.find((d) => d.value === value)?.label ?? "level.all";
  }

  function getName(value?: CoachingLevelListEnum | null) {
    return t(getLabel(value));
  }
  return { getName, getLabel };
}

export function useCoachingTarget() {
  const t = useTranslations("coach");
  function getLabel(value?: CoachingTargetEnum | null) {
    return (
      COACHING_TARGET.find((d) => d.value === value)?.label ??
      "target.individual"
    );
  }

  function getName(value?: CoachingTargetEnum | null) {
    return t(getLabel(value));
  }
  return { getName, getLabel };
}
