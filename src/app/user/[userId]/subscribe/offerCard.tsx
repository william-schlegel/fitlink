"use client";

import { inferProcedureOutput } from "@trpc/server";

import { useDisplaySubscriptionInfo } from "@/lib/useDisplaySubscription";
import { List } from "@/app/member/[userId]/list";
import { AppRouter } from "@/server/api/root";

export default function OfferCard({
  offer,
  clubName,
}: {
  offer: inferProcedureOutput<
    AppRouter["subscriptions"]["getSubscriptionById"]
  >;
  clubName: string;
}) {
  const { shortInfo, sites, rooms, activityGroups, activities } =
    useDisplaySubscriptionInfo(
      offer?.mode ?? undefined,
      offer?.restriction ?? undefined,
      offer?.activitieGroups.map((ag) => ag.activityGroupId) ?? [],
      offer?.activities.map((ag) => ag.activityId) ?? [],
      offer?.sites.map((ag) => ag.siteId) ?? [],
      offer?.rooms.map((ag) => ag.roomId) ?? [],
    );
  if (!offer) return null;

  return (
    <div className="card w-96 max-w-full bg-card shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-primary">{offer.name}</h3>
          <span className="badge-primary badge">{clubName}</span>
        </div>
        {shortInfo ? <p>{shortInfo}</p> : ""}
        <div className="flex gap-2">
          <List label="sites" items={sites} />
          <List label="rooms" items={rooms} />
          <List label="activity-groups" items={activityGroups} />
          <List label="activities" items={activities} />
        </div>
      </div>
    </div>
  );
}
