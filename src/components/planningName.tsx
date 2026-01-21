"use client";

import { isDate } from "date-fns";
import { useTranslations } from "next-intl";

import { ArrowRight } from "lucide-react";

import { planning } from "@/db/schema/planning";
import { formatDateLocalized } from "@/lib/formatDate";
import { Badge } from "./ui/shadcn";

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
        <Badge variant={planning.name ? "secondary" : "default"} size="lg">
          {!planning.name && <span>{t("from")}</span>}
          {formatDateLocalized(actualPlanning.startDate)}
          {isDate(actualPlanning.endDate) ? (
            <>
              <ArrowRight size={16} />
              <span>{formatDateLocalized(actualPlanning.endDate)}</span>
            </>
          ) : null}
        </Badge>
      ) : null}
    </div>
  );
}
