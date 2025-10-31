import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";

import { AppRouter } from "@/server/api/root";
import { DAYS } from "@/lib/dates/data";
import Spinner from "./ui/spinner";

type Calendar =
  inferRouterOutputs<AppRouter>["calendars"]["getCalendarForSite"];

type Props = {
  calendar?: Calendar;
  isLoading: boolean;
};

function CalendarWeek({ calendar, isLoading }: Props) {
  const t = useTranslations("calendar");

  if (isLoading) return <Spinner />;
  if (!calendar) return <div>{t("no-calendar")}</div>;
  return (
    <div className="rounded border border-primary p-1">
      <table className="w-full table-auto">
        <thead>
          <tr>
            {DAYS.map((day) => (
              <td key={day.value} className="text-center">
                {t(day.label)}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {calendar.dayOpeningTimes.map((ot) => {
              if (ot.dayOpeningTime.wholeDay)
                return (
                  <td
                    key={ot.id}
                    className="bg-primary text-center text-primary-content"
                  >
                    {t("whole-day")}
                  </td>
                );
              if (ot.dayOpeningTime.closed)
                return (
                  <td
                    key={ot.id}
                    className="bg-secondary text-center text-secondary-content"
                  >
                    {t("closed")}
                  </td>
                );
              return (
                <td
                  key={ot.id}
                  className="bg-primary text-center text-primary-content"
                >
                  {/* {ot.workingHours.map((wh) => (
                    <Fragment key={wh.id}>
                      <span>{wh.opening}</span>
                      <span className="ml-2">{wh.closing}</span>
                    </Fragment>
                  ))} */}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CalendarWeek;
