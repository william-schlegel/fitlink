import { activity, activityGroup, room, site } from "@/db/schema/club";
import { subscription } from "@/db/schema/subscription";
import { getDescription } from "@/lib/subscriptions";
import { getDataNames } from "@/server/api/routers/subscription";
import { useTranslations } from "next-intl";

type SubscriptionProps = {
  subscription: {
    name: string;
    club: {
      name: string;
    };
    mode: (typeof subscription.$inferSelect)["mode"];
    restriction: (typeof subscription.$inferSelect)["restriction"];
    activitieGroups: (typeof activityGroup.$inferSelect)[];
    activities: (typeof activity.$inferSelect)[];
    sites: (typeof site.$inferSelect)[];
    rooms: (typeof room.$inferSelect)[];
  };
};

export default async function Subscription({
  subscription,
}: SubscriptionProps) {
  const { shortInfo } = await getDescription(
    subscription.mode,
    subscription.restriction,
    subscription.activitieGroups.map((ag) => ag.id),
    subscription.activities.map((ag) => ag.id),
    subscription.sites.map((ag) => ag.id),
    subscription.rooms.map((ag) => ag.id)
  );

  const { sites, rooms, activityGroups, activities } = await getDataNames(
    subscription.sites.map((ag) => ag.id),
    subscription.rooms.map((ag) => ag.id),
    subscription.activitieGroups.map((ag) => ag.id),
    subscription.activities.map((ag) => ag.id)
  );

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-primary">{subscription.name}</h3>
          <span className="badge-primary badge">{subscription.club.name}</span>
        </div>
        {shortInfo ? <p>{shortInfo}</p> : ""}
        <div className="flex gap-2">
          <List label="sites" items={sites.map((site) => site.name)} />
          <List label="rooms" items={rooms.map((room) => room.name)} />
          <List
            label="activity-groups"
            items={activityGroups.map((ag) => ag.name)}
          />
          <List label="activities" items={activities.map((a) => a.name)} />
        </div>
      </div>
    </div>
  );
}

type ListProps = {
  label: string;
  items: string[];
};

export function List({ label, items }: ListProps) {
  const t = useTranslations("dashboard");
  if (!items.length) return null;
  return (
    <div className="flex flex-1 flex-col">
      <h4>{t(label, { count: items.length })}</h4>
      <ul>
        {items.map((item, idx) => (
          <li key={`ITEM-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
