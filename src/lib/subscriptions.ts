import { subscriptionModeEnum } from "@/db/schema/enums";
import { subscriptionRestrictionEnum } from "@/db/schema/enums";
import { getLocale, getTranslations } from "next-intl/server";

export async function getDescription(
  mode: (typeof subscriptionModeEnum.enumValues)[number] | null | undefined,
  restriction:
    | (typeof subscriptionRestrictionEnum.enumValues)[number]
    | null
    | undefined,
  activityGroups: string[],
  activities: string[],
  sites: string[],
  rooms: string[]
) {
  const locale = await getLocale();
  const t = await getTranslations("club");
  const listFormatter = new Intl.ListFormat(locale);
  let info = "";
  let shortInfo = "";

  switch (mode) {
    case "ALL_INCLUSIVE":
      shortInfo = t("subscription.mode.all-inclusive-select");
      break;
    case "ACTIVITY_GROUP":
      info = t("subscription.mode.activity-group-select", {
        count: activityGroups.length,
      });
      info = info.concat(listFormatter.format(activityGroups));
      break;
    case "ACTIVITY":
      info = t("subscription.mode.activity-select", {
        count: activities.length,
      });
      info = info.concat(listFormatter.format(activities));
      break;
    case "DAY":
      shortInfo = t("subscription.mode.day-select");
      break;
    default:
  }
  info = info.concat(" ");
  switch (restriction) {
    case "CLUB":
      info = info.concat(t("subscription.restriction.club-select"));
      break;
    case "SITE":
      info = info.concat(
        t("subscription.restriction.site-select", { count: sites.length })
      );
      info = info.concat(listFormatter.format(sites));
      break;
    case "ROOM":
      info = info.concat(
        t("subscription.restriction.room-select", { count: rooms.length })
      );
      info = info.concat(listFormatter.format(rooms));
      break;
    default:
  }

  return {
    shortInfo,
    info: shortInfo.concat(info),
  };
}
