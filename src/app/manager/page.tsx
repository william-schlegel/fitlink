import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Bell, Building, Presentation, Smartphone } from "lucide-react";

import { PricingComponent, PricingContainer } from "@/components/ui/pricing";
import { Feature, FeatureContainer } from "@/components/ui/features";
import { getPricingForRole } from "@/server/api/routers/pricing";
import { Alert } from "@/components/ui/shadcn/alert";
import { getActualUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/shadcn";

/**
 *
 *  Manager presentation on Fitlink page
 *
 */

export default async function ManagerPage() {
  const pricingQuery = await getPricingForRole("MANAGER");
  const t = await getTranslations("home");
  const user = await getActualUser();

  return (
    <div>
      <section className="hero bg-primary/10">
        <div className="hero-content py-48 text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t("manager-title")}</h1>
            <p className="py-6 text-lg">{t("manager-text")}</p>
          </div>
        </div>
      </section>
      <section className="bg-card">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("features.manager")}</h2>
          <FeatureContainer>
            <Feature
              title={t("features.management.title")}
              description={t("features.management.description")}
              icon={<Building size={60} />}
            />

            <Feature
              title={t("features.communication.title")}
              description={t("features.communication.description")}
              icon={<Bell size={60} />}
            />

            <Feature
              title={t("features.page.title")}
              description={t("features.page.description")}
              icon={<Presentation size={60} />}
            />
            <Feature
              title={t("features.mobile.title")}
              description={t("features.mobile.description")}
              icon={<Smartphone size={60} />}
            />
          </FeatureContainer>
        </div>
      </section>
      <section className="bg-muted">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("pricing.usage")}</h2>
          <Alert variant="info">{t("pricing.try-offer")}</Alert>
          <PricingContainer>
            {pricingQuery?.map((pricing) => (
              <PricingComponent key={pricing.id} data={pricing} />
            ))}
          </PricingContainer>
          <SigninOrAccount userId={user?.id} />
        </div>
      </section>
    </div>
  );
}

export async function SigninOrAccount({
  userId,
}: {
  userId: string | undefined;
}) {
  const t = await getTranslations("home");

  return (
    <div className="flex justify-center pb-12">
      {userId ? (
        <Button asChild size="xl">
          <span>
            {t("pricing.go-to-account")}{" "}
            <Link href={`/user/${userId}/account`}>
              {t("pricing.my-account")}
            </Link>
          </span>
        </Button>
      ) : (
        <Button asChild size="xl">
          <Link href="/user/signin">{t("pricing.create-your-account")}</Link>
        </Button>
      )}
    </div>
  );
}
