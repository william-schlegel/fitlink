"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { cn } from "@/lib/utils";
import { GetPricingById } from "@/server/api/routers/pricing";
import { ButtonGroup } from "./shadcn/button-group";

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

  return (
    <Card
      className={cn(
        "w-96",
        compact && "w-fit",
        hl && "border-2 border-primary",
        data?.deleted && "border-2 border-error",
      )}
      data-theme="cupcake"
    >
      <CardHeader className={cn("items-center text-center", compact && "p-2")}>
        {data?.deleted && (
          <Badge variant="warning" className="mb-2">
            {t("pricing.deleted", {
              date: data?.deletionDate?.toLocaleDateString() ?? "",
            })}
          </Badge>
        )}
        <CardTitle className="text-3xl font-bold">{data?.title}</CardTitle>
        <p className="text-card-foreground/80">{data?.description}</p>
      </CardHeader>
      <CardContent className={cn("items-center text-center", compact && "p-2")}>
        {!compact && (
          <ul className="self-start py-4 space-y-2">
            {data?.options.map((option) => (
              <li
                key={option.id}
                className="flex items-center gap-2 text-card-foreground"
              >
                <ChevronRight className="text-primary" />
                <span className="text-start">{option.name}</span>
              </li>
            ))}
          </ul>
        )}
        {data?.free ? (
          <p
            className={cn(
              "py-4 text-xl font-bold text-accent",
              compact && "py-1",
            )}
          >
            {t("pricing.free")}
          </p>
        ) : (
          <>
            <ButtonGroup orientation="horizontal" className="mx-auto">
              <Button
                variant={monthlyPrice ? "secondary" : "default"}
                size="sm"
                onClick={() => setMonthlyPrice(true)}
                type="button"
              >
                {t("pricing.monthly")}
              </Button>
              <Button
                variant={!monthlyPrice ? "secondary" : "default"}
                size="sm"
                onClick={() => setMonthlyPrice(false)}
                type="button"
              >
                {t("pricing.yearly")}
              </Button>
            </ButtonGroup>
            <p
              className={cn(
                "py-4 text-xl font-bold text-card-foreground",
                compact && "py-1",
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
      </CardContent>
      {typeof onSelect === "function" && (
        <CardFooter className="justify-center">
          <Button
            className="w-full"
            type="button"
            onClick={() => onSelect(data?.id ?? "", monthlyPrice)}
          >
            {t("pricing.select")}
          </Button>
        </CardFooter>
      )}
    </Card>
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
      className={cn(
        "flex flex-wrap items-stretch gap-4 justify-center py-12",
        compact && "justify-start",
      )}
    >
      {children}
    </div>
  );
}
