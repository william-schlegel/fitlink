"use client";
import { type ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import { GetPricingById } from "@/server/api/routers/pricing";
import { twMerge } from "tailwind-merge";

type Props = Readonly<{
  data: GetPricingById;
  onSelect?: (id: string, monthly: boolean) => void;
  compact?: boolean;
  forceHighlight?: boolean;
}>;

export function PricingComponent({
  data,
  onSelect,
  compact = false,
  forceHighlight,
}: Props) {
  const [monthlyPrice, setMonthlyPrice] = useState(true);
  const t = useTranslations("home");

  const hl = forceHighlight ?? data?.highlighted;

  console.log("data >>>>", data);

  return (
    <div
      className={twMerge(
        "card  w-96 bg-base-100 shadow-xl",
        compact && "w-fit",
        hl && "border-4 border-primary",
        data?.deleted && "border-4 border-red-600"
      )}
    >
      <div
        className={twMerge(
          "card-body items-center text-center",
          compact && "p-2"
        )}
      >
        {data?.deleted ? (
          <div className="alert alert-warning text-center">
            {t("pricing.deleted", {
              date: data?.deletionDate?.toLocaleDateString() ?? "",
            })}
          </div>
        ) : null}
        <h2 className="card-title text-3xl font-bold">{data?.title}</h2>
        <p>{data?.description}</p>
        {compact ? null : (
          <ul className="self-start py-8">
            {data?.options.map((option) => (
              <li key={option.id} className="flex items-center gap-4">
                <i className="bx bx-chevron-right bx-sm text-accent" />
                <span className="text-start">{option.name}</span>
              </li>
            ))}
          </ul>
        )}
        {data?.free ? (
          <p
            className={twMerge(
              "py-4 text-xl font-bold text-accent",
              compact && "py-1"
            )}
          >
            {t("pricing.free")}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                className={twMerge(
                  "btn btn-primary btn-sm",
                  !monthlyPrice && "btn-outline"
                )}
                onClick={() => setMonthlyPrice(true)}
                type="button"
              >
                {t("pricing.monthly")}
              </button>
              <button
                className={twMerge(
                  "btn btn-primary btn-sm",
                  monthlyPrice && "btn-outline"
                )}
                onClick={() => setMonthlyPrice(false)}
                type="button"
              >
                {t("pricing.yearly")}
              </button>
            </div>
            <p
              className={twMerge(
                "py-4 text-xl font-bold text-accent",
                compact && "py-1"
              )}
            >
              {monthlyPrice
                ? t("pricing.price-monthly", {
                    price: data?.monthly ?? 0,
                  })
                : t("pricing.price-yearly", {
                    price: data?.yearly ?? 0,
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
      className={twMerge(
        "flex flex-wrap items-stretch gap-4 justify-center py-12",
        compact && "justify-start"
      )}
    >
      {children}
    </div>
  );
}
