import { fr, enUS } from "date-fns/locale";
import { formatDistance } from "date-fns";

// import { getLocale } from "@/lib/locale";

export function formatDifference(dateFrom: Date, dateSince?: Date | undefined) {
  const endDate = dateSince ?? new Date(Date.now());
  return formatDistance(endDate, dateFrom, {
    // locale: Locale === "en" ? enUS : fr,
    locale: fr,
  });
}
