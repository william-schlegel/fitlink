import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Star } from "lucide-react";

import {
  CreatePricing,
  DeletePricing,
  UndeletePricing,
  UpdatePricing,
} from "@/components/modals/managePricing";
import {
  LayoutPage,
  LayoutPageMain,
  LayoutPageLists,
  LayoutPageContent,
} from "@/components/layoutPage";
import { getAllPricing, getPricingById } from "@/server/api/routers/pricing";
import { PricingComponent } from "@/components/ui/pricing";
import { BadgeVariant } from "@/components/ui/shadcn";
import { getRoleName } from "@/server/lib/userTools";
import { pricing } from "@/db/schema/subscription";
import { getActualUser } from "@/lib/auth/server";
import { formatMoney } from "@/lib/formatNumber";
import { RoleEnum } from "@/db/schema/enums";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";

export type Pricing = typeof pricing.$inferSelect;

export default async function PricingManagement({
  searchParams,
}: {
  searchParams: Promise<{ pricingId: string }>;
}) {
  const { pricingId } = await searchParams;
  const tAuth = await getTranslations("auth");
  const t = await getTranslations("admin");
  const pricingQuery = await getAllPricing();

  if (pricingId === "")
    redirect(createLink({ pricingId: pricingQuery[0]?.id }));
  const gd = new Map<string, Pricing[]>();
  for (const p of pricingQuery) {
    const act = gd.get(p.roleTarget) || [];
    act.push(p);

    gd.set(p.roleTarget, act);
  }
  const groupedData = Array.from(gd).map((g) => ({
    name: tAuth(getRoleName(g[0] as RoleEnum)),
    items: g[1],
  }));

  const user = await getActualUser();
  const href = await getHref();
  if (user && user.internalRole !== "ADMIN")
    return <div>{t("admin-only")}</div>;

  const pricingList = groupedData.map((group) => ({
    name: group.name,
    items: group.items.map((pricing) => ({
      id: pricing.id,
      name: pricing.title,
      link: createLink({ pricingId: pricing.id }, href),
      badgeVariant: pricing.free
        ? "default"
        : pricing.deleted
          ? "destructive"
          : (undefined as BadgeVariant),
      badgeText: pricing.free
        ? "Free"
        : pricing.deleted
          ? "Deleted"
          : formatMoney(pricing.monthly),
      badgeIcon: pricing.highlighted ? (
        <Star className="fill-yellow-500 size-4" />
      ) : undefined,
    })),
  }));

  return (
    <LayoutPage
      title={t("pricing.manage-my-pricing")}
      titleComponents={<CreatePricing />}
    >
      <LayoutPageMain>
        <LayoutPageLists
          lists={pricingList}
          itemId={pricingId}
          noItemsText={t("pricing.no-pricing")}
        />

        {pricingId === "" ? null : <PricingContent pricingId={pricingId} />}
      </LayoutPageMain>
    </LayoutPage>
  );
}

type PricingContentProps = {
  pricingId: string;
};

async function PricingContent({ pricingId }: PricingContentProps) {
  const pricingQuery = await getPricingById(pricingId);
  if (!pricingQuery) return null;
  return (
    <div className="flex w-full flex-col gap-4">
      <PricingComponent data={pricingQuery} />
      <div className="space-x-2">
        <UpdatePricing pricingId={pricingId} />

        {pricingQuery?.deleted ? (
          <UndeletePricing pricingId={pricingId} />
        ) : (
          <DeletePricing pricingId={pricingId} />
        )}
      </div>
    </div>
  );
}
