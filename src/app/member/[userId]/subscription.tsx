import { getDescription } from "@/lib/subscriptions";
import { getDataNames } from "@/server/api/routers/subscription";
import { MemberSubscriptionType } from "@/server/api/routers/users";
import { List } from "./list";

type SubscriptionProps = {
  subscription: MemberSubscriptionType;
};

export default async function Subscription({
  subscription,
}: SubscriptionProps) {
  const { shortInfo } = await getDescription(
    subscription.mode,
    subscription.restriction,
    subscription.activitieGroups.map((ag) => ag.activityGroup.id),
    subscription.activities.map((ag) => ag.activity.id),
    subscription.sites.map((ag) => ag.site.id),
    subscription.rooms.map((ag) => ag.room.id)
  );

  const { sites, rooms, activityGroups, activities } = await getDataNames(
    subscription.sites.map((ag) => ag.site.id),
    subscription.rooms.map((ag) => ag.room.id),
    subscription.activitieGroups.map((ag) => ag.activityGroup.id),
    subscription.activities.map((ag) => ag.activity.id)
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
