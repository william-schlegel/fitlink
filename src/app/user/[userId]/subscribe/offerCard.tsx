"use client";

import { inferProcedureOutput } from "@trpc/server";

import { List } from "@/app/member/[userId]/list";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn";
import { useDisplaySubscriptionInfo } from "@/lib/useDisplaySubscription";
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
    <Card className="w-96 max-w-full bg-card shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <h3>{offer.name}</h3>
          <Badge>{clubName}</Badge>
        </CardTitle>
        {shortInfo ? <p>{shortInfo}</p> : ""}
      </CardHeader>
      {sites.length ||
      rooms.length ||
      activityGroups.length ||
      activities.length ? (
        <CardContent>
          <div className="flex gap-2">
            <List label="sites" items={sites} />
            <List label="rooms" items={rooms} />
            <List label="activity-groups" items={activityGroups} />
            <List label="activities" items={activities} />
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
