"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { DeleteGroup, UpdateGroup } from "@/components/modals/manageActivity";
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

  useEffect(() => {
    if (agQuery.data) setClubs([]);
  }, [agQuery.data]);

  const activitiesQuery = trpc.activities.getAllActivitiesForGroup.useQuery(
    agId,
    {
      enabled: isCUID(agId),
    },
  );

  useEffect(() => {
    if (!activitiesQuery.data) return;

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
    setClubs(Array.from(cg.values()));
  }, [activitiesQuery.data]);

  const [clubs, setClubs] = useState<ClubGroup[]>([]);
  const t = useTranslations("admin");

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{agQuery.data?.name}</h2>
          {agQuery.data?.default ? (
            <i className="bx bxs-star bx-sm text-accent" />
          ) : (
            <p className="badge">({agQuery.data?.name})</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <UpdateGroup
            groupId={agId}
            variant="Icon-Outlined-Primary"
            size="sm"
          />
          <DeleteGroup groupId={agId} size="sm" />
        </div>
      </div>
      <section className="grid max-h-screen grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden">
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h3>{t("ag.group-activities")}</h3>
          <div className="flex flex-row flex-wrap gap-2">
            {activitiesQuery.data?.map((activity) => (
              <div key={activity.id} className="pill">
                <span>{activity.name}</span>
                <span className="badge-primary badge">
                  {activity.club.name}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h3>{t("ag.group-clubs")}</h3>
          <div className="flex flex-row flex-wrap gap-2">
            {clubs.map((club) => (
              <div key={club.id} className="pill">
                <span>{club.name}</span>
                <span className="badge-primary badge">{club.activities}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
