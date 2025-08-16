import { Feature, FeatureContainer } from "@/components/ui/features";
import { PricingComponent, PricingContainer } from "@/components/ui/pricing";
import { getActualUser } from "@/lib/auth/server";
import { getPricingForRole } from "@/server/api/routers/pricing";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

/**
 *
 *  Manager presentation on Videoach page
 *
 */

export default async function ManagerPage() {
  const pricingQuery = await getPricingForRole("MANAGER");
  const t = await getTranslations("home");
  const user = await getActualUser();

  return (
    <div>
      <section className="hero bg-base-100">
        <div className="hero-content py-48 text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t("manager-title")}</h1>
            <p className="py-6 text-lg">{t("manager-text")}</p>
          </div>
        </div>
      </section>
      <section className="bg-base-100">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("features.manager")}</h2>
          <FeatureContainer>
            <Feature
              title={t("features.management.title")}
              description={t("features.management.description")}
            >
              <i className="bx bx-building bx-lg text-accent" />
            </Feature>
            <Feature
              title={t("features.communication.title")}
              description={t("features.communication.description")}
            >
              <i className="bx bx-bell bx-lg text-accent" />
            </Feature>
            <Feature
              title={t("features.page.title")}
              description={t("features.page.description")}
            >
              <i className="bx bx-windows bx-lg text-accent" />
            </Feature>
            <Feature
              title={t("features.mobile.title")}
              description={t("features.mobile.description")}
            >
              <i className="bx bx-mobile-alt bx-lg text-accent" />
            </Feature>
          </FeatureContainer>
        </div>
      </section>
      <section className="bg-base-200">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("pricing.usage")}</h2>
          <p className="alert alert-info">{t("pricing.try-offer")}</p>
          <PricingContainer>
            {pricingQuery?.map((pricing) => (
              <PricingComponent key={pricing.id} data={pricing} />
            ))}
          </PricingContainer>
          {user?.id ? (
            <div className="text-center">
              {t("pricing.go-to-account")}{" "}
              <Link href={`/user/${user?.id}/account`}>
                <button className="btn btn-accent my-4">
                  {t("pricing.my-account")}
                </button>
              </Link>
            </div>
          ) : (
            <Link href="/user/signin">
              <button className="btn-accent btn-block btn my-4">
                {t("pricing.create-your-account")}
              </button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
