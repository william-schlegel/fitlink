import { getTranslations } from "next-intl/server";

import { CoachingTargetEnum } from "@/db/schema/enums";
import { COACHING_TARGET } from "./data";

export function getOfferLabel(value?: CoachingTargetEnum | null) {
  return (
    COACHING_TARGET.find((d) => d.value === value)?.label ?? "target.individual"
  );
}

export async function getOfferName(value?: CoachingTargetEnum | null) {
  const t = await getTranslations("coach");
  return t(getOfferLabel(value));
}
