"use client";
import { type ReactNode, useState } from "react";
import { type getPricingById } from "@/server/pricing";
import { useTranslations } from "next-intl";

type Props = Readonly<{
  data: Awaited<ReturnType<typeof getPricingById>>["data"];
  onSelect?: (id: string, monthly: boolean) => void;
  compact?: boolean;
  forceHighlight?: boolean;
}>;

export function Pricing({
  data,
  onSelect,
  compact = false,
  forceHighlight,
}: Props) {
  const [monthlyPrice, setMonthlyPrice] = useState(true);
  const t = useTranslations("home");

  const hl = forceHighlight ?? data?.highlighted;

  return (
    <div
      className={`card ${compact ? "w-fit" : "w-96"} bg-base-100 ${
        hl ? "border-4 border-primary" : ""
      } shadow-xl ${data?.deleted ? "border-4 border-red-600" : ""}`}
    >
      <div
        className={`card-body items-center text-center ${compact ? "p-2" : ""}`}
      >
        {data?.deleted ? (
          <div className="alert alert-warning text-center">
            {t("pricing.deleted", {
              date: data?.deletionDate?.toLocaleDateString(),
            })}
          </div>
        ) : null}
        <h2 className="card-title text-3xl font-bold">{data?.title}</h2>
        <p>{data?.description}</p>
        {!compact ? (
          <ul className="self-start py-8">
            {data?.options.map((option) => (
              <li key={option.id} className="flex items-center gap-4">
                <i className="bx bx-chevron-right bx-sm text-accent" />
                <span className="text-start">{option.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {data?.free ? (
          <p
            className={`${
              compact ? "py-1" : "py-4"
            } text-xl font-bold text-accent`}
          >
            {t("pricing.free")}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                className={`btn btn-primary btn-sm ${
                  monthlyPrice ? "" : "btn-outline"
                }`}
                onClick={() => setMonthlyPrice(true)}
                type="button"
              >
                {t("pricing.monthly")}
              </button>
              <button
                className={`btn btn-primary btn-sm ${
                  monthlyPrice ? "btn-outline" : ""
                }`}
                onClick={() => setMonthlyPrice(false)}
                type="button"
              >
                {t("pricing.yearly")}
              </button>
            </div>
            <p
              className={`${
                compact ? "py-1" : "py-4"
              } text-xl font-bold text-accent`}
            >
              {monthlyPrice
                ? t("pricing.price-monthly", {
                    price: data?.monthly,
                  })
                : t("pricing.price-yearly", {
                    price: data?.yearly,
                  })}
            </p>
          </>
        )}
        {typeof onSelect === "function" && (
          <div className="card-actions">
            <button
              className="btn btn-primary btn-block"
              type="button"
              onClick={() => onSelect(data?.id ?? "", monthlyPrice)}
            >
              {t("pricing.select")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type PricingContainerProps = Readonly<{
  children: ReactNode;
  compact?: boolean;
}>;

export function PricingContainer({
  children,
  compact = false,
}: PricingContainerProps) {
  return (
    <div
      className={`flex flex-wrap items-stretch gap-4 ${
        compact ? "justify-start" : "justify-center py-12"
      }`}
    >
      {children}
    </div>
  );
}
