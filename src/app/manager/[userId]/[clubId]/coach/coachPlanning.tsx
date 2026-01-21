"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { DayName } from "@/lib/dates/data";
import { useDayName } from "@/lib/dates/useDayName";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type CoachPlanningForClub =
  RouterOutputs["plannings"]["getCoachPlanningForClub"]; // possibly null
type PaData = NonNullable<CoachPlanningForClub>["planningActivities"][number];

type ClubData = {
  id: string;
  name: string;
  activities: WeekDayActivity[];
};

type WeekDayActivity = { day: DayName; dayOrder: number; activities: PaData[] };

export function CoachPlanning({
  coachId,
  clubId,
}: {
  coachId: string;
  clubId: string;
}) {
  const t = useTranslations("club");
  const { getName, getDayNumber } = useDayName();

  const planning = trpc.plannings.getCoachPlanningForClub.useQuery(
    { coachId, clubId },
    {
      enabled: isCUID(coachId),
    },
  );

  const weekData = useMemo(() => {
    if (!planning.data) return undefined;
    const week: ClubData = {
      id: planning.data.clubId,
      name: planning.data.name ?? "",
      activities: [],
    };
    const activities = new Map<DayName, PaData[]>();
    for (const pa of planning.data.planningActivities)
      activities.set(pa.day, [...(activities.get(pa.day) ?? []), pa]);
    const wa: WeekDayActivity[] = [];
    for (const dn of activities.keys()) {
      const pa = activities.get(dn);
      wa.push({
        day: dn,
        dayOrder: getDayNumber(dn),
        activities: pa ?? [],
      });
    }
    week.activities = wa.sort((a, b) => a.dayOrder - b.dayOrder);
    return week;
  }, [planning.data, getDayNumber]);

  if (planning.isLoading) return <Spinner />;
  if (!planning.data || !weekData) return <div>{t("coach.no-planning")}</div>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
        {weekData.activities.map((day) => (
          <div key={day.day} className="rounded border border-primary bg-card">
            <div className="bg-primary py-1 text-center text-primary-content">
              {getName(day.day)}
            </div>
            <div className="space-y-2 p-2">
              {day.activities.map((activity) => (
                <div key={activity.id} className="border border-border p-2">
                  <p>
                    <span className="text-xs">{activity.startTime}</span>
                    {" ("}
                    <span className="text-xs">{activity.duration}</span>
                    {"') "}
                    <span>{activity.activity.name}</span>
                  </p>
                  <p className="text-xs">
                    <span>{activity.site?.name}</span>
                    {" - "}
                    <span>{activity.room?.name}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
