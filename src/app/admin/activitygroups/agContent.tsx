"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Star } from "lucide-react";

import { DeleteGroup, UpdateGroup } from "@/components/modals/manageActivity";
import { Badge } from "@/components/ui/shadcn";
import { Item, ItemActions, ItemContent } from "@/components/ui/shadcn/item";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

type AGContentProps = {
  agId: string;
};

type ClubGroup = {
  id: string;
  name: string;
  activities: number;
};

export function AGContent({ agId }: AGContentProps) {
  const agQuery = trpc.activities.getActivityGroupById.useQuery(agId, {
    enabled: isCUID(agId),
  });

  const activitiesQuery = trpc.activities.getAllActivitiesForGroup.useQuery(
    agId,
    {
      enabled: isCUID(agId),
    },
  );

  const clubs = useMemo(() => {
    if (!activitiesQuery.data) return [];

    const cg = new Map<string, ClubGroup>();
    for (const ac of activitiesQuery.data) {
      const g = cg.get(ac.clubId);
      if (g) {
        g.activities += 1;
      } else
        cg.set(ac.clubId, {
          id: ac.clubId,
          name: ac.club.name,
          activities: 1,
        });
    }
    return Array.from(cg.values());
  }, [activitiesQuery.data]);

  const t = useTranslations("admin");

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{agQuery.data?.name}</h2>
          {agQuery.data?.default ? (
            <Star className="fill-yellow-500 size-4" />
          ) : (
            <Badge>({agQuery.data?.name})</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <UpdateGroup groupId={agId} variant="outline" buttonSize="icon" />
          <DeleteGroup groupId={agId} buttonSize="icon" />
        </div>
      </div>
      <section className="grid max-h-screen grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden">
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h3>{t("ag.group-activities")}</h3>
          <div className="flex flex-row flex-wrap gap-2">
            {activitiesQuery.data?.map((activity) => (
              <Item key={activity.id} variant="outline">
                <ItemContent>{activity.name}</ItemContent>
                <ItemActions>
                  <Badge variant="default">{activity.club.name}</Badge>
                </ItemActions>
              </Item>
            ))}
          </div>
        </article>
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h3>{t("ag.group-clubs")}</h3>
          <div className="flex flex-row flex-wrap gap-2">
            {clubs.map((club) => (
              <Item key={club.id} variant="outline">
                <ItemContent>{club.name}</ItemContent>
                <ItemActions>
                  <Badge variant="default">{club.activities}</Badge>
                </ItemActions>
              </Item>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
