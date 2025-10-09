"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  SubscriptionModeEnum,
  SubscriptionRestrictionEnum,
} from "@/db/schema/enums";
import { trpc } from "./trpc/client";

export function useDisplaySubscriptionInfo(
  mode: SubscriptionModeEnum | undefined,
  restriction: SubscriptionRestrictionEnum | undefined,
  activityGroupIds: string[],
  activityIds: string[],
  siteIds: string[],
  roomIds: string[],
) {
  const t = useTranslations("club");
  const locale = useLocale();

  const { data } = trpc.subscriptions.getDataNames.useQuery(
    {
      siteIds,
      roomIds,
      activityGroupIds,
      activityIds,
    },
    { enabled: mode != undefined && restriction != undefined },
  );
  let info = "";
  let shortInfo = "";

  if (!data)
    return {
      info: "",
      sites: [],
      rooms: [],
      activityGroups: [],
      activities: [],
    };

  const sites = data.sites.map((s) => s.name);
  const rooms = data.rooms.map((s) => s.name);
  const activityGroups = data.activityGroups.map((s) => s.name);
  const activities = data.activities.map((s) => s.name);

  const listFormatter = new Intl.ListFormat(locale);

  switch (mode) {
    case "ALL_INCLUSIVE":
      shortInfo = t("subscription.mode.all-inclusive-select");
      break;
    case "ACTIVITY_GROUP":
      info = t("subscription.mode.activity-group-select", {
        count: data.activityGroups.length,
      });
      info = info.concat(listFormatter.format(activityGroups));
      break;
    case "ACTIVITY":
      info = t("subscription.mode.activity-select", {
        count: data.activities.length,
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
        t("subscription.restriction.site-select", { count: data.sites.length }),
      );
      info = info.concat(listFormatter.format(sites));
      break;
    case "ROOM":
      info = info.concat(
        t("subscription.restriction.room-select", { count: data.rooms.length }),
      );
      info = info.concat(listFormatter.format(rooms));
      break;
    default:
  }

  return {
    shortInfo,
    info: shortInfo.concat(info),
    sites,
    rooms,
    activityGroups,
    activities,
  };
}
