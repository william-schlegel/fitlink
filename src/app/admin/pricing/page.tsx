import { RoleEnum } from "@/db/schema/enums";
import { pricing } from "@/db/schema/subscription";
import createLink from "@/lib/createLink";
import { getActualUser } from "@/lib/auth/server";
import { getAllPricing, getPricingById } from "@/server/api/routers/pricing";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import PricingCard from "./pricingCard";
import {
  CreatePricing,
  DeletePricing,
  UndeletePricing,
  UpdatePricing,
} from "@/components/modals/managePricing";
import { PricingComponent } from "@/components/ui/pricing";
import { getRoleName } from "@/server/lib/userTools";

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

  if (user && user.internalRole !== "ADMIN")
    return <div>{t("admin-only")}</div>;

  return (
    <div
      // title={t("pricing.manage-my-pricing")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("pricing.manage-my-pricing")}</h1>
        <CreatePricing />
      </div>
      <div className="flex gap-4">
        <div className="w-1/4 ">
          {groupedData.map((group) => (
            <div key={group.name} className="mb-4 ">
              <h3>{group.name}</h3>
              <ul className="menu overflow-hidden rounded bg-base-100">
                {group.items.map((pricing) => (
                  <li key={pricing.id}>
                    <PricingCard pricingId={pricingId} pricing={pricing} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {pricingId === "" ? null : <PricingContent pricingId={pricingId} />}
      </div>
    </div>
  );
}

type PricingContentProps = {
  pricingId: string;
};

export async function PricingContent({ pricingId }: PricingContentProps) {
  const pricingQuery = await getPricingById(pricingId);
  if (!pricingQuery) return null;
  return (
    <div className="flex w-full flex-col gap-4">
      <PricingComponent data={pricingQuery} />
      <div className="flex items-center gap-2">
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
