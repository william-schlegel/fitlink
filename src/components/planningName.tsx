"use client";

import { useTranslations } from "next-intl";
import { isDate } from "date-fns";

import { formatDateLocalized } from "@/lib/formatDate";
import { planning } from "@/db/schema/planning";

/**
 * compose a planning name from name and dates
 * @param {Planning} planning data
 * @returns planning name component
 */
export function PlanningName({
  actualPlanning,
  variant = "default",
}: {
  actualPlanning: typeof planning.$inferSelect;
  variant?: "default" | "simple";
}) {
  const t = useTranslations("planning");
  return (
    <div className="flex w-full items-center justify-between gap-2">
      {actualPlanning.name ? <span>{actualPlanning.name}</span> : null}
      {variant === "default" ? (
        <span
          className={`${
            planning.name ? "badge-secondary badge" : ""
          } flex items-center gap-2`}
        >
          {!planning.name && <span>{t("from")}</span>}
          {formatDateLocalized(actualPlanning.startDate)}
          {isDate(actualPlanning.endDate) ? (
            <span className="space-x-2">
              <i className="bx bx-right-arrow-alt bx-xs" />
              <span>{formatDateLocalized(actualPlanning.endDate)}</span>
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
