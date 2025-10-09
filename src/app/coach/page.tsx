import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Feature, FeatureContainer } from "@/components/ui/features";
import { getPricingForRole } from "@/server/api/routers/pricing";
import { PricingContainer } from "@/components/ui/pricing";
import { PricingComponent } from "@/components/ui/pricing";
import { getActualUser } from "@/lib/auth/server";
import Title from "@/components/title";

export default async function CoachPage() {
  const pricingQuery = await getPricingForRole("COACH");
  const t = await getTranslations("home");
  const user = await getActualUser();

  return (
    <div>
      <Title title={t("coach-title")} />
      <section className="hero bg-base-100">
        <div className="hero-content py-48 text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t("coach-title")}</h1>
            <p className="py-6 text-lg">{t("coach-text")}</p>
          </div>
        </div>
      </section>
      <section className="bg-base-100">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("features.coach")}</h2>
          <FeatureContainer>
            <Feature
              title={t("features.coaching.title")}
              description={t("features.coaching.description")}
            >
              <i className="bx bx-user-check bx-lg text-accent" />
            </Feature>
            <Feature
              title={t("features.coach-communication.title")}
              description={t("features.coach-communication.description")}
            >
              <i className="bx bx-bell bx-lg text-accent" />
            </Feature>
            <Feature
              title={t("features.video.title")}
              description={t("features.video.description")}
            >
              <i className="bx bx-video bx-lg text-accent" />
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
              <button className="btn btn-accent btn-block my-4">
                {t("pricing.create-your-account")}
              </button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
